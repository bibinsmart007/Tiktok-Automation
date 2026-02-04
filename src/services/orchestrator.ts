import { generateVideoContent } from './content-generator';
import { GoogleTTSService } from './google-tts';
import { GoogleVeoService } from './google-veo';
import { TikTokAPIService } from './tiktok-api';
import { getTopicForDay } from '../data/topics';
import { GenerationResult } from '../types';
import { logger } from '../utils/logger';

export class VideoOrchestrator {
    private ttsService: GoogleTTSService;
    private veoService: GoogleVeoService;
    private tiktokService: TikTokAPIService;

    constructor() {
        this.ttsService = new GoogleTTSService();
        this.veoService = new GoogleVeoService();
        this.tiktokService = new TikTokAPIService();
    }

    /**
     * Generate and post a complete TikTok video for today
     */
    async generateAndPostDailyVideo(): Promise<GenerationResult> {
        const startTime = Date.now();
        logger.info('Starting daily video generation pipeline');

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
            logger.info('Audio generated successfully', { audioPath });

            // Step 4: Generate video using Google Veo
            const videoFilename = `video-${Date.now()}.mp4`;
            const videoPath = await this.veoService.generateVideo(
                content.veo_prompt,
                content.veo_prompt_style,
                videoFilename
            );
            logger.info('Video generated successfully', { videoPath });

            // Step 5: Post to TikTok
            const postId = await this.tiktokService.postVideo(
                videoPath,
                content.tiktok_caption,
                content.tiktok_hashtags
            );
            logger.info('Video posted to TikTok', { postId });

            const executionTime = Date.now() - startTime;
            logger.info('Daily video pipeline completed successfully', {
                executionTimeMs: executionTime,
                postId
            });

            return {
                success: true,
                video_path: videoPath,
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
     * Test all service connections
     */
    async testAllConnections(): Promise<{
        tts: boolean;
        veo: boolean;
        tiktok: boolean;
    }> {
        logger.info('Testing all service connections');

        const results = {
            tts: await this.ttsService.testConnection(),
            veo: await this.veoService.testConnection(),
            tiktok: await this.tiktokService.testConnection()
        };

        logger.info('Connection test results', results);
        return results;
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
