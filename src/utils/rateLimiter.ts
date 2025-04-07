import { sleep } from '../utils/sleep';

export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minDelay: number;
  private readonly maxRetries = 3;
  private readonly timeout = 30000; // 30 seconds timeout

  constructor(requestsPerMinute: number) {
    this.minDelay = Math.ceil((60 * 1000) / requestsPerMinute);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeFromQueue(task);
        reject(new Error('Request timeout'));
      }, this.timeout);

      const task = async () => {
        try {
          const result = await this.executeWithBackoff(fn);
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          this.removeFromQueue(task);
          reject(error);
        }
      };

      this.queue.push(task);
      this.processQueue().catch(reject);
    });
  }

  private removeFromQueue(task: () => Promise<any>) {
    const index = this.queue.indexOf(task);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }

  private async executeWithBackoff(fn: () => Promise<any>, attempt = 0): Promise<any> {
    try {
      await this.waitForNextSlot();
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);
      return result;
    } catch (error: any) {
      if (error.message?.includes('Rate limit') && attempt < this.maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 30000);
        await sleep(backoffTime);
        return this.executeWithBackoff(fn, attempt + 1);
      }
      throw error;
    }
  }

  private async waitForNextSlot(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelay) {
      await sleep(this.minDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const task = this.queue[0];
        if (task) {
          await task();
          this.queue.shift(); // Only remove after successful execution
        }
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }
}