// File: BACKEND/node_ingestion_service/redis-cache.js
//
// In-memory caching layer for real-time sensor data
// Optimized for hackathon demo - no external Redis needed (saves $45/month)
// Uses JavaScript Map for fast in-memory caching

// Redis removed to minimize costs - using pure in-memory cache
// const Redis = require('ioredis'); // REMOVED

class RedisCache {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.inMemoryCache = new Map(); // Primary cache (was fallback, now main)
  }

  /**
   * Initialize cache (always uses in-memory Map)
   * No external Redis connection - cost optimization
   */
  async initialize() {
    console.log('[Cache] ✓ In-memory cache initialized (Map-based, no Redis)');
    console.log('[Cache] Cost optimization: Saving $45/month by not using Redis Memorystore');
    this.connected = false; // Never connects to Redis
  }

  /**
   * Store recent sensor data (last 5 minutes = ~100 data points at 3s interval)
   * Key format: patient:{userId}:recent
   */
  async storeRecentData(userId, dataPacket) {
    const key = `patient:${userId}:recent`;
    const value = JSON.stringify(dataPacket);

    try {
      // Always use in-memory cache
      if (!this.inMemoryCache.has(key)) {
        this.inMemoryCache.set(key, []);
      }
      const list = this.inMemoryCache.get(key);
      list.unshift(value);
      // Keep only last 100
      if (list.length > 100) {
        list.length = 100;
      }
    } catch (error) {
      console.error('[Cache] Error storing recent data:', error.message);
    }
  }

  /**
   * Get recent sensor data for WebSocket streaming
   * Returns last N data points (default 20 = last minute)
   */
  async getRecentData(userId, count = 20) {
    const key = `patient:${userId}:recent`;

    try {
      // Always use in-memory cache
      const list = this.inMemoryCache.get(key) || [];
      return list.slice(0, count).map(item => JSON.parse(item));
    } catch (error) {
      console.error('[Cache] Error getting recent data:', error.message);
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
      // Always use in-memory cache
      if (!this.inMemoryCache.has(key)) {
        this.inMemoryCache.set(key, []);
      }
      this.inMemoryCache.get(key).push(value);
    } catch (error) {
      console.error('[Cache] Error adding to aggregate buffer:', error.message);
    }
  }

  /**
   * Get and clear aggregation buffer (used by aggregation service)
   * Returns all buffered data and clears the buffer atomically
   */
  async getAndClearAggregateBuffer(userId) {
    const key = `patient:${userId}:aggregate_buffer`;

    try {
      // Always use in-memory cache
      const list = this.inMemoryCache.get(key) || [];
      this.inMemoryCache.delete(key);
      return list.map(item => JSON.parse(item));
    } catch (error) {
      console.error('[Cache] Error getting aggregate buffer:', error.message);
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
      // Always use in-memory cache
      this.inMemoryCache.set(key, value);
    } catch (error) {
      console.error('[Cache] Error storing latest reading:', error.message);
    }
  }

  /**
   * Get latest sensor reading
   */
  async getLatestReading(userId) {
    const key = `patient:${userId}:latest`;

    try {
      // Always use in-memory cache
      const data = this.inMemoryCache.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[Cache] Error getting latest reading:', error.message);
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

      const recentCount = (this.inMemoryCache.get(recentKey) || []).length;
      const bufferCount = (this.inMemoryCache.get(bufferKey) || []).length;
      return {
        connected: false,
        mode: 'in-memory (optimized for hackathon)',
        recentDataPoints: recentCount,
        bufferDataPoints: bufferCount,
        totalKeys: this.inMemoryCache.size
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Cleanup and close connection
   */
  async close() {
    console.log('[Cache] In-memory cache cleared');
    this.inMemoryCache.clear();
  }
}

// Export singleton instance
module.exports = new RedisCache();
