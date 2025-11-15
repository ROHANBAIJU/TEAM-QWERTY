'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSensorData } from '@/contexts/SensorDataContext';
import { analyticsService } from '@/services/analyticsService';
import { logMedication } from '@/services/medicationService';

// Define Chart type
interface ChartConfig {
  type: string;
  data: {
    labels: string[];
    datasets: Array<Record<string, unknown>>;
  };
  options: Record<string, unknown>;
}

interface ChartInstance {
  destroy(): void;
}

interface WindowWithChart extends Window {
  Chart?: new (ctx: HTMLCanvasElement, config: ChartConfig) => ChartInstance;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { latestData, alerts, isConnected, connectionStatus } = useSensorData();
  const [doses, setDoses] = useState([
    { time: '8:00 AM', name: 'Morning Dose', taken: true, takenAt: null as string | null },
    { time: '2:00 PM', name: 'Afternoon Dose', taken: false, takenAt: null as string | null },
    { time: '8:00 PM', name: 'Evening Dose', taken: false, takenAt: null as string | null },
  ]);
  const [chartData, setChartData] = useState<{
    labels: string[];
    tremor: number[];
    rigidity: number[];
    gait: number[];
  }>({
    labels: [],
    tremor: [],
    rigidity: [],
    gait: []
  });
  const [chartInstance, setChartInstance] = useState<ChartInstance | null>(null);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    notes: ''
  });

  // Remove old localStorage auth check

  const initializeChart = useCallback(async () => {
    const ctx = document.getElementById('symptomChart') as HTMLCanvasElement;
    const windowWithChart = window as WindowWithChart;
    if (!ctx || !windowWithChart.Chart) return;

    const Chart = windowWithChart.Chart;
    
    // Initialize with empty data for live updates
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
            fill: false,
            borderWidth: 2,
          },
          {
            label: 'Rigidity',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: false,
            borderWidth: 2,
          },
          {
            label: 'Gait Instability',
            data: [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: false,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: {
              color: '#d1d5db',
              font: { size: 13, weight: 'bold' },
              padding: 15,
              usePointStyle: true,
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#f3f4f6',
            bodyColor: '#d1d5db',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
                return `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 1,
            ticks: { 
              color: '#9ca3af', 
              font: { size: 12 },
              callback: (value: string | number) => `${(Number(value) * 100).toFixed(0)}%`
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: {
              display: true,
              text: 'Symptom Severity',
              color: '#9ca3af',
              font: { size: 13, weight: 'bold' }
            }
          },
          x: { 
            ticks: { 
              color: '#9ca3af', 
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: {
              display: true,
              text: 'Last 5 Minutes (Real-Time)',
              color: '#10b981',
              font: { size: 13, weight: 'bold' }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    setChartInstance(chart);
  }, []);

  // Update chart with live data
  useEffect(() => {
    if (latestData && chartInstance && latestData.scores) {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      setChartData(prev => {
        const newLabels = [...prev.labels, timeLabel];
        const newTremor = [...prev.tremor, latestData.scores!.tremor];
        const newRigidity = [...prev.rigidity, latestData.scores!.rigidity];
        const newGait = [...prev.gait, latestData.scores!.gait];

        // Keep only last 20 data points (approx 5 minutes at 3sec intervals)
        const maxPoints = 20;
        const labels = newLabels.slice(-maxPoints);
        const tremor = newTremor.slice(-maxPoints);
        const rigidity = newRigidity.slice(-maxPoints);
        const gait = newGait.slice(-maxPoints);

        // Update chart
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = tremor;
        chartInstance.data.datasets[1].data = rigidity;
        chartInstance.data.datasets[2].data = gait;
        chartInstance.update('none'); // Update without animation for smooth real-time

        return { labels, tremor, rigidity, gait };
      });
    }
  }, [latestData, chartInstance]);

  useEffect(() => {
    // Load Chart.js for the symptom chart
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => initializeChart();
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [initializeChart]);

  const handleLogDose = () => {
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

      // Update dose tracker
      const currentHour = now.getHours();
      let doseIndex = -1;
      if (currentHour >= 6 && currentHour < 11) doseIndex = 0;
      else if (currentHour >= 11 && currentHour < 18) doseIndex = 1;
      else doseIndex = 2;

      if (doseIndex !== -1) {
        const hours = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
        const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        const actualTime = `${hours}:${minutes} ${ampm}`;
        setDoses(prev => {
          const newDoses = [...prev];
          newDoses[doseIndex] = { ...newDoses[doseIndex], taken: true, takenAt: actualTime };
          return newDoses;
        });
      }

      alert(`✓ Medication "${medicationForm.medication_name}" logged successfully!`);
      setShowMedicationModal(false);
      setMedicationForm({ medication_name: '', dosage: '', notes: '' });
    } catch (error) {
      console.error('Failed to log medication:', error);
      alert('Failed to log medication. Please try again.');
    }
  };

  const handleLogSymptom = () => {
    router.push('/notes');
  };

  return (
    <ProtectedRoute>
      {/* Connection Status */}
      <div style={{ 
        position: 'fixed', 
        top: '16px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        background: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        padding: '8px 14px',
        borderRadius: '8px',
        border: `1px solid ${connectionStatus === 'connected' ? '#10b981' : '#ef4444'}`
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: connectionStatus === 'connected' ? '#10b981' : '#ef4444',
          animation: connectionStatus === 'connecting' ? 'pulse 1.5s infinite' : 'none'
        }} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: connectionStatus === 'connected' ? '#10b981' : '#ef4444' }}>
          {connectionStatus === 'connected' && '● Backend Connected'}
          {connectionStatus === 'connecting' && '● Connecting...'}
          {connectionStatus === 'disconnected' && '● Disconnected'}
          {connectionStatus === 'error' && '● Connection Error'}
        </span>
      </div>

      <div className="header-buttons">
        <button className="btn-log-dose" onClick={handleLogDose}>
          💊 LOG DOSE
          <span className="keyboard-hint">Alt+D</span>
        </button>
        <button className="btn-log-symptom" onClick={handleLogSymptom}>
          📝 LOG SYMPTOM
          <span className="keyboard-hint">Alt+S</span>
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="main-chart">
          <div className="card chart-card" style={{ flex: 1.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, flexShrink: 0 }}>
                Live Symptom Monitor
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: isConnected ? '#10b981' : '#ef4444',
                  animation: isConnected ? 'pulse 2s infinite' : 'none'
                }} />
                <span style={{ fontSize: '13px', color: isConnected ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                  Updates every 3 seconds
                </span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <canvas id="symptomChart"></canvas>
            </div>
          </div>

          <div className="card" style={{ padding: '20px 22px', flex: 1.35, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Your Progress This Week
            </h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Medication On Time
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: '700', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.14)', padding: '4px 10px', borderRadius: '6px' }}>85%</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '6px' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Activity Goal Met
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.14)', padding: '4px 10px', borderRadius: '6px' }}>5 / 7 Days</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '71%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '6px' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Safety Record
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>Last Fall: 30 Days Ago</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '6px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-sidebar">
          <div
            className="card"
            style={{
              borderLeft: '4px solid #fbbf24',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '160px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Summary</h3>
            </div>
            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#d1d5db',
                background: 'rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                overflowY: 'auto',
              }}
            >
              <p style={{ margin: 0 }}>
                Your symptoms were <strong style={{ color: '#10b981' }}>stable today</strong>. Peak levels occurred at
                <strong style={{ color: '#fbbf24' }}> 6AM </strong>and
                <strong style={{ color: '#fbbf24' }}> 4PM</strong>. You&apos;re doing well compared to yesterday.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, maxHeight: '190px', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Live Sensor Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Tremor Detection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  background: latestData?.tremor.tremor_detected ? 'rgba(251, 191, 36, 0.18)' : 'rgba(16, 185, 129, 0.18)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0 
                }}>
                  <span style={{ 
                    color: latestData?.tremor.tremor_detected ? '#fbbf24' : '#10b981', 
                    fontSize: '18px', 
                    fontWeight: '700' 
                  }}>{latestData?.tremor.tremor_detected ? '⚠' : '✓'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Tremor Status</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: latestData?.tremor.tremor_detected ? '#fbbf24' : '#10b981' }}>
                    {latestData ? (latestData.tremor.tremor_detected ? `${latestData.tremor.frequency_hz.toFixed(1)} Hz` : 'Stable') : 'Waiting...'}
                  </div>
                </div>
              </div>
              {/* Rigidity Detection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  background: latestData?.rigidity.rigid ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0 
                }}>
                  <span style={{ 
                    color: latestData?.rigidity.rigid ? '#ef4444' : '#10b981', 
                    fontSize: '18px', 
                    fontWeight: '700' 
                  }}>{latestData?.rigidity.rigid ? '⚠' : '✓'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Rigidity Status</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: latestData?.rigidity.rigid ? '#ef4444' : '#10b981' }}>
                    {latestData ? (latestData.rigidity.rigid ? 'Detected' : 'Normal') : 'Waiting...'}
                  </div>
                </div>
              </div>
              {/* Fall Detection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  background: latestData?.safety.fall_detected ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0 
                }}>
                  <span style={{ 
                    color: latestData?.safety.fall_detected ? '#ef4444' : '#10b981', 
                    fontSize: '18px', 
                    fontWeight: '700' 
                  }}>{latestData?.safety.fall_detected ? '🚨' : '✓'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Safety Check</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: latestData?.safety.fall_detected ? '#ef4444' : '#10b981' }}>
                    {latestData ? (latestData.safety.fall_detected ? 'FALL DETECTED!' : 'No Falls') : 'Waiting...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card doses-card">
            <div className="doses-header">Today&apos;s Doses</div>
            <div className="doses-list">
              {doses.map((dose, index) => (
                <div key={index} className={`dose-item ${dose.taken ? 'taken' : ''}`}>
                  <div className="dose-time">{dose.time}</div>
                  <div className="dose-name">{dose.name}</div>
                  {dose.taken && (
                    <span className="dose-status" dangerouslySetInnerHTML={{
                      __html: `✓ Taken${dose.takenAt ? `<br><small style="font-size: 10px; opacity: 0.8;">${dose.takenAt}</small>` : ''}`
                    }} />
                  )}
                </div>
              ))}
            </div>
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
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }} onClick={() => setShowMedicationModal(false)}>
          <div style={{
            background: 'var(--card-bg)',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)' }}>
              💊 Log Medication
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Medication Name *
              </label>
              <input
                type="text"
                value={medicationForm.medication_name}
                onChange={(e) => setMedicationForm({ ...medicationForm, medication_name: e.target.value })}
                placeholder="e.g., Levodopa, Carbidopa"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Dosage *
              </label>
              <input
                type="text"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                placeholder="e.g., 100mg, 2 tablets"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Notes (optional)
              </label>
              <textarea
                value={medicationForm.notes}
                onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMedicationModal(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMedication}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent-success)',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Log Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

