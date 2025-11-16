'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, ProcessedData, Alert, RAGAnalysis } from '@/hooks/useWebSocket';

interface SensorDataContextType {
  latestData: ProcessedData | null;
  alerts: Alert[];
  ragAnalysis: RAGAnalysis | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  hasPermanentError: boolean;
  reconnect: () => void;
}

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export function SensorDataProvider({ children }: { children: ReactNode }) {
  const websocketData = useWebSocket();

  return (
    <SensorDataContext.Provider value={websocketData}>
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData() {
  const context = useContext(SensorDataContext);
  if (context === undefined) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
}
