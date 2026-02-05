import * as textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import { TTSVoiceParams } from '../types';
import { logger } from '../utils/logger';

export class GoogleTTSService {
  private client: textToSpeech.TextToSpeechClient;
  private outputDir: string;

  constructor() {
    // Parse credentials from environment variable
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (credentialsJson) {
      try {
        const credentials = JSON.parse(credentialsJson);
        this.client = new textToSpeech.TextToSpeechClient({
          credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
          },
          projectId: credentials.project_id,
        });
        logger.info('Google TTS client initialized with credentials from environment');
      } catch (error) {
        logger.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON', { error });
        this.client = new textToSpeech.TextToSpeechClient();
      }
    } else {
      // Fallback to default credentials (file-based or ADC)
      this.client = new textToSpeech.TextToSpeechClient();
      logger.warn('No GOOGLE_APPLICATION_CREDENTIALS_JSON found, using default credentials');
    }
    
    this.outputDir = process.env.OUTPUT_DIR || './output';
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate audio from text using Google Cloud TTS
   */
  async generateAudio(
    text: string,
    voiceParams: TTSVoiceParams,
    filename: string = `audio-${Date.now()}.mp3`
  ): Promise<string> {
    try {
      logger.info('Generating audio with Google Cloud TTS', { textLength: text.length });
      
      const request = {
        input: { text },
        voice: {
          languageCode: voiceParams.languageCode,
          name: voiceParams.name,
          ssmlGender: voiceParams.ssmlGender as any
        },
        audioConfig: {
          audioEncoding: voiceParams.audioEncoding as any,
          speakingRate: voiceParams.speakingRate,
          pitch: voiceParams.pitch
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received from Google TTS');
      }

      const outputPath = path.join(this.outputDir, filename);
      fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
      logger.info('Audio generated successfully', { outputPath });
      return outputPath;
    } catch (error) {
      logger.error('Failed to generate audio', { error });
      throw error;
    }
  }

  /**
   * Test TTS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.listVoices({ languageCode: 'en-US' });
      logger.info('Google TTS connection successful');
      return true;
    } catch (error) {
      logger.error('Google TTS connection failed', { error });
      return false;
    }
  }
}
