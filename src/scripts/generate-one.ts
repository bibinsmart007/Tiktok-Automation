import dotenv from 'dotenv';
import { generateVideoContent } from '../services/content-generator';
import { getTopicForDay, getRandomTopic } from '../data/topics';

dotenv.config();

/**
 * Script to generate one video JSON for testing
 * Usage: npm run generate
 */
async function generateOne() {
    console.log('🎬 Generating video content JSON...\n');

    // Get today's topic
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const topic = getTopicForDay(dayOfYear);

    console.log('📋 Topic Details:');
    console.log(`   Niche: ${topic.niche}`);
    console.log(`   Angle: ${topic.angle}`);
    console.log(`   Hook: ${topic.hook_format}`);
    console.log(`   Audience: ${topic.target_audience}\n`);

    // Generate content
    const content = generateVideoContent(topic);

    console.log('✅ Content Generated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(content, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Content Stats:');
    console.log(`   Script Length: ${content.script_for_tts.split(' ').length} words`);
    console.log(`   Estimated Duration: ${content.veo_prompt_style.duration_seconds} seconds`);
    console.log(`   Hashtags: ${content.tiktok_hashtags.join(', ')}`);
    console.log(`   Text Segments: ${content.on_screen_text_segments.length}`);
    console.log('\n✨ Ready to send to your backend pipeline!');
}

generateOne().catch(console.error);
