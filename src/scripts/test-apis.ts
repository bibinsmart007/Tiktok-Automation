import dotenv from 'dotenv';
import { GoogleTTSService } from '../services/google-tts';
import { GoogleVeoService } from '../services/google-veo';
import { TikTokAPIService } from '../services/tiktok-api';
import { logger } from '../utils/logger';

dotenv.config();

/**
 * Test script to verify all API connections
 * Usage: npm run test
 */
async function testAPIs() {
    console.log('🔍 Testing API Connections...\n');

    const ttsService = new GoogleTTSService();
    const veoService = new GoogleVeoService();
    const tiktokService = new TikTokAPIService();

    // Test Google TTS
    console.log('1️⃣  Testing Google Cloud Text-to-Speech...');
    try {
        const ttsResult = await ttsService.testConnection();
        console.log(ttsResult ? '   ✅ Google TTS: Connected' : '   ❌ Google TTS: Failed');
    } catch (error) {
        console.log('   ❌ Google TTS: Failed');
        console.error('   Error:', error);
    }

    console.log('');

    // Test Google Veo / Vertex AI
    console.log('2️⃣  Testing Google Vertex AI (Veo)...');
    try {
        const veoResult = await veoService.testConnection();
        console.log(veoResult ? '   ✅ Vertex AI: Connected' : '   ❌ Vertex AI: Failed');
        console.log('   ℹ️  Note: Veo is currently in preview - full video generation coming soon');
    } catch (error) {
        console.log('   ❌ Vertex AI: Failed');
        console.error('   Error:', error);
    }

    console.log('');

    // Test TikTok API
    console.log('3️⃣  Testing TikTok API...');
    try {
        const tiktokResult = await tiktokService.testConnection();
        console.log(tiktokResult ? '   ✅ TikTok API: Connected' : '   ❌ TikTok API: Failed');
    } catch (error) {
        console.log('   ❌ TikTok API: Failed');
        console.error('   Error:', error);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Connection test complete!');
    console.log('\n💡 Next steps:');
    console.log('   - If all tests passed: Run "npm start" to begin automation');
    console.log('   - If tests failed: Check your .env file and credentials');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testAPIs().catch((error) => {
    console.error('Fatal error during API testing:', error);
    process.exit(1);
});
