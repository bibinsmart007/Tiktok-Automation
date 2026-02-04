import { generateVideoContent } from './content-generator';
import { GoogleTTSService } from './google-tts';
import { TikTokAPIService } from './tiktok-api';
import { VideoComposerService } from './video-composer';
import { StockVideoService } from './stock-video';
import { BGMManagerService } from './bgm-manager';
import { getTopicForDay } from '../data/topics';
import { GenerationResult } from '../types';
import { logger } from '../utils/logger';
import path from 'path';

export class VideoOrchestrator {
  private ttsService: GoogleTTSService;
  private tiktokService: TikTokAPIService;
  private videoComposer: VideoComposerService;
  private stockVideoService: StockVideoService;
  private bgmManager: BGMManagerService;
  private outputDir: string;

  constructor() {
    this.ttsService = new GoogleTTSService();
    this.tiktokService = new TikTokAPIService();
    this.videoComposer = new VideoComposerService();
    this.stockVideoService = new StockVideoService();
    this.bgmManager = new BGMManagerService();
    this.outputDir = process.env.OUTPUT_DIR || './output';
  }

  /**
   * Generate and post a complete TikTok video for today
   * Uses FREE resources: Stock videos + TTS + BGM composition
   */
  async generateAndPostDailyVideo(): Promise<GenerationResult> {
    const startTime = Date.now();
    logger.info('Starting daily video generation pipeline (COST-FREE MODE)');

    try {
      // Step 1: Get today's topic
      const dayOfYear = this.getDayOfYear();
      const topic = getTopicForDay(dayOfYear);
      logger.info('Topic selected for today', {
        niche: topic.niche,
        angle: topic.angle
      });

      // Step 2: Generate video content JSON
      const content = generateVideoContent(topic);
      logger.info('Video content generated', {
        scriptLength: content.script_for_tts.length,
        hashtags: content.tiktok_hashtags.length
      });

      // Step 3: Generate audio using Google TTS
      const audioFilename = `audio-${Date.now()}.mp3`;
      const audioPath = await this.ttsService.generateAudio(
        content.script_for_tts,
        content.tts_voice_params,
        audioFilename
      );
      logger.info('TTS Audio generated successfully', { audioPath });

      // Step 4: Get stock video from Pexels (FREE)
      const stockVideoPath = await this.stockVideoService.getOrDownloadVideo(topic.niche);
      logger.info('Stock video obtained', { stockVideoPath });

      // Step 5: Get background music (FREE - from local library)
      let bgmPath: string | null = null;
      try {
        bgmPath = await this.bgmManager.getBGMForNiche(topic.niche);
        logger.info('BGM obtained', { bgmPath });
      } catch (error) {
        logger.warn('No BGM available, proceeding without background music', { error });
        // Create silent audio as fallback
        bgmPath = await this.createSilentAudio();
      }

      // Step 6: Compose final video with FFmpeg (FREE)
      const finalVideoPath = path.join(this.outputDir, `tiktok-video-${Date.now()}.mp4`);
      await this.videoComposer.composeVideo({
        audioPath,
        bgmPath: bgmPath!,
        stockVideoPath,
        textSegments: content.on_screen_text_segments,
        outputPath: finalVideoPath,
        bgmVolume: 0.15
      });
      logger.info('Video composed successfully', { finalVideoPath });

      // Step 7: Post to TikTok
      const postId = await this.tiktokService.postVideo(
        finalVideoPath,
        content.tiktok_caption,
        content.tiktok_hashtags
      );
      logger.info('Video posted to TikTok', { postId });

      const executionTime = Date.now() - startTime;
      logger.info('Daily video pipeline completed successfully', {
        executionTimeMs: executionTime,
        postId,
        costIncurred: '$0.00 (FREE stock video + BGM)'
      });

      // Cleanup old cached videos
      this.stockVideoService.cleanupOldVideos(20);

      return {
        success: true,
        video_path: finalVideoPath,
        audio_path: audioPath,
        tiktok_post_id: postId,
        content,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Daily video pipeline failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: {} as any,
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Generate content only (no posting) - useful for testing
   */
  async generateContentOnly(): Promise<GenerationResult> {
    logger.info('Generating content without posting');

    try {
      const dayOfYear = this.getDayOfYear();
      const topic = getTopicForDay(dayOfYear);
      const content = generateVideoContent(topic);

      logger.info('Content generation completed', {
        niche: topic.niche,
        scriptLength: content.script_for_tts.length
      });

      return {
        success: true,
        content,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Content generation failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: {} as any,
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Generate video without posting (for preview)
   */
  async generateVideoPreview(): Promise<GenerationResult> {
    logger.info('Generating video preview (no TikTok posting)');

    try {
      const dayOfYear = this.getDayOfYear();
      const topic = getTopicForDay(dayOfYear);
      const content = generateVideoContent(topic);

      // Generate audio
      const audioPath = await this.ttsService.generateAudio(
        content.script_for_tts,
        content.tts_voice_params,
        `preview-audio-${Date.now()}.mp3`
      );

      // Get stock video
      const stockVideoPath = await this.stockVideoService.getOrDownloadVideo(topic.niche);

      // Get BGM
      let bgmPath = await this.bgmManager.getAnyAvailableBGM();
      if (!bgmPath) {
        bgmPath = await this.createSilentAudio();
      }

      // Compose video
      const finalVideoPath = path.join(this.outputDir, `preview-${Date.now()}.mp4`);
      await this.videoComposer.composeVideo({
        audioPath,
        bgmPath,
        stockVideoPath,
        textSegments: content.on_screen_text_segments,
        outputPath: finalVideoPath,
        bgmVolume: 0.15
      });

      logger.info('Preview video generated', { finalVideoPath });

      return {
        success: true,
        video_path: finalVideoPath,
        audio_path: audioPath,
        content,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Preview generation failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: {} as any,
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Create silent audio file for when no BGM is available
   */
  private async createSilentAudio(): Promise<string> {
    const silentPath = path.join(this.outputDir, 'silent.mp3');
    // This would normally use FFmpeg to create silent audio
    // For now, return path - the video composer will handle missing BGM
    logger.warn('Using silent audio fallback');
    return silentPath;
  }

  /**
   * Test all service connections
   */
  async testAllConnections(): Promise<{
    tts: boolean;
    tiktok: boolean;
    ffmpeg: boolean;
    pexels: boolean;
    bgm: boolean;
  }> {
    logger.info('Testing all service connections');

    const results = {
      tts: await this.ttsService.testConnection(),
      tiktok: await this.tiktokService.testConnection(),
      ffmpeg: await this.videoComposer.testConnection(),
      pexels: await this.stockVideoService.testConnection(),
      bgm: await this.bgmManager.testConnection()
    };

    logger.info('Connection test results', results);
    return results;
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    logger.info('Initializing video orchestrator services');
    await this.bgmManager.initializeLibrary();
    logger.info('Orchestrator initialized');
  }

  /**
   * Get current day of year (1-365/366)
   */
  private getDayOfYear(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
}
