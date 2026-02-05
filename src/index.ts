import cron from 'node-cron';
import dotenv from 'dotenv';
import { VideoOrchestrator } from './services/orchestrator';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const orchestrator = new VideoOrchestrator();

/**
 * Main entry point for the TikTok Video Automation System
 */
async function main() {
    logger.info('🚀 TikTok Video Automation System Starting');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Post Schedule: ${process.env.POST_SCHEDULE || '0 9 * * *'}`);

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
