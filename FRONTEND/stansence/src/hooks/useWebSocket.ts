import { useEffect, useRef, useState, useCallback } from 'react';

export interface ProcessedData {
  timestamp: string;
  device_id?: string;
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
  scores?: {
    tremor: number;
    rigidity: number;
    slowness: number;
    gait: number;
  };
  critical_event?: string;
  rehab_suggestion?: string;
  care_recommendations?: string[];
  recommended_game?: {
    name: string;
    reason: string;
    target_symptom: string;
  };
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  type: 'fall' | 'tremor' | 'rigidity' | 'medication';
}

export interface GameRecommendation {
  name: string;
  description: string;
  symptom_target: string;
  difficulty: string;
  duration_minutes: number;
  benefits: string[];
}

export interface RAGAnalysis {
  user_id: string;
  timestamp: string;
  insights: string;
  recommendations: string;
  game_recommendations: GameRecommendation[];
  critical_alerts_count: number;
  alerts: Alert[];
}

interface WebSocketMessage {
  type: 'processed_data' | 'alert' | 'rag_analysis';
  data: ProcessedData | Alert | RAGAnalysis;
}

interface UseWebSocketReturn {
  latestData: ProcessedData | null;
  alerts: Alert[];
  ragAnalysis: RAGAnalysis | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
}

export function useWebSocket(url?: string): UseWebSocketReturn {
  // Use environment variable or fallback to localhost:8000 (FastAPI) for development
  const defaultUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL 
    ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/frontend-data`
    : 'ws://localhost:8000/ws/frontend-data';  // Changed from 8080 to 8000
  
  const wsUrl = url || defaultUrl;
  
  const [latestData, setLatestData] = useState<ProcessedData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ragAnalysis, setRagAnalysis] = useState<RAGAnalysis | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // Start with 1 second
  const lastUpdateRef = useRef<number>(0);
  const updateThrottleMs = 500; // Reduced from 2000ms to 500ms for more responsive updates
  const lastDataReceivedRef = useRef<number>(0);
  const dataTimeoutMs = 10000; // 10 second timeout
  const [hasReceivedData, setHasReceivedData] = useState(false);

  useEffect(() => {
    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      setConnectionStatus('connecting');
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected to backend');
          setIsConnected(true);
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            const now = Date.now();
            lastDataReceivedRef.current = now;
            setHasReceivedData(true);
            
            if (message.type === 'processed_data') {
              // Throttle updates to prevent overwhelming React with re-renders
              if (now - lastUpdateRef.current >= updateThrottleMs) {
                const processedData = message.data as ProcessedData;
                setLatestData(processedData);
                lastUpdateRef.current = now;
                console.log('Updated sensor data:', processedData);
                console.log('Analysis present?', !!processedData.analysis, processedData.analysis);
                console.log('Scores:', processedData.scores);
              }
            } else if (message.type === 'alert') {
              const alert = message.data as Alert;
              setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
              console.log('Received alert:', alert);
            } else if (message.type === 'rag_analysis') {
              const ragData = message.data as RAGAnalysis;
              setRagAnalysis(ragData);
              console.log('🎮 RAG Analysis with Games:', ragData);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('error');
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setConnectionStatus('disconnected');
          wsRef.current = null;

          // Auto-reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            console.error('Max reconnection attempts reached');
            setConnectionStatus('error');
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connect();

    // Monitor for data timeout
    const timeoutInterval = setInterval(() => {
      if (isConnected && hasReceivedData) {
        const timeSinceLastData = Date.now() - lastDataReceivedRef.current;
        if (timeSinceLastData > dataTimeoutMs) {
          console.warn('⚠️ No data received for 10 seconds - backend may be disconnected');
          // Don't change status to error if we're still connected to WebSocket
          // Only warn in console
        }
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(timeoutInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl, isConnected, hasReceivedData]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    setConnectionStatus('connecting');
    // Trigger a reconnect by closing current connection - useEffect will handle reconnection
  }, []);

  return {
    latestData,
    alerts,
    ragAnalysis,
    isConnected,
    connectionStatus,
    reconnect,
  };
}
