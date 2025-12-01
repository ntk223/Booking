import safeRedisClient from "../config/redis.js";
import logger from "../logger/winston.log.js";

class CacheManager {
    constructor() {
        this.client = safeRedisClient;
        this.defaultTTL = 3600; // 1 hour
    }

    /**
     * Get value from cache
     * @param {string} key
     * @returns {Promise<any>}
     */
    async get(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Cache get error for key ${key}: ${error.message}`);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key
     * @param {any} value
     * @param {number} ttl - Time to live in seconds
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            await this.client.set(key, JSON.stringify(value), { EX: ttl });
        } catch (error) {
            logger.error(`Cache set error for key ${key}: ${error.message}`);
        }
    }

    /**
     * Delete value from cache
     * @param {string} key
     */
    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error(`Cache del error for key ${key}: ${error.message}`);
        }
    }

    /**
     * Delete keys matching a pattern
     * @param {string} pattern
     */
    async delPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            logger.error(`Cache delPattern error for pattern ${pattern}: ${error.message}`);
        }
    }

    /**
     * Get value from cache or fetch from source if missing
     * @param {string} key
     * @param {Function} fetchFn
     * @param {number} ttl
     * @returns {Promise<any>}
     */
    async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
        const cachedData = await this.get(key);
        if (cachedData) {
            return cachedData;
        }

        const data = await fetchFn();
        if (data) {
            await this.set(key, data, ttl);
        }
        return data;
    }
}

export const cacheManager = new CacheManager();
