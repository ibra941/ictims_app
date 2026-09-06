/**
 * Rate Limiting Service
 * Manages login rate limiting to prevent brute force attacks
 */

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  lockedUntil?: number;
}

export interface RateLimitStatus {
  canLogin: boolean;
  attempts: number;
  remainingAttempts: number;
  lockedUntil?: number;
  lockoutRemainingSeconds?: number;
}

class RateLimitService {
  private RATE_LIMIT_KEY = 'ictims_login_rate_limit';
  private MAX_ATTEMPTS = 5; // Allow 5 failed attempts
  private ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minute window
  private INITIAL_LOCKOUT_MS = 60 * 1000; // 1 minute initial lockout
  private LOCKOUT_MULTIPLIER = 2; // Double lockout time for each subsequent lockout
  private MAX_LOCKOUT_MS = 24 * 60 * 60 * 1000; // Max 24 hours

  /**
   * Check if a login attempt is allowed and get rate limit status
   */
  checkRateLimit(identifier: string): RateLimitStatus {
    const now = Date.now();
    const limitData = this.getLimitData(identifier);

    // Check if currently locked out
    if (limitData.lockedUntil && now < limitData.lockedUntil) {
      const remainingMs = limitData.lockedUntil - now;
      return {
        canLogin: false,
        attempts: limitData.attempts,
        remainingAttempts: 0,
        lockedUntil: limitData.lockedUntil,
        lockoutRemainingSeconds: Math.ceil(remainingMs / 1000),
      };
    }

    // Reset if outside attempt window
    if (now - limitData.firstAttemptTime > this.ATTEMPT_WINDOW_MS) {
      this.clearLimitData(identifier);
      return {
        canLogin: true,
        attempts: 0,
        remainingAttempts: this.MAX_ATTEMPTS,
      };
    }

    // Check if max attempts exceeded
    if (limitData.attempts >= this.MAX_ATTEMPTS) {
      return {
        canLogin: false,
        attempts: limitData.attempts,
        remainingAttempts: 0,
        lockedUntil: limitData.lockedUntil,
        lockoutRemainingSeconds: limitData.lockedUntil
          ? Math.ceil((limitData.lockedUntil - now) / 1000)
          : undefined,
      };
    }

    return {
      canLogin: true,
      attempts: limitData.attempts,
      remainingAttempts: this.MAX_ATTEMPTS - limitData.attempts,
    };
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): RateLimitStatus {
    const now = Date.now();
    const limitData = this.getLimitData(identifier);

    if (limitData.attempts === 0) {
      // First failed attempt in this window
      limitData.firstAttemptTime = now;
    }

    limitData.attempts += 1;
    limitData.lastAttemptTime = now;

    // Lock account after max attempts
    if (limitData.attempts >= this.MAX_ATTEMPTS) {
      const previousLockoutCount = (limitData.attempts - this.MAX_ATTEMPTS) / this.MAX_ATTEMPTS;
      const lockoutDuration = Math.min(
        this.INITIAL_LOCKOUT_MS * Math.pow(this.LOCKOUT_MULTIPLIER, previousLockoutCount),
        this.MAX_LOCKOUT_MS
      );
      limitData.lockedUntil = now + lockoutDuration;
    }

    this.saveLimitData(identifier, limitData);

    return this.checkRateLimit(identifier);
  }

  /**
   * Clear rate limit data (on successful login)
   */
  clearRateLimit(identifier: string): void {
    this.clearLimitData(identifier);
  }

  /**
   * Get rate limit data from storage
   */
  private getLimitData(identifier: string): RateLimitEntry {
    try {
      const stored = localStorage.getItem(`${this.RATE_LIMIT_KEY}_${identifier}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading rate limit data:', e);
    }

    return {
      attempts: 0,
      firstAttemptTime: 0,
      lastAttemptTime: 0,
    };
  }

  /**
   * Save rate limit data to storage
   */
  private saveLimitData(identifier: string, data: RateLimitEntry): void {
    try {
      localStorage.setItem(`${this.RATE_LIMIT_KEY}_${identifier}`, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving rate limit data:', e);
    }
  }

  /**
   * Clear rate limit data
   */
  private clearLimitData(identifier: string): void {
    try {
      localStorage.removeItem(`${this.RATE_LIMIT_KEY}_${identifier}`);
    } catch (e) {
      console.error('Error clearing rate limit data:', e);
    }
  }

  /**
   * Clear all rate limit data (admin function)
   */
  clearAllRateLimits(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.RATE_LIMIT_KEY)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const rateLimitService = new RateLimitService();
