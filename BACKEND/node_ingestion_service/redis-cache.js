// File: BACKEND/node_ingestion_service/redis-cache.js
//
// Redis caching layer for real-time sensor data
// Prevents Firestore overload by caching recent data in-memory

const Redis = require('ioredis');

class RedisCache {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.inMemoryFallback = new Map(); // Fallback if Redis unavailable
  }

  /**
   * Initialize Redis connection
   * Falls back to in-memory Map if Redis is unavailable (for local dev)
   */
  async initialize() {
    try {
      // Try to connect to Redis
      // For GCP: Use Memorystore IP
      // For local: Use localhost:6379
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        retryStrategy: (times) => {
          if (times > 3) {
            console.log('[Redis] Max retries reached. Using in-memory fallback.');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000);
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('connect', () => {
        this.connected = true;
        console.log('[Redis] ✓ Connected successfully');
      });

      this.redis.on('error', (err) => {
        console.warn('[Redis] Connection error, using in-memory fallback:', err.message);
        this.connected = false;
      });

      // Wait a bit to see if connection succeeds
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!this.connected) {
        console.log('[Redis] Using in-memory fallback (Map)');
      }

    } catch (error) {
      console.warn('[Redis] Initialization failed, using in-memory fallback:', error.message);
      this.connected = false;
    }
  }

  /**
   * Store recent sensor data (last 5 minutes = ~100 data points at 3s interval)
   * Key format: patient:{userId}:recent
   */
  async storeRecentData(userId, dataPacket) {
    const key = `patient:${userId}:recent`;
    const value = JSON.stringify(dataPacket);

    try {
      if (this.connected && this.redis) {
        // Add to list (newest first)
        await this.redis.lpush(key, value);
        // Keep only last 100 entries (5 minutes at 3s interval)
        await this.redis.ltrim(key, 0, 99);
        // Set expiration to 10 minutes
        await this.redis.expire(key, 600);
      } else {
        // In-memory fallback
        if (!this.inMemoryFallback.has(key)) {
          this.inMemoryFallback.set(key, []);
        }
        const list = this.inMemoryFallback.get(key);
        list.unshift(value);
        // Keep only last 100
        if (list.length > 100) {
          list.length = 100;
        }
      }
    } catch (error) {
      console.error('[Redis] Error storing recent data:', error.message);
    }
  }

  /**
   * Get recent sensor data for WebSocket streaming
   * Returns last N data points (default 20 = last minute)
   */
  async getRecentData(userId, count = 20) {
    const key = `patient:${userId}:recent`;

    try {
      if (this.connected && this.redis) {
        const data = await this.redis.lrange(key, 0, count - 1);
        return data.map(item => JSON.parse(item));
      } else {
        // In-memory fallback
        const list = this.inMemoryFallback.get(key) || [];
        return list.slice(0, count).map(item => JSON.parse(item));
      }
    } catch (error) {
      console.error('[Redis] Error getting recent data:', error.message);
      return [];
    }
  }

  /**
   * Store aggregated data buffer for batch Firestore writes
   * Key format: patient:{userId}:aggregate_buffer
   */
  async addToAggregateBuffer(userId, dataPacket) {
    const key = `patient:${userId}:aggregate_buffer`;
    const value = JSON.stringify(dataPacket);

    try {
      if (this.connected && this.redis) {
        await this.redis.rpush(key, value);
        // Set expiration to 15 minutes (in case aggregation service fails)
        await this.redis.expire(key, 900);
      } else {
        // In-memory fallback
        if (!this.inMemoryFallback.has(key)) {
          this.inMemoryFallback.set(key, []);
        }
        this.inMemoryFallback.get(key).push(value);
      }
    } catch (error) {
      console.error('[Redis] Error adding to aggregate buffer:', error.message);
    }
  }

  /**
   * Get and clear aggregation buffer (used by aggregation service)
   * Returns all buffered data and clears the buffer atomically
   */
  async getAndClearAggregateBuffer(userId) {
    const key = `patient:${userId}:aggregate_buffer`;

    try {
      if (this.connected && this.redis) {
        // Get all data
        const data = await this.redis.lrange(key, 0, -1);
        // Clear the buffer
        await this.redis.del(key);
        return data.map(item => JSON.parse(item));
      } else {
        // In-memory fallback
        const list = this.inMemoryFallback.get(key) || [];
        this.inMemoryFallback.delete(key);
        return list.map(item => JSON.parse(item));
      }
    } catch (error) {
      console.error('[Redis] Error getting aggregate buffer:', error.message);
      return [];
    }
  }

  /**
   * Store latest sensor reading for quick access
   * Key format: patient:{userId}:latest
   */
  async storeLatestReading(userId, dataPacket) {
    const key = `patient:${userId}:latest`;
    const value = JSON.stringify(dataPacket);

    try {
      if (this.connected && this.redis) {
        await this.redis.set(key, value);
        await this.redis.expire(key, 60); // Expire after 1 minute
      } else {
        // In-memory fallback
        this.inMemoryFallback.set(key, value);
      }
    } catch (error) {
      console.error('[Redis] Error storing latest reading:', error.message);
    }
  }

  /**
   * Get latest sensor reading
   */
  async getLatestReading(userId) {
    const key = `patient:${userId}:latest`;

    try {
      if (this.connected && this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // In-memory fallback
        const data = this.inMemoryFallback.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('[Redis] Error getting latest reading:', error.message);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(userId) {
    try {
      const recentKey = `patient:${userId}:recent`;
      const bufferKey = `patient:${userId}:aggregate_buffer`;

      if (this.connected && this.redis) {
        const recentCount = await this.redis.llen(recentKey);
        const bufferCount = await this.redis.llen(bufferKey);
        return {
          connected: true,
          recentDataPoints: recentCount,
          bufferDataPoints: bufferCount,
        };
      } else {
        const recentCount = (this.inMemoryFallback.get(recentKey) || []).length;
        const bufferCount = (this.inMemoryFallback.get(bufferKey) || []).length;
        return {
          connected: false,
          mode: 'in-memory',
          recentDataPoints: recentCount,
          bufferDataPoints: bufferCount,
        };
      }
    } catch (error) {
      console.error('[Redis] Error getting stats:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Cleanup and close connection
   */
  async close() {
    if (this.redis && this.connected) {
      await this.redis.quit();
      console.log('[Redis] Connection closed');
    }
  }
}

// Export singleton instance
module.exports = new RedisCache();
