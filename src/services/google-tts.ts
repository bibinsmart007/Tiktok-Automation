import * as textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import { TTSVoiceParams } from '../types';
import { logger } from '../utils/logger';

export class GoogleTTSService {
    private client: textToSpeech.TextToSpeechClient;
    private outputDir: string;

    constructor() {
        this.client = new textToSpeech.TextToSpeechClient();
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
