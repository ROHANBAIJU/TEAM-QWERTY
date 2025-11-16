// File: BACKEND/node_ingestion_service/aggregation-service.js
//
// Periodic aggregation service that writes to Firestore
// Runs every 10 minutes to batch sensor data

const axios = require('axios');
const redisCache = require('./redis-cache');

class AggregationService {
  constructor() {
    this.intervalMs = 1 * 60 * 1000; // 1 minute (changed from 10 min)
    this.intervalHandle = null;
    this.fastApiUrl = process.env.FASTAPI_INGEST_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Start the aggregation service
   */
  start() {
    console.log('[Aggregation] Service started - will aggregate every 1 minute');
    
    // Run immediately on start
    this.runAggregation();
    
    // Then run every 1 minute
    this.intervalHandle = setInterval(() => {
      this.runAggregation();
    }, this.intervalMs);
  }

  /**
   * Stop the aggregation service
   */
  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[Aggregation] Service stopped');
    }
  }

  /**
   * Run aggregation for all active patients
   */
  async runAggregation() {
    try {
      console.log('[Aggregation] Starting aggregation cycle...');
      
      // Get list of active users from environment or default
      const activeUsers = process.env.ACTIVE_USERS 
        ? process.env.ACTIVE_USERS.split(',')
        : ['test_patient_001'];

      for (const userId of activeUsers) {
        await this.aggregateUserData(userId);
      }

      console.log('[Aggregation] ✓ Cycle completed');
    } catch (error) {
      console.error('[Aggregation] Error during aggregation cycle:', error.message);
    }
  }

  /**
   * Aggregate data for a specific user
   */
  async aggregateUserData(userId) {
    try {
      // Get all buffered data points
      const dataPoints = await redisCache.getAndClearAggregateBuffer(userId);
      
      if (dataPoints.length === 0) {
        console.log(`[Aggregation] No data to aggregate for ${userId}`);
        return;
      }

      console.log(`[Aggregation] Aggregating ${dataPoints.length} data points for ${userId}`);

      // Aggregate the data
      const aggregated = this.aggregateData(dataPoints);
      
      // Send to FastAPI for Firestore storage
      await this.sendAggregatedData(userId, aggregated);

      console.log(`[Aggregation] ✓ Saved aggregated data for ${userId}`);
    } catch (error) {
      console.error(`[Aggregation] Error aggregating data for ${userId}:`, error.message);
    }
  }

  /**
   * Aggregate raw data points into summary statistics
   */
  aggregateData(dataPoints) {
    const timestamp = new Date().toISOString();
    const periodStart = dataPoints[0]?.timestamp || timestamp;
    const periodEnd = dataPoints[dataPoints.length - 1]?.timestamp || timestamp;

    // Initialize aggregation object
    const aggregation = {
      timestamp,
      period_start: periodStart,
      period_end: periodEnd,
      data_points_count: dataPoints.length,
      tremor: this.aggregateMetric(dataPoints, 'tremor'),
      rigidity: this.aggregateMetric(dataPoints, 'rigidity'),
      gait: this.aggregateMetric(dataPoints, 'gait'),
      safety: this.aggregateSafety(dataPoints),
      alerts: this.extractAlerts(dataPoints),
    };

    return aggregation;
  }

  /**
   * Aggregate a specific metric (tremor, rigidity, gait)
   */
  aggregateMetric(dataPoints, metricName) {
    const values = [];
    
    dataPoints.forEach(dp => {
      const metric = dp[metricName];
      if (!metric) return;

      // Extract numeric values based on metric type
      if (metricName === 'tremor' && metric.amplitude_g !== undefined) {
        values.push(metric.amplitude_g);
      } else if (metricName === 'rigidity' && metric.emg_wrist_mv !== undefined) {
        values.push(metric.emg_wrist_mv);
      } else if (metricName === 'gait' && metric.acceleration_z_g !== undefined) {
        values.push(metric.acceleration_z_g);
      }
    });

    if (values.length === 0) {
      return null;
    }

    // Calculate statistics
    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];

    // Detect if any critical values
    const critical = this.isCritical(metricName, max);

    return {
      avg: parseFloat(avg.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      std_dev: parseFloat(this.calculateStdDev(values, avg).toFixed(2)),
      critical,
      sample_count: values.length,
    };
  }

  /**
   * Aggregate safety metrics
   */
  aggregateSafety(dataPoints) {
    let fallCount = 0;
    let lowBatteryCount = 0;

    dataPoints.forEach(dp => {
      if (dp.safety?.fall_detected) fallCount++;
      if (dp.safety?.battery_low) lowBatteryCount++;
    });

    return {
      fall_detected_count: fallCount,
      low_battery_count: lowBatteryCount,
      any_falls: fallCount > 0,
      any_low_battery: lowBatteryCount > 0,
    };
  }

  /**
   * Extract critical alerts from data points
   */
  extractAlerts(dataPoints) {
    const alerts = [];

    dataPoints.forEach(dp => {
      // Fall detection
      if (dp.safety?.fall_detected) {
        alerts.push({
          type: 'fall_detected',
          timestamp: dp.timestamp,
          severity: 'critical',
        });
      }

      // High tremor
      if (dp.tremor?.amplitude_g > 15) {
        alerts.push({
          type: 'high_tremor',
          timestamp: dp.timestamp,
          value: dp.tremor.amplitude_g,
          severity: 'warning',
        });
      }

      // High rigidity
      if (dp.rigidity?.emg_wrist_mv > 500) {
        alerts.push({
          type: 'high_rigidity',
          timestamp: dp.timestamp,
          value: dp.rigidity.emg_wrist_mv,
          severity: 'warning',
        });
      }

      // Poor gait
      if (dp.gait?.acceleration_z_g > 2.5) {
        alerts.push({
          type: 'gait_instability',
          timestamp: dp.timestamp,
          value: dp.gait.acceleration_z_g,
          severity: 'warning',
        });
      }
    });

    return alerts;
  }

  /**
   * Check if a metric value is critical
   */
  isCritical(metricName, value) {
    const thresholds = {
      tremor: 15,
      rigidity: 500,
      gait: 2.5,
    };
    return value > (thresholds[metricName] || Infinity);
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values, mean) {
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Send aggregated data to FastAPI for Firestore storage
   */
  async sendAggregatedData(userId, aggregatedData) {
    const authToken = process.env.FIREBASE_TEST_TOKEN || 'simulator_test_token';
    
    try {
      const response = await axios.post(
        `${this.fastApiUrl}/ingest/aggregated`,
        {
          user_id: userId,
          app_id: process.env.APP_ID || 'stancesense',
          data: aggregatedData,
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[Aggregation] ✓ Sent to FastAPI - Status: ${response.status}`);
      
      // Trigger RAG analysis after successful Firestore write
      await this.triggerRAGAnalysis(userId);
      
      return response.data;
    } catch (error) {
      console.error('[Aggregation] Failed to send to FastAPI:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Trigger RAG analysis after Firestore write
   */
  async triggerRAGAnalysis(userId) {
    try {
      console.log(`[Aggregation] Triggering RAG analysis for ${userId}...`);
      
      const response = await axios.post(
        `${this.fastApiUrl}/analyze-patient-data`,
        {
          user_id: userId,
          trigger_source: 'aggregation_service',
          timestamp: new Date().toISOString(),
        },
        {
          timeout: 30000, // 30 second timeout for RAG analysis
        }
      );

      console.log(`[Aggregation] ✓ RAG analysis triggered - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      // Don't throw - RAG analysis failure shouldn't break aggregation
      console.warn('[Aggregation] RAG analysis failed (non-critical):', error.response?.data || error.message);
    }
  }
}

// Export singleton instance
module.exports = new AggregationService();
