import { VideoContent, Topic } from '../types';

/**
 * Generate video content JSON for a given topic
 */
export function generateVideoContent(topic: Topic): VideoContent {
    const { niche, angle, hook_format, target_audience } = topic;

    // Generate script based on niche and angle
    const script = generateScript(niche, angle, hook_format);

    // Estimate duration (roughly 3 words per second)
    const wordCount = script.split(' ').length;
    const estimatedDuration = Math.ceil(wordCount / 3);

    return {
        script_for_tts: script,
        tts_voice_params: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-D',
            ssmlGender: 'MALE',
            speakingRate: 1.08,
            pitch: 0.5,
            audioEncoding: 'MP3'
        },
        veo_prompt: generateVeoPrompt(niche, angle),
        veo_prompt_style: {
            duration_seconds: estimatedDuration,
            aspect_ratio: '9:16',
            camera_motion: 'subtle handheld with dynamic push-ins on key moments',
            color_grade: 'high-contrast with teal shadows and warm highlights',
            framing: 'tight medium shots and close-ups on screens and interfaces',
            visual_intensity: 'fast cuts every 2-3 seconds, high energy with smooth transitions'
        },
        on_screen_text_segments: generateTextSegments(hook_format, niche),
        tiktok_caption: generateCaption(angle, niche),
        tiktok_hashtags: generateHashtags(niche),
        b_roll_suggestions: generateBRollSuggestions(niche),
        bgm_instructions: 'Upbeat electronic trap beat with light hi-hats and subtle bass, 115-125 BPM, no vocals, energetic but not overpowering the voiceover, modern TikTok vibe with occasional riser effects on transitions',
        safety_notes: 'None.'
    };
}

/**
 * Generate script for TTS based on topic
 */
function generateScript(niche: string, angle: string, hook: string): string {
    const scripts: Record<string, () => string> = {
        ai_tools: () => generateAIToolsScript(angle, hook),
        online_business: () => generateOnlineBusinessScript(angle, hook),
        faceless_stories: () => generateFacelessStoryScript(angle, hook),
    };

    const generator = scripts[niche] || scripts.ai_tools;
    return generator();
}

function generateAIToolsScript(angle: string, hook: string): string {
    const templates = [
        `Stop scrolling. ${hook} Most people are still doing everything manually. But there's an AI that changes the game completely. It handles tasks that used to take hours and does them in seconds. The interface is simple, the results are instant, and the best part? It keeps learning what works. While others are grinding, this tool is doing the heavy lifting. You upload your work, it optimizes everything automatically. The crazy part? Most people have no idea this exists. This is how top creators are scaling without burning out.`,

        `Listen up. ${hook} Everyone's talking about AI, but nobody's showing you the tools that actually matter. This one automates the boring stuff so you can focus on what makes money. It's not complicated. You connect it once, set your preferences, and it runs on autopilot. The ROI is insane because it saves you hours every single day. While you're sleeping, it's working. While you're creating, it's optimizing. This is the unfair advantage smart entrepreneurs are using right now.`,

        `Real talk. ${hook} If you're not using AI in 2026, you're already behind. This specific tool replaces tedious manual work with smart automation. You don't need to be technical. You don't need a huge budget. You just need to set it up once and let it run. The results speak for themselves. Faster output, better quality, zero burnout. This is how you compete with people who have entire teams.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

function generateOnlineBusinessScript(angle: string, hook: string): string {
    const templates = [
        `Pay attention. ${hook} Most people overcomplicate making money online. They think they need a massive following or thousands of dollars to start. Wrong. You need a laptop, a simple idea, and the willingness to test fast. The strategy is simple. Find a problem people have, solve it better than anyone else, and charge for it. No fancy tools. No complicated funnels. Just value and consistency. The people winning right now? They started small and stayed consistent. You can start today.`,

        `Stop scrolling. ${hook} The online business game changed in 2026. What used to take months now takes days if you know the shortcuts. You don't need a degree. You don't need experience. You need execution speed and a willingness to learn in public. Pick one business model, go all in for 90 days, track what works. The winners aren't smarter. They're just faster at testing and iterating. This is your sign to stop researching and start building.`,

        `Listen. ${hook} Everyone's selling you complicated systems and expensive courses. The truth? Making money online is simple but not easy. You need a clear offer, a way to reach people, and relentless consistency. The formula hasn't changed. Solve a painful problem, package your solution, find your audience, and deliver results. Then do it again. And again. That's it. No secrets. No hacks. Just smart work every single day.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

function generateFacelessStoryScript(angle: string, hook: string): string {
    const templates = [
        `${hook} Nobody saw it coming. Three months ago, everything was different. No audience. No income. Just frustration and doubt. Then one decision changed everything. It wasn't luck. It wasn't some secret strategy. It was consistency mixed with smart pivots. The first month? Crickets. The second month? A few small wins. The third month? Everything clicked. Now the results speak for themselves. But here's what nobody talks about. The late nights. The failures. The moments of wanting to quit. Success isn't a straight line. It's messy. But it's possible.`,

        `${hook} This is the part they don't show you on social media. Behind every overnight success is months of invisible work. Early mornings. Late nights. Constant doubt. But then something shifts. You figure out what works. You double down. You stop listening to everyone else and trust your process. The breakthrough doesn't happen when you're comfortable. It happens when you're exhausted but you keep going anyway. That's the real story. Not the highlight reel. The grind that nobody sees.`,

        `${hook} Let me tell you what really happened. It started with a simple decision to try something different. No grand plan. No massive investment. Just action. The first attempts failed. Hard. But each failure taught something valuable. Slowly, the pieces started connecting. The audience grew. The income followed. Now? It's a completely different game. But the lesson is clear. You don't need to have it all figured out. You just need to start and adjust as you go.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate Veo prompt for video generation
 */
function generateVeoPrompt(niche: string, angle: string): string {
    const prompts: Record<string, string> = {
        ai_tools: 'Dynamic 9:16 vertical montage showing sleek AI interfaces with animated progress bars and data visualizations, modern dark UI with glowing purple and blue accents, quick cuts between laptop screens showing automated workflows, smooth camera push-ins on key interface elements, high-contrast teal and orange color grade, energetic pacing with subtle motion graphics overlays, professional TikTok aesthetic with clean minimal design',

        online_business: 'Cinematic 9:16 vertical sequence of modern workspace scenes, entrepreneur working on laptop in stylish home office with warm lighting, quick cuts between coffee shop ambiance and nighttime desk work, subtle parallax camera movements, moody blue and amber color palette, dynamic text animations appearing organically, aspirational yet relatable aesthetic, smooth transitions between wide environmental shots and focused close-ups on screens',

        faceless_stories: 'Atmospheric 9:16 vertical storytelling montage with abstract motion backgrounds, smooth transitions between empty office spaces transforming into success environments, dramatic lighting shifts from dark moody tones to bright optimistic scenes, subtle camera drift and slow zooms, cinematic color grading with deep shadows and vibrant highlights, emotional pacing with contemplative moments, high-quality stock footage aesthetic with narrative flow'
    };

    return prompts[niche] || prompts.ai_tools;
}

/**
 * Generate on-screen text segments
 */
function generateTextSegments(hook: string, niche: string) {
    return [
        {
            type: 'hook' as const,
            start_second: 0.0,
            end_second: 3.5,
            text: hook.split('.')[0].substring(0, 35) + ' 🔥',
            style_hint: 'huge bold white text with purple glow, centered, drop shadow'
        },
        {
            type: 'emphasis' as const,
            start_second: 8.0,
            end_second: 12.0,
            text: 'Game changer ⚡',
            style_hint: 'bold yellow text with scale-in animation, centered'
        },
        {
            type: 'subtitle' as const,
            start_second: 15.0,
            end_second: 20.0,
            text: 'This is the secret',
            style_hint: 'white text with subtle animation, lower third'
        },
        {
            type: 'emphasis' as const,
            start_second: 25.0,
            end_second: 30.0,
            text: 'Start today 🚀',
            style_hint: 'bold purple text with floating animation, centered'
        }
    ];
}

/**
 * Generate TikTok caption
 */
function generateCaption(angle: string, niche: string): string {
    const captions = [
        'This changed everything 🚀 Comment "LINK" for access',
        'The secret nobody talks about 💡 Drop a 🔥 if you needed this',
        'This is how winners do it ⚡ Save this for later',
        'Game changer alert 🎯 Follow for daily tips',
        'Wait for the ending 💥 Comment "MORE" for part 2'
    ];

    return captions[Math.floor(Math.random() * captions.length)];
}

/**
 * Generate hashtags based on niche
 */
function generateHashtags(niche: string): string[] {
    const baseHashtags = ['#fyp', '#viral', '#trending'];

    const nicheHashtags: Record<string, string[]> = {
        ai_tools: ['#AItools', '#automation', '#productivity', '#aiautomation', '#techtools', '#contentcreation'],
        online_business: ['#makemoneyonline', '#sidehustle', '#entrepreneur', '#businesstips', '#onlinebusiness', '#passiveincome'],
        faceless_stories: ['#successstory', '#motivation', '#entrepreneurship', '#businessgrowth', '#inspiration', '#mindset']
    };

    const specific = nicheHashtags[niche] || nicheHashtags.ai_tools;
    return [...baseHashtags, ...specific.slice(0, 6)];
}

/**
 * Generate B-roll suggestions
 */
function generateBRollSuggestions(niche: string) {
    return [
        {
            time_hint: '0-5s',
            description: 'Close-up of person looking amazed at phone screen',
            source_hint: 'stock video or AI generated'
        },
        {
            time_hint: '10-18s',
            description: 'Dynamic screen recording showing the tool/concept in action',
            source_hint: 'simple AI generated UI mockup'
        },
        {
            time_hint: '24-30s',
            description: 'Upward trending graph or success visualization',
            source_hint: 'stock video or motion graphics'
        }
    ];
}
