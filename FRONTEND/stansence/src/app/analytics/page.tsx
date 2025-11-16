'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSensorData } from '@/contexts/SensorDataContext';
import { logMedication } from '@/services/medicationService';

interface SymptomData {
  tremor: number;
  rigidity: number;
  slowness: number;
  gait: number;
}

interface ChartConfig {
  type: string;
  data: { labels: string[]; datasets: Array<Record<string, unknown>> };
  options: Record<string, unknown>;
}

interface ChartInstance {
  data: {
    labels: string[];
    datasets: Array<{ data: number[] }>;
  };
  destroy(): void;
  update(mode?: string): void;
}

interface WindowWithChart extends Window {
  Chart?: new (ctx: HTMLCanvasElement, config: ChartConfig) => ChartInstance;
}

type SymptomKey = 'tremor' | 'rigidity' | 'slowness' | 'gait';

export default function Analytics() {
  const { user } = useAuth();
  const { latestData, alerts, ragAnalysis, isConnected, connectionStatus } = useSensorData();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [symptomData, setSymptomData] = useState<SymptomData>({
    tremor: 0,
    rigidity: 0,
    slowness: 0,
    gait: 0,
  });

  const [chartInstance, setChartInstance] = useState<ChartInstance | null>(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    tremor: number[];
    rigidity: number[];
    gait: number[];
  }>({ labels: [], tremor: [], rigidity: [], gait: [] });

  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    notes: ''
  });

  // Initialize Chart
  const initializeChart = useCallback(async () => {
    const ctx = document.getElementById('liveChart') as HTMLCanvasElement;
    const windowWithChart = window as WindowWithChart;
    if (!ctx || !windowWithChart.Chart) return;

    const Chart = windowWithChart.Chart;
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Tremor',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
          },
          {
            label: 'Rigidity',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
          },
          {
            label: 'Gait',
            data: [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#d1d5db',
              font: { size: 14, weight: '600', family: "'Inter', sans-serif" },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(17, 24, 39, 0.98)',
            titleColor: '#f3f4f6',
            bodyColor: '#d1d5db',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 14,
            titleFont: { size: 14, weight: '600' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
                return `${context.dataset.label}: ${Math.round(context.parsed.y)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#9ca3af',
              font: { size: 12, family: "'Inter', sans-serif" },
              callback: (value: string | number) => `${value}%`
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            border: { display: false }
          },
          x: {
            ticks: {
              color: '#9ca3af',
              font: { size: 11, family: "'Inter', sans-serif" },
              maxTicksLimit: 8
            },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });

    setChartInstance(chart);
  }, []);

  // Load Chart.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => initializeChart();
    document.body.appendChild(script);

    return () => {
      if (chartInstance) chartInstance.destroy();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [initializeChart]);

  // Update from real-time WebSocket data (reduced throttle to 500ms for more responsive updates)
  useEffect(() => {
    if (!latestData) return;
    
    const now = Date.now();
    // Reduced from 3000ms to 500ms for more responsive UI
    if (now - lastUpdateTime >= 500) {
      // Extract scores from either scores object or analysis object
      const scores = latestData.scores || {};
      const tremor = scores.tremor !== undefined ? scores.tremor * 100 : 
                     (latestData.analysis?.is_tremor_confirmed ? 50 : 0);
      const rigidity = scores.rigidity !== undefined ? scores.rigidity * 100 :
                       (latestData.analysis?.is_rigid ? 50 : 0);
      const slowness = scores.slowness !== undefined ? scores.slowness * 100 : 0;
      const gait = scores.gait !== undefined ? scores.gait * 100 :
                   (latestData.analysis?.gait_stability_score ? latestData.analysis.gait_stability_score * 100 : 0);
      
      console.log('📊 Updating UI with scores:', { tremor, rigidity, slowness, gait });
      
      setSymptomData({
        tremor,
        rigidity,
        slowness,
        gait,
      });
      setLastUpdateTime(now);
    }
  }, [latestData, lastUpdateTime]);

  // Update chart with live data
  useEffect(() => {
    if (!latestData || !chartInstance) return;

    const scores = latestData.scores || {};
    const hasSomeData = scores.tremor !== undefined || scores.rigidity !== undefined || scores.gait !== undefined;
    
    if (!hasSomeData) {
      console.log('⚠️ No score data available yet');
      return;
    }

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setChartData(prev => {
      const tremorValue = scores.tremor !== undefined ? scores.tremor * 100 : 0;
      const rigidityValue = scores.rigidity !== undefined ? scores.rigidity * 100 : 0;
      const gaitValue = scores.gait !== undefined ? scores.gait * 100 : 
                        (latestData.analysis?.gait_stability_score ? latestData.analysis.gait_stability_score * 100 : 0);
      
      const newLabels = [...prev.labels, timeLabel].slice(-20);
      const newTremor = [...prev.tremor, tremorValue].slice(-20);
      const newRigidity = [...prev.rigidity, rigidityValue].slice(-20);
      const newGait = [...prev.gait, gaitValue].slice(-20);

      chartInstance.data.labels = newLabels;
      chartInstance.data.datasets[0].data = newTremor;
      chartInstance.data.datasets[1].data = newRigidity;
      chartInstance.data.datasets[2].data = newGait;
      chartInstance.update('none');

      return { labels: newLabels, tremor: newTremor, rigidity: newRigidity, gait: newGait };
    });
  }, [latestData, chartInstance]);

  const handleLogMedication = () => {
    setShowMedicationModal(true);
  };

  const handleSubmitMedication = async () => {
    if (!medicationForm.medication_name || !medicationForm.dosage) {
      alert('Please fill in medication name and dosage');
      return;
    }

    try {
      const now = new Date();
      await logMedication({
        timestamp: now.toISOString(),
        medication_name: medicationForm.medication_name,
        dosage: medicationForm.dosage,
        notes: medicationForm.notes || undefined,
        taken_at: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });

      alert(`✓ ${medicationForm.medication_name} logged successfully!`);
      setShowMedicationModal(false);
      setMedicationForm({ medication_name: '', dosage: '', notes: '' });
    } catch (error) {
      console.error('Failed to log medication:', error);
      alert('Failed to log medication. Please try again.');
    }
  };

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

  const getSeverityLabel = (value: number) => {
    if (value < 30) return 'Mild';
    if (value < 60) return 'Moderate';
    return 'Severe';
  };

  return (
    <ProtectedRoute>
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
            StanceSense Analytics
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Real-time AI symptom monitoring & clinical insights • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Log Medication Button */}
          <button
            onClick={handleLogMedication}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            💊 Log Medication
          </button>
        </div>
      </div>

      {/* AI Clinical Summary - MOVED TO TOP */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 95, 70, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
        marginBottom: '24px'
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

      {/* 🎮 Personalized Therapy Games - RAG Analysis Results */}
      {ragAnalysis && ragAnalysis.game_recommendations && ragAnalysis.game_recommendations.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🎮
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6', marginBottom: '4px' }}>
                Personalized Therapy Games
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                AI-recommended games based on your current symptoms
              </p>
            </div>
          </div>

          <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '20px' }}>
            <strong style={{ color: '#8b5cf6' }}>💡 RAG Insights:</strong> {ragAnalysis.insights}
          </div>

          <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '24px' }}>
            <strong style={{ color: '#3b82f6' }}>📋 Recommendations:</strong> {ragAnalysis.recommendations}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {ragAnalysis.game_recommendations.map((game, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.borderColor = '#8b5cf6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                    {game.name}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: game.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' : game.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: game.difficulty === 'easy' ? '#10b981' : game.difficulty === 'medium' ? '#f59e0b' : '#ef4444',
                    textTransform: 'uppercase'
                  }}>
                    {game.difficulty}
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '12px' }}>
                  {game.description}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    ⏱️ {game.duration_minutes} min
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    🎯 {game.symptom_target}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', marginBottom: '8px' }}>
                  ✨ Benefits:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {game.benefits.map((benefit, bIndex) => (
                    <div key={bIndex} style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: '#10b981'
                      }}>✓</span>
                      {benefit}
                    </div>
                  ))}
                </div>

                <button style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  🚀 Start Game
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Real-time Sensor Cards Grid */}
      {latestData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Tremor Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tremor</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: getSeverityColor((latestData.scores?.tremor || 0) * 100), marginTop: '8px' }}>
                  {Math.round((latestData.scores?.tremor || 0) * 100)}%
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                background: `${getSeverityColor((latestData.scores?.tremor || 0) * 100)}20`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: getSeverityColor((latestData.scores?.tremor || 0) * 100)
              }}>
                {getSeverityLabel((latestData.scores?.tremor || 0) * 100)}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Frequency: {latestData.tremor.frequency_hz.toFixed(1)} Hz • Amplitude: {latestData.tremor.amplitude_g.toFixed(2)}g
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: latestData.tremor.tremor_detected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: latestData.tremor.tremor_detected ? '#ef4444' : '#10b981'
            }}>
              {latestData.tremor.tremor_detected ? '⚠️ Tremor Detected' : '✓ Normal'}
            </div>
          </div>

          {/* Rigidity Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rigidity</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: getSeverityColor((latestData.scores?.rigidity || 0) * 100), marginTop: '8px' }}>
                  {Math.round((latestData.scores?.rigidity || 0) * 100)}%
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                background: `${getSeverityColor((latestData.scores?.rigidity || 0) * 100)}20`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: getSeverityColor((latestData.scores?.rigidity || 0) * 100)
              }}>
                {getSeverityLabel((latestData.scores?.rigidity || 0) * 100)}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              EMG Wrist: {latestData.rigidity.emg_wrist.toFixed(0)} µV • Arm: {latestData.rigidity.emg_arm.toFixed(0)} µV
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: latestData.rigidity.rigid ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: latestData.rigidity.rigid ? '#ef4444' : '#10b981'
            }}>
              {latestData.rigidity.rigid ? '⚠️ Rigidity Detected' : '✓ Normal'}
            </div>
          </div>

          {/* Gait Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gait Stability</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0)), marginTop: '8px' }}>
                  {Math.round(latestData.analysis?.gait_stability_score || 0)}%
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                background: `${getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0))}20`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0))
              }}>
                {getSeverityLabel(100 - (latestData.analysis?.gait_stability_score || 0))}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Acceleration: X:{latestData.safety.accel_x_g.toFixed(2)}g Y:{latestData.safety.accel_y_g.toFixed(2)}g Z:{latestData.safety.accel_z_g.toFixed(2)}g
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: latestData.safety.fall_detected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: latestData.safety.fall_detected ? '#ef4444' : '#10b981'
            }}>
              {latestData.safety.fall_detected ? '🚨 FALL DETECTED' : '✓ No Fall Detected'}
            </div>
          </div>
        </div>
      )}

      {/* Side by Side: Live Chart + Overall Score */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Live Chart Section - SMALLER */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              Live Symptom Monitoring
            </h2>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.5s infinite'
              }} />
              LIVE
            </div>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <canvas id="liveChart"></canvas>
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            Last 20 data points • Updates every 3s
          </div>
        </div>

        {/* Overall Score Card - SAME SIZE */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Overall Symptom Severity
          </div>
          <div style={{
            fontSize: 'clamp(56px, 8vw, 80px)',
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
            border: `2px solid ${progressionStage.color}40`,
            margin: '0 auto'
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
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            Based on UPDRS-III clinical assessment
          </div>
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

      {/* Medication Modal */}
      {showMedicationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowMedicationModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', marginBottom: '32px' }}>
              💊 Log Medication
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                Medication Name *
              </label>
              <input
                type="text"
                value={medicationForm.medication_name}
                onChange={(e) => setMedicationForm({ ...medicationForm, medication_name: e.target.value })}
                placeholder="e.g., Levodopa, Carbidopa"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                Dosage *
              </label>
              <input
                type="text"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                placeholder="e.g., 100mg, 2 tablets"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                Notes (optional)
              </label>
              <textarea
                value={medicationForm.notes}
                onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowMedicationModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMedication}
                disabled={!medicationForm.medication_name || !medicationForm.dosage}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  background: medicationForm.medication_name && medicationForm.dosage
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: medicationForm.medication_name && medicationForm.dosage ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: medicationForm.medication_name && medicationForm.dosage
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (medicationForm.medication_name && medicationForm.dosage) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = medicationForm.medication_name && medicationForm.dosage
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none';
                }}
              >
                Log Medication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
          body {
            padding: 16px;
          }
        }
      `}</style>
    </div>
    </ProtectedRoute>
  );
}
