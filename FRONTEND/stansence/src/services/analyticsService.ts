/**
 * Analytics API service for fetching historical sensor data
 */

const API_BASE_URL = 'http://localhost:8000/api';

interface TrendsResponse {
  start_time: string;
  end_time: string;
  hours: number;
  data_points: Array<{
    timestamp: string;
    scores: {
      tremor: number;
      rigidity: number;
      slowness: number;
      gait: number;
    };
    analysis: {
      is_tremor_confirmed: boolean;
      is_rigid: boolean;
      gait_stability_score: number;
    };
    critical_event?: string;
  }>;
}

interface HistoryResponse {
  items: Array<{
    id: string;
    timestamp: string;
    scores: {
      tremor: number;
      rigidity: number;
      slowness: number;
      gait: number;
    };
    safety: {
      fall_detected: boolean;
      accel_x_g: number;
      accel_y_g: number;
      accel_z_g: number;
    };
    tremor: {
      frequency_hz: number;
      amplitude_g: number;
      tremor_detected: boolean;
    };
    rigidity: {
      emg_wrist: number;
      emg_arm: number;
      rigid: boolean;
    };
    analysis: {
      is_tremor_confirmed: boolean;
      is_rigid: boolean;
      gait_stability_score: number;
    };
    critical_event?: string;
    rehab_suggestion?: string;
  }>;
  limit: number;
  offset: number;
  count: number;
}

interface SummaryResponse {
  period_days: number;
  start_time: string;
  end_time: string;
  data_points_count: number;
  averages: {
    tremor: number;
    rigidity: number;
    gait: number;
    slowness: number;
  };
  peaks: {
    tremor: number;
    rigidity: number;
    gait: number;
    slowness: number;
  };
  fall_count: number;
  critical_events_count: number;
  recent_critical_events: Array<{
    timestamp: string;
    event: string;
  }>;
}

class AnalyticsService {
  private getAuthHeader(): string {
    // For now, use simulator token - will be replaced with real Firebase auth
    return 'Bearer simulator_test_token';
  }

  async getTrends(hours: number = 24): Promise<TrendsResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/trends?hours=${hours}`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trends: ${response.statusText}`);
    }

    return response.json();
  }

  async getHistory(limit: number = 50, offset: number = 0): Promise<HistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/history?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    return response.json();
  }

  async getSummary(days: number = 7): Promise<SummaryResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/summary?days=${days}`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch summary: ${response.statusText}`);
    }

    return response.json();
  }
}

export const analyticsService = new AnalyticsService();
export type { TrendsResponse, HistoryResponse, SummaryResponse };
