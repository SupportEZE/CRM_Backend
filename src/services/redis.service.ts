import { Global, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';


@Global()
@Injectable()
export class RedisService {
    constructor(
        @InjectRedis() private readonly redis: Redis,
    ) { }

    async get(key: string): Promise<any> {
       
        const cachedData = await this.redis.get(key);
        if (!cachedData) return null;

        try {
            return JSON.parse(cachedData);
        } catch (error) {
            return null;
        }
    }

    async set(key: string, value: any, ttl?: number, overwrite = false): Promise<boolean> {
       
        if (!overwrite) {
            const exists = await this.exists(key);
            if (exists) throw new Error('Key already exists');
        }

        const stringifiedValue = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(key, ttl, stringifiedValue);
        } else {
            await this.redis.set(key, stringifiedValue);
        }

        return true;
    }

    async update(key: string, value: any, ttl?: number): Promise<void> {
       

        const exists = await this.exists(key);
        if (exists) {
            await this.set(key, value, ttl, true);
        }
    }

    async delete(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async exists(key: string): Promise<boolean> {
        return (await this.redis.exists(key)) === 1;
    }

    async clearCache(): Promise<void> {
        let cursor = '0';
        const batchSize = 100;

        do {
            const reply = await this.redis.scan(cursor, 'MATCH', '*', 'COUNT', batchSize);
            cursor = reply[0];
            const keys = reply[1];

            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
    }

    async fetchAllKeys(): Promise<string[]> {
        let cursor = '0';
        let allKeys: string[] = [];
        do {
            const reply = await this.redis.scan(cursor, 'MATCH', '*', 'COUNT', 100);
            cursor = reply[0];
            allKeys.push(...reply[1]);
        } while (cursor !== '0');

        return allKeys;
    }

    async fetchAllValues(): Promise<any[]> {
        const keys = await this.fetchAllKeys();
        if (keys.length === 0) return [];
        const values = await this.redis.mget(...keys);
        return values.map((val) => {
            try {
                return JSON.parse(val);
            } catch {
                return val;
            }
        });
    }

    async fetchAllKeysAndValues(): Promise<Record<string, any>> {
        let cursor = '0';
        const allData: Record<string, any> = {};

        do {
            const reply = await this.redis.scan(cursor, 'MATCH', '*', 'COUNT', 100);
            cursor = reply[0];
            const keys = reply[1];

            if (keys.length > 0) {
                const values = await this.redis.mget(...keys);
                keys.forEach((key, i) => {
                    try {
                        allData[key] = JSON.parse(values[i]);
                    } catch {
                        allData[key] = values[i];
                    }
                });
            }
        } while (cursor !== '0');

        return allData;
    }

    buildKey(parts: (string | number | undefined | null | boolean)[]): string {
        return parts
          .filter((p) => p !== undefined && p !== null) // keep 0 and false
          .map((p) => String(p).trim().replace(/\s+/g, '_'))
          .join(':');
    }

    async increment(key: string): Promise<number> {
        return await this.redis.incr(key);
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        return (await this.redis.expire(key, seconds)) === 1;
    }

    async ttl(key: string): Promise<number> {
        return await this.redis.ttl(key);
    }
}
