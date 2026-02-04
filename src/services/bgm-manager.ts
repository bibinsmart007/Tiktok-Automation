import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface BGMTrack {
  id: string;
  name: string;
  duration: number;
  path: string;
  mood: string;
}

export class BGMManagerService {
  private bgmDir: string;
  private outputDir: string;

  // Pre-defined BGM tracks info (you'll need to download these once)
  // All from FREE sources: Pixabay Music, YouTube Audio Library
  private readonly trackDatabase: Omit<BGMTrack, 'path'>[] = [
    { id: 'upbeat-tech-1', name: 'Digital Dreams', duration: 120, mood: 'energetic' },
    { id: 'upbeat-tech-2', name: 'Future Forward', duration: 90, mood: 'energetic' },
    { id: 'motivational-1', name: 'Rise Up', duration: 150, mood: 'inspirational' },
    { id: 'motivational-2', name: 'Success Story', duration: 120, mood: 'inspirational' },
    { id: 'chill-1', name: 'Calm Waters', duration: 180, mood: 'relaxed' },
    { id: 'chill-2', name: 'Night Drive', duration: 140, mood: 'relaxed' },
    { id: 'trap-1', name: 'Street Beats', duration: 100, mood: 'hype' },
    { id: 'trap-2', name: 'Drop Zone', duration: 110, mood: 'hype' },
  ];

  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './output';
    this.bgmDir = path.join(this.outputDir, 'bgm');

    if (!fs.existsSync(this.bgmDir)) {
      fs.mkdirSync(this.bgmDir, { recursive: true });
    }
  }

  /**
   * Get a BGM track based on content niche/mood
   */
  async getBGMForNiche(niche: string): Promise<string> {
    try {
      // Map niches to moods
      const nicheMoodMap: Record<string, string[]> = {
        ai_tools: ['energetic', 'hype'],
        online_business: ['inspirational', 'energetic'],
        faceless_stories: ['inspirational', 'relaxed']
      };

      const preferredMoods = nicheMoodMap[niche] || ['energetic'];
      const randomMood = preferredMoods[Math.floor(Math.random() * preferredMoods.length)];

      // Get available tracks for this mood
      const availableTracks = await this.getAvailableTracks(randomMood);

      if (availableTracks.length === 0) {
        // Try to download from free source
        const track = await this.downloadFreeBGM(randomMood);
        return track.path;
      }

      // Return random available track
      const selectedTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
      logger.info('Selected BGM track', { track: selectedTrack.name, mood: selectedTrack.mood });
      return selectedTrack.path;

    } catch (error) {
      logger.error('Failed to get BGM', { error });
      throw error;
    }
  }

  /**
   * Get list of available BGM tracks (already downloaded)
   */
  private async getAvailableTracks(mood?: string): Promise<BGMTrack[]> {
    try {
      const files = fs.readdirSync(this.bgmDir);
      const tracks: BGMTrack[] = [];

      for (const file of files) {
        if (!file.endsWith('.mp3')) continue;
        
        const trackInfo = this.trackDatabase.find(
          t => file.includes(t.id) || file.toLowerCase().includes(t.name.toLowerCase().replace(/ /g, '-'))
        );

        if (trackInfo) {
          const track: BGMTrack = {
            ...trackInfo,
            path: path.join(this.bgmDir, file)
          };
          
          if (!mood || track.mood === mood) {
            tracks.push(track);
          }
        } else {
          // Unknown track, add with default mood
          tracks.push({
            id: file,
            name: file.replace('.mp3', ''),
            duration: 120,
            path: path.join(this.bgmDir, file),
            mood: mood || 'energetic'
          });
        }
      }

      return tracks;
    } catch {
      return [];
    }
  }

  /**
   * Download free BGM from Pixabay Music API
   * Note: Pixabay provides free music for commercial use
   */
  private async downloadFreeBGM(mood: string): Promise<BGMTrack> {
    try {
      const pixabayApiKey = process.env.PIXABAY_API_KEY || '';
      
      if (!pixabayApiKey) {
        throw new Error('Pixabay API key not configured. Please add some BGM files manually to ./output/bgm/');
      }

      // Map moods to Pixabay search terms
      const moodSearchTerms: Record<string, string> = {
        energetic: 'upbeat electronic',
        inspirational: 'motivational cinematic',
        relaxed: 'chill lofi',
        hype: 'trap beats'
      };

      const searchTerm = moodSearchTerms[mood] || 'electronic beat';

      const response = await axios.get('https://pixabay.com/api/videos/', {
        params: {
          key: pixabayApiKey,
          q: searchTerm,
          per_page: 5
        }
      });

      // Note: Pixabay video API - for music, you'd typically use their music section
      // This is a placeholder - in practice, you'd manually curate BGM files
      
      throw new Error('Auto-download not implemented. Please manually add BGM files.');

    } catch (error) {
      logger.error('Failed to download BGM', { error });
      throw error;
    }
  }

  /**
   * Get any available BGM track (fallback)
   */
  async getAnyAvailableBGM(): Promise<string | null> {
    const tracks = await this.getAvailableTracks();
    if (tracks.length === 0) return null;
    return tracks[Math.floor(Math.random() * tracks.length)].path;
  }

  /**
   * Add a BGM track to the library
   */
  async addTrackToLibrary(
    sourcePath: string,
    trackName: string,
    mood: string
  ): Promise<BGMTrack> {
    const filename = `${mood}-${trackName.toLowerCase().replace(/ /g, '-')}-${Date.now()}.mp3`;
    const destPath = path.join(this.bgmDir, filename);
    
    fs.copyFileSync(sourcePath, destPath);
    
    const track: BGMTrack = {
      id: filename,
      name: trackName,
      duration: 120, // Would need ffprobe to get actual duration
      path: destPath,
      mood
    };

    logger.info('Added BGM track to library', { track });
    return track;
  }

  /**
   * Initialize BGM library with sample tracks info
   */
  async initializeLibrary(): Promise<void> {
    logger.info('BGM Library initialized', {
      directory: this.bgmDir,
      tracksConfigured: this.trackDatabase.length
    });

    // Check for existing tracks
    const existingTracks = await this.getAvailableTracks();
    
    if (existingTracks.length === 0) {
      logger.warn(
        'No BGM tracks found. Please add MP3 files to the BGM directory.',
        { bgmDirectory: this.bgmDir }
      );
      logger.info(
        'Free BGM sources: Pixabay Music (pixabay.com/music), YouTube Audio Library, Uppbeat (uppbeat.io)'
      );
    } else {
      logger.info('BGM tracks available', { count: existingTracks.length });
    }
  }

  /**
   * Test BGM service
   */
  async testConnection(): Promise<boolean> {
    try {
      const tracks = await this.getAvailableTracks();
      
      if (tracks.length > 0) {
        logger.info('BGM service ready', { tracksAvailable: tracks.length });
        return true;
      } else {
        logger.warn('BGM service ready but no tracks available');
        return true; // Service works, just needs tracks
      }
    } catch (error) {
      logger.error('BGM service test failed', { error });
      return false;
    }
  }

  /**
   * Get setup instructions for BGM
   */
  getSetupInstructions(): string {
    return `
BGM Setup Instructions:
========================
1. Create directory: ${this.bgmDir}
2. Download FREE music from:
   - Pixabay Music: https://pixabay.com/music/
   - YouTube Audio Library: https://studio.youtube.com/channel/UC/music
   - Uppbeat: https://uppbeat.io/
3. Place MP3 files in the BGM directory
4. Name files with mood prefix: energetic-trackname.mp3, inspirational-trackname.mp3, etc.

Recommended moods: energetic, inspirational, relaxed, hype
    `;
  }
}
