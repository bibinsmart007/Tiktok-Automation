import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface StockVideo {
  id: number;
  url: string;
  duration: number;
  width: number;
  height: number;
  videoFiles: {
    quality: string;
    link: string;
    width: number;
    height: number;
  }[];
}

export class StockVideoService {
  private apiKey: string;
  private baseUrl: string;
  private outputDir: string;
  private videosDir: string;

  constructor() {
    // Pexels API is FREE - just need to register at pexels.com/api
    this.apiKey = process.env.PEXELS_API_KEY || '';
    this.baseUrl = 'https://api.pexels.com/videos';
    this.outputDir = process.env.OUTPUT_DIR || './output';
    this.videosDir = path.join(this.outputDir, 'stock-videos');

    if (!fs.existsSync(this.videosDir)) {
      fs.mkdirSync(this.videosDir, { recursive: true });
    }
  }

  /**
   * Search and download stock video based on niche/topic
   */
  async getVideoForNiche(niche: string): Promise<string> {
    try {
      // Search queries optimized for TikTok content
      const searchQueries: Record<string, string[]> = {
        ai_tools: [
          'technology computer',
          'coding programming',
          'robot artificial intelligence',
          'futuristic technology',
          'digital interface',
          'laptop working'
        ],
        online_business: [
          'entrepreneur laptop',
          'money success',
          'working coffee shop',
          'business meeting',
          'startup office',
          'typing keyboard'
        ],
        faceless_stories: [
          'motivation success',
          'city lights night',
          'sunrise inspiration',
          'walking alone',
          'thinking contemplating',
          'journey path'
        ]
      };

      const queries = searchQueries[niche] || searchQueries.ai_tools;
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];

      logger.info('Searching for stock video', { niche, query: randomQuery });

      // Search for vertical videos (TikTok format)
      const videos = await this.searchVideos(randomQuery, 'portrait');
      
      if (videos.length === 0) {
        throw new Error(`No videos found for query: ${randomQuery}`);
      }

      // Pick a random video from results
      const selectedVideo = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
      
      // Download the video
      const videoPath = await this.downloadVideo(selectedVideo);
      
      logger.info('Stock video downloaded', { videoPath, videoId: selectedVideo.id });
      return videoPath;

    } catch (error) {
      logger.error('Failed to get stock video', { error });
      throw error;
    }
  }

  /**
   * Search videos on Pexels
   */
  private async searchVideos(
    query: string,
    orientation: 'landscape' | 'portrait' | 'square' = 'portrait',
    perPage: number = 15
  ): Promise<StockVideo[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': this.apiKey
        },
        params: {
          query,
          orientation,
          per_page: perPage,
          size: 'medium' // medium quality for faster downloads
        }
      });

      return response.data.videos.map((video: any) => ({
        id: video.id,
        url: video.url,
        duration: video.duration,
        width: video.width,
        height: video.height,
        videoFiles: video.video_files.map((file: any) => ({
          quality: file.quality,
          link: file.link,
          width: file.width,
          height: file.height
        }))
      }));

    } catch (error) {
      logger.error('Pexels API search failed', { error });
      throw error;
    }
  }

  /**
   * Download video file from Pexels
   */
  private async downloadVideo(video: StockVideo): Promise<string> {
    try {
      // Find the best quality vertical video (HD preferred)
      const hdFile = video.videoFiles.find(
        f => f.quality === 'hd' && f.height > f.width
      );
      const sdFile = video.videoFiles.find(
        f => f.quality === 'sd' && f.height > f.width
      );
      const anyVertical = video.videoFiles.find(f => f.height > f.width);
      
      const selectedFile = hdFile || sdFile || anyVertical || video.videoFiles[0];
      
      if (!selectedFile) {
        throw new Error('No suitable video file found');
      }

      const filename = `stock-${video.id}-${Date.now()}.mp4`;
      const outputPath = path.join(this.videosDir, filename);

      logger.info('Downloading video file', {
        quality: selectedFile.quality,
        width: selectedFile.width,
        height: selectedFile.height
      });

      const response = await axios({
        method: 'GET',
        url: selectedFile.link,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
      });

    } catch (error) {
      logger.error('Failed to download video', { error });
      throw error;
    }
  }

  /**
   * Get a cached video if available, otherwise download new one
   */
  async getOrDownloadVideo(niche: string): Promise<string> {
    // Check if we have any cached videos for this niche
    const cachedVideos = this.getCachedVideos();
    
    if (cachedVideos.length > 0 && Math.random() > 0.3) {
      // 70% chance to use cached video to reduce API calls
      const randomCached = cachedVideos[Math.floor(Math.random() * cachedVideos.length)];
      logger.info('Using cached stock video', { path: randomCached });
      return randomCached;
    }

    // Download new video
    return this.getVideoForNiche(niche);
  }

  /**
   * Get list of cached video files
   */
  private getCachedVideos(): string[] {
    try {
      const files = fs.readdirSync(this.videosDir);
      return files
        .filter(f => f.endsWith('.mp4'))
        .map(f => path.join(this.videosDir, f));
    } catch {
      return [];
    }
  }

  /**
   * Clean up old cached videos (keep last 20)
   */
  cleanupOldVideos(keepCount: number = 20): void {
    try {
      const videos = this.getCachedVideos();
      if (videos.length <= keepCount) return;

      // Sort by modification time (oldest first)
      const sortedVideos = videos
        .map(v => ({ path: v, mtime: fs.statSync(v).mtime.getTime() }))
        .sort((a, b) => a.mtime - b.mtime);

      // Delete oldest videos
      const toDelete = sortedVideos.slice(0, videos.length - keepCount);
      toDelete.forEach(v => {
        fs.unlinkSync(v.path);
        logger.info('Deleted old cached video', { path: v.path });
      });

    } catch (error) {
      logger.warn('Failed to cleanup old videos', { error });
    }
  }

  /**
   * Test Pexels API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        logger.warn('Pexels API key not configured');
        return false;
      }

      const response = await axios.get(`${this.baseUrl}/popular`, {
        headers: { 'Authorization': this.apiKey },
        params: { per_page: 1 }
      });

      logger.info('Pexels API connection successful');
      return response.status === 200;

    } catch (error) {
      logger.error('Pexels API connection failed', { error });
      return false;
    }
  }
}
