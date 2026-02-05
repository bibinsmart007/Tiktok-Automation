import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/logger';

export class TikTokAPIService {
    private client: AxiosInstance;
    private clientKey: string;
    private clientSecret: string;

    constructor() {
        this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';

        // Dynamic access token that reads from environment each time
        this.client = axios.create({
            baseURL: 'https://open.tiktokapis.com/v2',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor to dynamically set Authorization header
        this.client.interceptors.request.use((config) => {
            config.headers['Authorization'] = `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`;
            return config;
        });
    }

    /**
     * Upload and post video to TikTok
     */
    async postVideo(
        videoPath: string,
        caption: string,
        hashtags: string[],
        privacyLevel: 'PUBLIC' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' = 'PUBLIC'
    ): Promise<string> {
        try {
            logger.info('Posting video to TikTok', { caption, hashtagsCount: hashtags.length });

            // Step 1: Initialize upload
            const initResponse = await this.initializeUpload();
            const { upload_url, publish_id } = initResponse;

            // Step 2: Upload video file
            await this.uploadVideoFile(upload_url, videoPath);

            // Step 3: Publish the video
            const fullCaption = `${caption}\n\n${hashtags.join(' ')}`;
            const postId = await this.publishVideo(publish_id, fullCaption, privacyLevel);

            logger.info('Video posted successfully to TikTok', { postId });
            return postId;
        } catch (error) {
            logger.error('Failed to post video to TikTok', { error });
            throw error;
        }
    }

    /**
     * Initialize video upload
     */
    private async initializeUpload(): Promise<{ upload_url: string; publish_id: string }> {
        try {
            const response = await this.client.post('/post/publish/inbox/video/init/', {
                source_info: {
                    source: 'FILE_UPLOAD',
                    video_size: 0, // Will be updated when we have the file
                }
            });

            return {
                upload_url: response.data.data.upload_url,
                publish_id: response.data.data.publish_id
            };
        } catch (error) {
            logger.error('Failed to initialize TikTok upload', { error });
            throw error;
        }
    }

    /**
     * Upload video file to TikTok CDN
     */
    private async uploadVideoFile(uploadUrl: string, videoPath: string): Promise<void> {
        try {
            const formData = new FormData();
            formData.append('video', fs.createReadStream(videoPath));

            await axios.put(uploadUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Content-Type': 'video/mp4'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            logger.info('Video file uploaded to TikTok CDN');
        } catch (error) {
            logger.error('Failed to upload video file', { error });
            throw error;
        }
    }

    /**
     * Publish the uploaded video
     */
    private async publishVideo(
        publishId: string,
        caption: string,
        privacyLevel: string
    ): Promise<string> {
        try {
            const response = await this.client.post('/post/publish/video/init/', {
                post_info: {
                    title: caption,
                    privacy_level: privacyLevel,
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                    video_cover_timestamp_ms: 1000
                },
                source_info: {
                    source: 'FILE_UPLOAD',
                    publish_id: publishId
                }
            });

            return response.data.data.publish_id;
        } catch (error) {
            logger.error('Failed to publish video', { error });
            throw error;
        }
    }

    /**
     * Get video analytics
     */
    async getVideoAnalytics(videoId: string): Promise<any> {
        try {
            const response = await this.client.get(`/video/query/`, {
                params: {
                    fields: 'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count'
                }
            });
            return response.data.data;
        } catch (error) {
            logger.error('Failed to fetch video analytics', { error });
            throw error;
        }
    }

    /**
     * Test TikTok API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            // Try to fetch user info to test connection
            const response = await this.client.get('/user/info/', {
                params: {
                    fields: 'open_id,union_id,avatar_url'
                }
            });

            logger.info('TikTok API connection successful', {
                userId: response.data.data.user?.open_id
            });
            return true;
        } catch (error) {
            logger.error('TikTok API connection failed', { error });
            return false;
        }
    }

    /**
     * Refresh access token (if using OAuth flow)
     */
    async refreshAccessToken(refreshToken: string): Promise<string> {
        try {
            const response = await axios.post(
                'https://open.tiktokapis.com/v2/oauth/token/',
                {
                    client_key: this.clientKey,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                }
            );

            const newAccessToken = response.data.data.access_token;

            // Store in environment variable for dynamic reading
            process.env.TIKTOK_ACCESS_TOKEN = newAccessToken;

            // Update client headers
            this.client.defaults.headers['Authorization'] = `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`;
            
            logger.info('TikTok access token refreshed successfully');
            return newAccessToken;
        } catch (error) {
            logger.error('Failed to refresh TikTok access token', { error });
            throw error;
        }
    }
}
