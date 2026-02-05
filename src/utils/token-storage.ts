import fs from 'fs';
import path from 'path';
import { logger } from './logger';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

const TOKEN_FILE_PATH = path.join(process.cwd(), 'tiktok-tokens.json');

export class TokenStorage {
  /**
   * Save tokens to file
   */
  static saveTokens(data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): void {
    try {
      const tokenData: TokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        expiresAt: Date.now() + data.expiresIn * 1000
      };

      fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokenData, null, 2));
      logger.info('Tokens saved to file successfully');
    } catch (error) {
      logger.error('Failed to save tokens to file', { error });
    }
  }

  /**
   * Load tokens from file
   */
  static loadTokens(): TokenData | null {
    try {
      if (!fs.existsSync(TOKEN_FILE_PATH)) {
        logger.warn('Token file does not exist');
        return null;
      }

      const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
      const tokenData: TokenData = JSON.parse(data);

      logger.info('Tokens loaded from file successfully');
      return tokenData;
    } catch (error) {
      logger.error('Failed to load tokens from file', { error });
      return null;
    }
  }

  /**
   * Get valid access token (refresh if expired)
   */
  static getAccessToken(): string | null {
    const tokenData = this.loadTokens();

    if (!tokenData) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() >= tokenData.expiresAt - 5 * 60 * 1000) {
      logger.warn('Access token is expired or about to expire');
      return null;
    }

    return tokenData.accessToken;
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    const tokenData = this.loadTokens();
    return tokenData ? tokenData.refreshToken : null;
  }

  /**
   * Check if tokens exist and are valid
   */
  static hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    return accessToken !== null;
  }
}
