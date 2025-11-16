'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSensorData } from '@/contexts/SensorDataContext';
import { logMedication } from '@/services/medicationService';

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

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { latestData, alerts, isConnected, connectionStatus } = useSensorData();
  
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

  // Update chart with live data
  useEffect(() => {
    if (!latestData || !chartInstance || !latestData.scores) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setChartData(prev => {
      const newLabels = [...prev.labels, timeLabel].slice(-20);
      const newTremor = [...prev.tremor, (latestData.scores?.tremor || 0) * 100].slice(-20);
      const newRigidity = [...prev.rigidity, (latestData.scores?.rigidity || 0) * 100].slice(-20);
      const newGait = [...prev.gait, (latestData.scores?.gait || 0) * 100].slice(-20);

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
              StanceSense Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Real-time Parkinson's monitoring • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Live Sensor Cards */}
          {latestData && (
            <>
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
            </>
          )}
        </div>

        {/* Live Chart */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
              Live Symptom Monitoring
            </h2>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              fontSize: '12px',
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
          <div style={{ height: '400px', position: 'relative' }}>
            <canvas id="liveChart"></canvas>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Displaying last 20 data points • Updates every 3 seconds
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Critical Alerts ({alerts.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.slice(0, 3).map((alert, index) => (
                <div key={index} style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  borderLeft: '4px solid #ef4444'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {alert.message.split('\n')[0]}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Pulse Animation Keyframes */}
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
