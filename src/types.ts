export interface VideoContent {
    script_for_tts: string;
    tts_voice_params: TTSVoiceParams;
    veo_prompt: string;
    veo_prompt_style: VeoPromptStyle;
    on_screen_text_segments: OnScreenTextSegment[];
    tiktok_caption: string;
    tiktok_hashtags: string[];
    b_roll_suggestions: BRollSuggestion[];
    bgm_instructions: string;
    safety_notes: string;
}

export interface TTSVoiceParams {
    languageCode: string;
    name: string;
    ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
    speakingRate: number;
    pitch: number;
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
}

export interface VeoPromptStyle {
    duration_seconds: number;
    aspect_ratio: string;
    camera_motion: string;
    color_grade: string;
    framing: string;
    visual_intensity: string;
}

export interface OnScreenTextSegment {
    type: 'hook' | 'subtitle' | 'emphasis';
    start_second: number;
    end_second: number;
    text: string;
    style_hint: string;
}

export interface BRollSuggestion {
    time_hint: string;
    description: string;
    source_hint: string;
}

export interface Topic {
    niche: string;
    angle: string;
    hook_format: string;
    target_audience: string;
}

export interface GenerationResult {
    success: boolean;
    video_path?: string;
    audio_path?: string;
    tiktok_post_id?: string;
    error?: string;
    content: VideoContent;
    generated_at: string;
}


// Type alias for backward compatibility
export type TextSegment = OnScreenTextSegment;
