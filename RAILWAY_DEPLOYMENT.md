# 🚂 Railway Deployment Guide

## ✅ Prerequisites Complete

Your project is now on GitHub at:
**<https://github.com/bibinsmart007/tiktok-automation>**

Now let's deploy it to Railway for automated daily posting!

---

## 📋 Step-by-Step Railway Deployment

### 1. Sign Up / Login to Railway

1. Go to <https://railway.app/>
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with your **GitHub account** (this auto-connects your repos)

### 2. Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. You'll see a list of your repositories
4. Find and click **"bibinsmart007/tiktok-automation"**
5. Railway will start deployment automatically

### 3. Configure Environment Variables

This is the **most important step**! You need to add all your API credentials.

#### In Railway Dashboard

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these one by one:

```env
GOOGLE_PROJECT_ID=your-google-cloud-project-id
GOOGLE_LOCATION=us-central1
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_ACCESS_TOKEN=your-tiktok-access-token
POST_SCHEDULE=0 9 * * *
TIMEZONE=America/New_York
CONTENT_NICHE=mixed
OUTPUT_DIR=/tmp/output
LOG_LEVEL=info
NODE_ENV=production
```

#### Special: Google Service Account Credentials

For `GOOGLE_APPLICATION_CREDENTIALS`, you have two options:

**Option A: Upload JSON File**

1. In Railway, go to **Variables** tab
2. Click **"New Variable"**
3. Name: `GOOGLE_APPLICATION_CREDENTIALS`
4. Value: `/app/service-account-key.json`
5. Then create another variable:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: Paste your entire JSON key file content (the whole thing!)
6. Add a build script to create the file (see below)

**Option B: Paste JSON Content Directly**

1. Open your `service-account-key.json`
2. Copy the entire contents
3. In Railway Variables:
   - Name: `GOOGLE_CREDENTIALS_JSON`
   - Value: Paste the entire JSON
4. Update your code to use this (I'll provide the update)

### 4. Wait for Deployment

Railway will:

1. ✅ Detect Node.js project
2. ✅ Run `npm install`
3. ✅ Run `npm run build`
4. ✅ Start with `npm start`
5. ✅ Show live logs

Watch the deployment logs for any errors!

### 5. Verify Deployment

In Railway logs, you should see:

```
🚀 TikTok Video Automation System Starting
Testing service connections...
✅ Google TTS: Connected
✅ Vertex AI: Connected
✅ TikTok API: Connected
📅 Scheduling daily video generation: 0 9 * * *
✅ Scheduler active. Waiting for scheduled time...
```

---

## 🔑 Getting Your API Credentials

### Google Cloud Platform

1. Go to <https://console.cloud.google.com/>
2. Create a new project or select existing
3. **Enable APIs**:

   ```
   - Cloud Text-to-Speech API
   - Vertex AI API
   ```

4. **Create Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Roles: "Text-to-Speech Admin" + "Vertex AI User"
   - Create JSON key → Download
5. **Get Project ID**: Copy from project dashboard

### TikTok Developer Account

1. Go to <https://developers.tiktok.com/>
2. Create an app (if not already done)
3. Get **Client Key** and **Client Secret** from dashboard
4. **Get Access Token**:
   - Follow OAuth 2.0 flow
   - Required scopes: `video.upload`, `video.publish`
   - Token expires - you may need to refresh periodically

---

## ⚙️ Post-Deployment Configuration

### Check Logs

In Railway dashboard:

1. Click on your service
2. Go to **"Deployments"** tab
3. Click latest deployment
4. View real-time logs

### Test the System

Option 1: **Wait for Scheduled Time** (9 AM by default)

Option 2: **Trigger Manually**

- Set `GENERATE_ON_STARTUP=true` in variables
- Redeploy (Railway will restart)
- Video will generate immediately on startup

### Monitor Performance

Railway provides:

- CPU usage
- Memory usage
- Deployment history
- Crash detection and auto-restart

---

## 🎯 Common Post-Deployment Tasks

### Change Posting Schedule

Edit the `POST_SCHEDULE` variable in Railway:

```env
0 9 * * *     # Every day at 9 AM
0 9,18 * * *  # Twice daily (9 AM and 6 PM)
0 */6 * * *   # Every 6 hours
```

After changing, click **"Redeploy"**

### Update Code

```bash
# In your local project
git add .
git commit -m "Update: your changes"
git push origin main
```

Railway will automatically detect the push and redeploy!

### View Generated Videos

Check Railway logs to see:

- Content generation status
- Audio/video file paths
- TikTok post IDs
- Any errors

---

## 🐛 Troubleshooting

### "Google TTS: Failed"

- Check `GOOGLE_PROJECT_ID` is correct
- Verify service account JSON is properly formatted
- Ensure Text-to-Speech API is enabled

### "TikTok API: Failed"

- Verify access token hasn't expired
- Check client key and secret are correct
- Confirm required scopes are granted

### "Out of Memory"

- In Railway: Settings → increase memory allocation
- Or: Optimize video generation settings

### Videos Not Posting

- Check Railway logs for errors
- Verify cron schedule is correct
- Ensure timezone is set properly

---

## 📊 Monitoring Your Automation

### Daily Checklist

- [ ] Check Railway logs for successful posting
- [ ] Verify video appeared on TikTok
- [ ] Monitor engagement metrics
- [ ] Review any errors in logs

### Weekly Review

- [ ] Analyze which topics performed best
- [ ] Adjust content strategy if needed
- [ ] Check API usage and costs
- [ ] Ensure access tokens are still valid

---

## 💰 Cost Estimates

### Railway

- **Free Tier**: $5 credit/month (enough for this project!)
- **Estimated usage**: ~$2-3/month for always-on service

### Google Cloud

- **Text-to-Speech**: ~$0.001 per second of audio
- **Vertex AI (Veo)**: Pricing varies (currently in preview)
- **Estimated**: ~$5-10/month for daily videos

### TikTok API

- **Free** to use (no posting fees)
- Just need developer account

**Total Estimated Cost**: $7-15/month

---

## 🎉 Success

Once deployed, your system will:

- ✅ Generate unique content daily
- ✅ Create professional voiceovers
- ✅ Generate vertical TikTok videos
- ✅ Post automatically at scheduled time
- ✅ Track performance and log everything
- ✅ Run 24/7 without your intervention

## 🚀 Next Steps

1. **Deploy to Railway now** using steps above
2. **Test with first video** (set `GENERATE_ON_STARTUP=true`)
3. **Monitor for 1 week** to ensure stability
4. **Optimize based on performance**
5. **Scale up** if needed (multiple videos/day, multiple accounts)

---

**Need Help?**

- Railway Docs: <https://docs.railway.app/>
- Google Cloud Docs: <https://cloud.google.com/docs>
- TikTok API Docs: <https://developers.tiktok.com/doc/overview>

**Your Repository:**
<https://github.com/bibinsmart007/tiktok-automation>

Good luck with your TikTok automation! 🎬✨
