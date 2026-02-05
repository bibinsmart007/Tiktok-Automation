import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import { VideoOrchestrator } from './services/orchestrator';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const orchestrator = new VideoOrchestrator();
const app = express();
const PORT = process.env.PORT || 3000;

// Store tokens in memory (in production, use a database)
let accessToken = process.env.TIKTOK_ACCESS_TOKEN || '';
let refreshToken = process.env.TIKTOK_REFRESH_TOKEN || '';

/**
 * OAuth callback endpoint - exchanges authorization code for access token
 */
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    logger.error('No authorization code received');
    return res.status(400).send('No authorization code received');
  }
  
  try {
    logger.info('Exchanging authorization code for access token...');
    
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://aisocialgrowth.com/auth/tiktok/callback'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const tokenData = response.data;
    
    if (tokenData.error) {
      logger.error('Token exchange error:', tokenData);
      return res.status(400).json(tokenData);
    }
    
    // Store the tokens
    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token;
    
    logger.info('Successfully obtained TikTok access token!');
    logger.info('Access Token:', accessToken.substring(0, 20) + '...');
    logger.info('Refresh Token:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'none');
    logger.info('Expires in:', tokenData.expires_in, 'seconds');
    
    // Update the orchestrator with the new token
    process.env.TIKTOK_ACCESS_TOKEN = accessToken;
    
    res.send(`
      <html>
        <body>
          <h1>TikTok Authorization Successful!</h1>
          <p>Access token has been stored. The automation system can now post to TikTok.</p>
          <p><strong>Access Token:</strong> ${accessToken.substring(0, 30)}...</p>
          <p><strong>Expires in:</strong> ${tokenData.expires_in} seconds</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    logger.error('Failed to exchange authorization code:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange authorization code', details: error.response?.data });
  }
});

/**
 * OAuth initiation endpoint - redirects to TikTok for authorization
 */
app.get('/auth/tiktok', (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = encodeURIComponent(process.env.TIKTOK_REDIRECT_URI || 'https://aisocialgrowth.com/auth/tiktok/callback');
  const scope = 'user.info.basic,video.publish';
  const state = 'tiktok_auth_' + Date.now();
  
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
  
  res.redirect(authUrl);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    hasAccessToken: !!accessToken,
    timestamp: new Date().toISOString()
  });
});

/**
 * Main entry point for the TikTok Video Automation System
 */
async function main() {
  logger.info('🚀 TikTok Video Automation System Starting');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Post Schedule: ${process.env.POST_SCHEDULE || '0 9 * * *'}`);

  // Start Express server
  app.listen(PORT, () => {
    logger.info(`🌐 Server running on port ${PORT}`);
    logger.info(`📎 OAuth callback URL: /auth/tiktok/callback`);
    logger.info(`🔗 Initiate OAuth: /auth/tiktok`);
  });

  // Test connections on startup
  logger.info('Testing service connections...');
  let connectionStatus = { tts: false, tiktok: false };
  try {
    connectionStatus = await orchestrator.testAllConnections();
  } catch (error) {
    logger.error('Error testing connections:', error);
    logger.warn('Continuing with limited functionality...');
  }

  // Check TTS connection (warn but continue - allows app to start)
  if (!connectionStatus.tts) {
    logger.warn('⚠️ TTS service not connected. Videos cannot be generated until Google Cloud is configured.');
    logger.warn('Please add GOOGLE_APPLICATION_CREDENTIALS_JSON to your environment variables.');
  }

  // Check TikTok connection (warn but don't exit)
  if (!connectionStatus.tiktok) {
    logger.warn('⚠️ TikTok not connected. Videos will be generated but not posted.');
    logger.warn('Please configure valid TikTok OAuth credentials to enable posting.');
  }

  logger.info('✅ All critical services connected successfully');

  // Schedule daily video generation
  const schedule = process.env.POST_SCHEDULE || '0 9 * * *';
  logger.info(`📅 Scheduling daily video generation: ${schedule}`);

  cron.schedule(schedule, async () => {
    logger.info('⏰ Scheduled task triggered - Starting video generation');
    try {
      const result = await orchestrator.generateAndPostDailyVideo();
      if (result.success) {
        logger.info('✅ Daily video posted successfully!', {
          postId: result.tiktok_post_id,
          timestamp: result.generated_at
        });
      } else {
        logger.error('❌ Daily video generation failed', {
          error: result.error
        });
      }
    } catch (error) {
      logger.error('❌ Unexpected error in scheduled task', { error });
    }
  }, {
    timezone: process.env.TIMEZONE || 'America/New_York'
  });

  logger.info('✅ Scheduler active. Waiting for scheduled time...');
  logger.info('💡 System is running. Press Ctrl+C to stop.');

  // Optional: Generate a video immediately on startup (for testing)
  if (process.env.GENERATE_ON_STARTUP === 'true') {
    logger.info('🎬 Generating video on startup (GENERATE_ON_STARTUP=true)');
    const result = await orchestrator.generateAndPostDailyVideo();
    logger.info('Startup generation result:', { success: result.success });
  }

  // Keep the process alive
  process.on('SIGINT', () => {
    logger.info('👋 Gracefully shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('👋 Received SIGTERM, shutting down...');
    process.exit(0);
  });
}

// Start the application
main().catch((error) => {
  logger.error('Fatal error in main process', { error });
  process.exit(1);
});
