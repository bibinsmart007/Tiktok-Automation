# 🎬 TikTok Video Automation System

Automatically generate and post engaging TikTok videos daily using AI. This system uses Google Cloud Text-to-Speech for voiceovers, Google Veo for video generation, and the TikTok API for automated posting.

## 🚀 Features

- **Daily Automated Content**: Generates 1 unique video every day with rotating topics
- **30+ Topic Database**: Covers AI tools, online business, and faceless storytelling niches
- **High-Retention Scripts**: Uses proven hook formats (pain+promise, curiosity, identity callouts)
- **Google Cloud TTS Integration**: Professional voiceovers with customizable voice parameters
- **Google Veo Video Generation**: AI-generated visuals optimized for 9:16 TikTok format
- **TikTok API Integration**: Automatic upload and posting with captions and hashtags
- **Railway Ready**: One-click deployment with cron scheduling
- **Comprehensive Logging**: Track all operations with Winston logger

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (version 18 or higher)
2. **Google Cloud Account** with:
   - Text-to-Speech API enabled
   - Vertex AI API enabled
   - Service account with appropriate permissions
3. **TikTok Developer Account** with:
   - Client Key and Secret
   - Access Token (for posting)
4. **Railway Account** (for deployment)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
cd C:\Users\USER\.gemini\antigravity\scratch\tiktok-video-automation
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_PROJECT_ID=your-google-cloud-project-id
GOOGLE_LOCATION=us-central1

# TikTok API Configuration
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_ACCESS_TOKEN=your-tiktok-access-token

# Scheduling (default: 9 AM every day)
POST_SCHEDULE=0 9 * * *
TIMEZONE=America/New_York

# Content Configuration
CONTENT_NICHE=mixed

# Storage
OUTPUT_DIR=./output

# Logging
LOG_LEVEL=info
```

### 3. Google Cloud Setup

#### a) Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Click **Create Service Account**
4. Grant these roles:
   - Text-to-Speech Admin
   - Vertex AI User
5. Create and download the JSON key file
6. Save it as `service-account-key.json` in the project root

#### b) Enable Required APIs

```bash
gcloud services enable texttospeech.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

### 4. TikTok API Setup

#### a) Register Your App

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Add these scopes:
   - `video.upload`
   - `video.publish`
4. Get your **Client Key** and **Client Secret**

#### b) Get Access Token

Follow the [TikTok OAuth flow](https://developers.tiktok.com/doc/login-kit-web) to obtain an access token for your account.

### 5. Test Your Setup

Run the connection test script:

```bash
npm run test
```

You should see:

```
✅ Google TTS: Connected
✅ Vertex AI: Connected
✅ TikTok API: Connected
```

### 6. Generate a Test Video

Test content generation without posting:

```bash
npm run generate
```

This will output a complete video JSON to your console.

## 🎯 Usage

### Local Development

Run the system locally:

```bash
npm run dev
```

This will:

1. Test all service connections
2. Start the cron scheduler
3. Wait for the scheduled time to generate and post videos

### Build for Production

```bash
npm run build
npm start
```

### Generate Video Immediately

To test the full pipeline (content → audio → video → TikTok):

```bash
# Add this to your .env
GENERATE_ON_STARTUP=true

npm start
```

## 🚂 Railway Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [Railway](https://railway.app/)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway will auto-detect the configuration from `railway.json`

### 3. Add Environment Variables

In Railway dashboard:

1. Go to **Variables** tab
2. Add all variables from your `.env` file
3. For `GOOGLE_APPLICATION_CREDENTIALS`:
   - Upload `service-account-key.json` to Railway
   - Or paste the JSON content directly

### 4. Deploy

Railway will automatically build and deploy. Your system will start running on the scheduled time!

## 📊 Project Structure

```
tiktok-video-automation/
├── src/
│   ├── data/
│   │   └── topics.ts              # 30+ rotating content topics
│   ├── services/
│   │   ├── content-generator.ts   # Video content JSON generator
│   │   ├── google-tts.ts          # Text-to-Speech integration
│   │   ├── google-veo.ts          # Video generation (Veo)
│   │   ├── tiktok-api.ts          # TikTok posting
│   │   └── orchestrator.ts        # Main pipeline coordinator
│   ├── scripts/
│   │   ├── generate-one.ts        # Test content generation
│   │   └── test-apis.ts           # Test API connections
│   ├── utils/
│   │   └── logger.ts              # Winston logger
│   ├── types.ts                   # TypeScript definitions
│   └── index.ts                   # Main entry point
├── .env.example                   # Environment template
├── railway.json                   # Railway deployment config
├── package.json
└── tsconfig.json
```

## 🎨 Content Configuration

### Niches Supported

1. **AI Tools & Automation** - AI productivity tools, automation workflows
2. **Online Business / Make Money** - Side hustles, business models, entrepreneurship
3. **Faceless Storytelling** - Case studies, success stories, cautionary tales

### Hook Formats

The system rotates through proven hook formats:

- **Pain + Promise**: "If your videos get 0 views, watch this."
- **Curiosity**: "This one AI tool works harder than 3 employees."
- **Identity Callout**: "If you're 18-30 and not using this, you're behind."
- **Open Loop**: "I accidentally found a way to make money while I sleep."

### Topic Rotation

Topics rotate daily based on day of year, ensuring:

- No repeated content for 30+ days
- Balanced niche distribution
- Variety in angles and approaches

## 🔧 Customization

### Change Posting Schedule

Edit the cron expression in `.env`:

```env
# Every day at 9 AM
POST_SCHEDULE=0 9 * * *

# Twice daily (9 AM and 6 PM)
POST_SCHEDULE=0 9,18 * * *

# Every 6 hours
POST_SCHEDULE=0 */6 * * *
```

### Adjust Voice Parameters

Edit `src/services/content-generator.ts`:

```typescript
tts_voice_params: {
  languageCode: 'en-US',
  name: 'en-US-Neural2-A',  // Change to female voice
  ssmlGender: 'FEMALE',
  speakingRate: 1.0,         // Slower pace
  pitch: -2.0,               // Lower pitch
  audioEncoding: 'MP3'
}
```

Available voices: [Google TTS Voice List](https://cloud.google.com/text-to-speech/docs/voices)

### Add Custom Topics

Edit `src/data/topics.ts`:

```typescript
{
  niche: 'ai_tools',
  angle: 'Your custom angle here',
  hook_format: 'Your hook here',
  target_audience: 'Your target audience'
}
```

## 📈 Monitoring

### View Logs

```bash
# Real-time logs
tail -f combined.log

# Error logs only
tail -f error.log
```

### Railway Logs

In Railway dashboard:

1. Go to **Deployments** tab
2. Click on active deployment
3. View real-time logs

## 🐛 Troubleshooting

### Google TTS Connection Failed

- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Ensure service account has Text-to-Speech Admin role
- Check if Text-to-Speech API is enabled

### Veo Video Generation Not Working

- Veo is currently in preview/limited access
- Contact Google Cloud to request access
- Alternative: Use video composition with stock footage (see `google-veo.ts`)

### TikTok API Authentication Failed

- Verify access token is not expired
- Check if required scopes are granted
- Use `refreshAccessToken()` method if needed

### Videos Not Posting

- Check TikTok API rate limits
- Verify video file format (MP4, H.264)
- Ensure caption doesn't exceed character limits

## 🎓 Next Steps

1. **Monitor Performance**: Track which topics get the most engagement
2. **Optimize Hooks**: A/B test different hook formats
3. **Scale Content**: Add more topics to the database
4. **Add Analytics**: Integrate TikTok analytics tracking
5. **Enhance Visuals**: Experiment with different Veo prompts

## 📚 Resources

- [Google Cloud TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [Google Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [TikTok API Documentation](https://developers.tiktok.com/doc/overview)
- [Railway Documentation](https://docs.railway.app/)
- [Cron Expression Reference](https://crontab.guru/)

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review service-specific documentation
3. Check Railway deployment logs
4. Verify all environment variables are set correctly

## 📄 License

MIT License - feel free to modify and use for your own projects!

---

**Built with ❤️ for automated TikTok growth**
