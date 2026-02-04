import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { TextSegment } from '../types';

export interface CompositionConfig {
  audioPath: string;
  bgmPath: string;
  stockVideoPath: string;
  textSegments: TextSegment[];
  outputPath: string;
  bgmVolume?: number; // 0-1, default 0.15
}

export class VideoComposerService {
  private outputDir: string;
  private tempDir: string;

  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './output';
    this.tempDir = path.join(this.outputDir, 'temp');
    
    // Ensure directories exist
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Compose final TikTok video with all elements
   */
  async composeVideo(config: CompositionConfig): Promise<string> {
    const { audioPath, bgmPath, stockVideoPath, textSegments, outputPath, bgmVolume = 0.15 } = config;
    
    logger.info('Starting video composition', {
      audioPath,
      bgmPath,
      stockVideoPath,
      outputPath
    });

    try {
      // Step 1: Mix TTS audio with background music
      const mixedAudioPath = path.join(this.tempDir, `mixed-audio-${Date.now()}.mp3`);
      await this.mixAudioWithBGM(audioPath, bgmPath, mixedAudioPath, bgmVolume);
      logger.info('Audio mixed successfully', { mixedAudioPath });

      // Step 2: Get audio duration for video length
      const audioDuration = await this.getMediaDuration(mixedAudioPath);
      logger.info('Audio duration', { audioDuration });

      // Step 3: Prepare video (loop/trim to match audio)
      const preparedVideoPath = path.join(this.tempDir, `prepared-video-${Date.now()}.mp4`);
      await this.prepareVideo(stockVideoPath, preparedVideoPath, audioDuration);
      logger.info('Video prepared successfully', { preparedVideoPath });

      // Step 4: Combine video with mixed audio
      const combinedPath = path.join(this.tempDir, `combined-${Date.now()}.mp4`);
      await this.combineVideoAndAudio(preparedVideoPath, mixedAudioPath, combinedPath);
      logger.info('Video and audio combined', { combinedPath });

      // Step 5: Add text overlays
      await this.addTextOverlays(combinedPath, textSegments, outputPath);
      logger.info('Text overlays added', { outputPath });

      // Clean up temp files
      this.cleanupTempFiles([mixedAudioPath, preparedVideoPath, combinedPath]);
      
      logger.info('Video composition completed successfully', { outputPath });
      return outputPath;

    } catch (error) {
      logger.error('Video composition failed', { error });
      throw error;
    }
  }

  /**
   * Mix TTS voiceover with background music
   */
  private mixAudioWithBGM(
    voiceoverPath: string,
    bgmPath: string,
    outputPath: string,
    bgmVolume: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(voiceoverPath)
        .input(bgmPath)
        .complexFilter([
          `[1:a]volume=${bgmVolume}[bgm]`,
          `[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`
        ])
        .outputOptions(['-map', '[aout]'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Get duration of media file in seconds
   */
  private getMediaDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 30);
      });
    });
  }

  /**
   * Prepare video: loop if shorter than audio, trim if longer
   */
  private prepareVideo(
    inputPath: string,
    outputPath: string,
    targetDuration: number
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const videoDuration = await this.getMediaDuration(inputPath);
      
      if (videoDuration >= targetDuration) {
        // Trim video to target duration
        ffmpeg(inputPath)
          .duration(targetDuration)
          .outputOptions(['-c:v', 'libx264', '-preset', 'fast'])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      } else {
        // Loop video to match target duration
        const loopCount = Math.ceil(targetDuration / videoDuration);
        ffmpeg(inputPath)
          .inputOptions([`-stream_loop`, `${loopCount}`])
          .duration(targetDuration)
          .outputOptions(['-c:v', 'libx264', '-preset', 'fast'])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      }
    });
  }

  /**
   * Combine video with audio
   */
  private combineVideoAndAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-preset', 'fast'
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  /**
   * Add text overlays to video using FFmpeg drawtext filter
   */
  private addTextOverlays(
    inputPath: string,
    segments: TextSegment[],
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!segments || segments.length === 0) {
        // No text overlays, just copy
        fs.copyFileSync(inputPath, outputPath);
        resolve();
        return;
      }

      // Build drawtext filter for each segment
      const drawTextFilters = segments.map((segment, index) => {
        const fontSize = segment.type === 'hook' ? 72 : segment.type === 'emphasis' ? 56 : 42;
        const yPosition = segment.type === 'subtitle' ? 'h-th-100' : '(h-th)/2';
        
        return `drawtext=text='${this.escapeText(segment.text)}':` +
          `fontsize=${fontSize}:fontcolor=white:` +
          `borderw=3:bordercolor=black:` +
          `x=(w-tw)/2:y=${yPosition}:` +
          `enable='between(t,${segment.start_second},${segment.end_second})'`;
      }).join(',');

      ffmpeg(inputPath)
        .videoFilters(drawTextFilters)
        .outputOptions(['-c:a', 'copy', '-preset', 'fast'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  /**
   * Escape text for FFmpeg drawtext filter
   */
  private escapeText(text: string): string {
    return text
      .replace(/'/g, "'\\''")
      .replace(/:/g, '\\:')
      .replace(/\\/g, '\\\\')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(files: string[]): void {
    files.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        logger.warn('Failed to cleanup temp file', { file, error });
      }
    });
  }

  /**
   * Test FFmpeg availability
   */
  async testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err) => {
        if (err) {
          logger.error('FFmpeg not available', { error: err });
          resolve(false);
        } else {
          logger.info('FFmpeg connection successful');
          resolve(true);
        }
      });
    });
  }
}
