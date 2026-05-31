import { Injectable, Inject, Logger } from '@nestjs/common';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private redisClient: any) {}

  async get(key: string): Promise<any> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redisClient.setEx(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.redisClient.publish(channel, JSON.stringify(message));
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, error);
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const subscriber = this.redisClient.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message: string) => {
        callback(JSON.parse(message));
      });
    } catch (error) {
      this.logger.error(`Error subscribing to channel ${channel}:`, error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redisClient.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
    }
  }
}
