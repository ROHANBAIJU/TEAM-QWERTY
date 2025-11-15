'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSensorData } from '@/contexts/SensorDataContext';

interface SymptomData {
  tremor: number;
  rigidity: number;
  slowness: number;
  gait: number;
}

type SymptomKey = 'tremor' | 'rigidity' | 'slowness' | 'gait';

export default function Analytics() {
  const { latestData, isConnected } = useSensorData();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [symptomData, setSymptomData] = useState<SymptomData>({
    tremor: 0,
    rigidity: 0,
    slowness: 0,
    gait: 0,
  });

  // Update from real-time WebSocket data (throttled to 3 seconds)
  useEffect(() => {
    if (latestData && latestData.scores) {
      const now = Date.now();
      if (now - lastUpdateTime >= 3000) {
        setSymptomData({
          tremor: latestData.scores.tremor * 100,
          rigidity: latestData.scores.rigidity * 100,
          slowness: latestData.scores.slowness * 100,
          gait: latestData.scores.gait * 100,
        });
        setLastUpdateTime(now);
      }
    }
  }, [latestData, lastUpdateTime]);

  const overallScore = useMemo(() => {
    return Math.round((symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4);
  }, [symptomData]);

  const progressionStage = useMemo(() => {
    if (overallScore < 30) return { label: 'Mild', color: '#10b981' };
    if (overallScore < 60) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'Severe', color: '#ef4444' };
  }, [overallScore]);

  const getSeverityColor = (value: number) => {
    if (value < 30) return '#10b981';
    if (value < 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            AI Symptom Analysis
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Real-time AI-powered Parkinson's symptom monitoring
          </p>
        </div>

        {/* Connection Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444',
            animation: isConnected ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: isConnected ? '#10b981' : '#ef4444' }}>
            {isConnected ? 'AI Active' : 'AI Offline'}
          </span>
        </div>
      </div>

      {/* Overall Score Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Overall Symptom Severity
        </div>
        <div style={{
          fontSize: 'clamp(64px, 10vw, 96px)',
          fontWeight: '900',
          background: `linear-gradient(135deg, ${progressionStage.color} 0%, ${progressionStage.color}dd 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px'
        }}>
          {overallScore}%
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: `${progressionStage.color}20`,
          borderRadius: '16px',
          border: `2px solid ${progressionStage.color}40`
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: progressionStage.color,
            animation: 'pulse 1.5s infinite'
          }} />
          <span style={{ fontSize: '16px', fontWeight: '700', color: progressionStage.color }}>
            {progressionStage.label} Stage
          </span>
        </div>
        <div style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
          Based on UPDRS-III clinical assessment
        </div>
      </div>

      {/* Individual Symptom Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Tremor Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(239, 68, 68, 0.3)';
          e.currentTarget.style.borderColor = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🤝
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Tremor</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.tremor) }}>
                {Math.round(symptomData.tremor)}%
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.tremor}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.tremor)} 0%, ${getSeverityColor(symptomData.tremor)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Measures involuntary shaking frequency and amplitude
          </div>
        </div>

        {/* Rigidity Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(245, 158, 11, 0.3)';
          e.currentTarget.style.borderColor = '#f59e0b';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              💪
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Rigidity</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.rigidity) }}>
                {Math.round(symptomData.rigidity)}%
              </div>
            </div>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.rigidity}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.rigidity)} 0%, ${getSeverityColor(symptomData.rigidity)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            EMG-based muscle stiffness and resistance detection
          </div>
        </div>

        {/* Slowness Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.3)';
          e.currentTarget.style.borderColor = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⏱️
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Slowness</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.slowness) }}>
                {Math.round(symptomData.slowness)}%
              </div>
            </div>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.slowness}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.slowness)} 0%, ${getSeverityColor(symptomData.slowness)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Movement initiation speed and bradykinesia assessment
          </div>
        </div>

        {/* Gait Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(139, 92, 246, 0.3)';
          e.currentTarget.style.borderColor = '#8b5cf6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🚶
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Gait Instability</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.gait) }}>
                {Math.round(symptomData.gait)}%
              </div>
            </div>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.gait}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.gait)} 0%, ${getSeverityColor(symptomData.gait)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Walking stability, balance, and fall risk evaluation
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 95, 70, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
              AI Clinical Summary
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Powered by StanceSense AI Engine
            </p>
          </div>
        </div>

        <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '20px' }}>
          Patient is currently in <strong style={{ color: progressionStage.color }}>{progressionStage.label.toLowerCase()} stage</strong> with an overall symptom severity of <strong style={{ color: '#10b981' }}>{overallScore}%</strong>. 
          {symptomData.tremor > 60 && ' Tremor levels are elevated, indicating increased involuntary movement patterns.'}
          {symptomData.rigidity > 60 && ' Significant muscle rigidity detected, suggesting enhanced muscle tone resistance.'}
          {symptomData.slowness > 60 && ' Bradykinesia assessment shows notable movement slowness.'}
          {symptomData.gait > 60 && ' Gait instability is concerning - recommend fall prevention strategies.'}
          {overallScore < 40 && ' Symptoms are well-controlled. Continue current therapy regimen.'}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Dominant Symptom</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              {Object.entries(symptomData).reduce((a, b) => a[1] > b[1] ? a : b)[0].charAt(0).toUpperCase() + Object.entries(symptomData).reduce((a, b) => a[1] > b[1] ? a : b)[0].slice(1)}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Fall Risk Level</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: getSeverityColor(symptomData.gait) }}>
              {symptomData.gait < 30 ? 'Low' : symptomData.gait < 60 ? 'Moderate' : 'High'}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Last Update</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
          </div>
        </div>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
