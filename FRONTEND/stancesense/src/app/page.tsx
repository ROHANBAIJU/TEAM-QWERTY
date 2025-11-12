'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doses, setDoses] = useState([
    { time: '8:00 AM', name: 'Morning Dose', taken: true, takenAt: null as string | null },
    { time: '2:00 PM', name: 'Afternoon Dose', taken: false, takenAt: null as string | null },
    { time: '8:00 PM', name: 'Evening Dose', taken: false, takenAt: null as string | null },
  ]);

  // Check authentication on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  const initializeChart = useCallback(() => {
    const ctx = document.getElementById('symptomChart') as HTMLCanvasElement;
    const windowWithChart = window as WindowWithChart;
    if (!ctx || !windowWithChart.Chart) return;

    const Chart = windowWithChart.Chart;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM', '12AM'],
        datasets: [
          {
            label: 'Your Symptoms',
            data: [3, 2.8, 3.2, 4, 3.5, 3, 2.5, 2, 3.5, 2.8, 3.2, 3, 3.5],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Medication Taken',
            data: [null, null, null, null, 4.5, null, null, null, 4.5, null, null, null, null],
            borderColor: '#fbbf24',
            backgroundColor: '#fbbf24',
            pointStyle: 'circle',
            pointRadius: 8,
            showLine: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: { datasetIndex: number; parsed: { y: number } }) => {
                if (context.datasetIndex === 1 && context.parsed.y) {
                  return 'Medication Taken: ' + context.parsed.y;
                }
                return 'Your Symptoms: ' + context.parsed.y;
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 5,
            ticks: { color: '#9ca3af', font: { size: 12 } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: { 
            ticks: { color: '#9ca3af', font: { size: 12 } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });

    // WebSocket live data from backend
    const [liveMessage, setLiveMessage] = useState<string | null>(null);
    useEffect(() => {
      // Only run in browser
      try {
        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL as string) || 'ws://127.0.0.1:8000/ws/frontend-data';
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => console.info('Connected to backend WS', wsUrl);
        ws.onmessage = (ev) => {
          try {
            const payload = typeof ev.data === 'string' ? ev.data : JSON.stringify(ev.data);
            setLiveMessage(payload);
            console.debug('WS message', payload);
          } catch (e) { console.warn('WS parse error', e); }
        };
        ws.onerror = (e) => console.warn('WS error', e);
        ws.onclose = () => console.info('WS closed');
        return () => { ws.close(); };
      } catch (e) {
        console.warn('WS init failed', e);
      }
    }, []);
  }, []);

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
    const now = new Date();
    const currentHour = now.getHours();
    
    let doseIndex = -1;
    let doseLabel = '';
    
    if (currentHour >= 6 && currentHour < 11) {
      doseIndex = 0;
      doseLabel = 'Morning Dose';
    } else if (currentHour >= 11 && currentHour < 18) {
      doseIndex = 1;
      doseLabel = 'Afternoon Dose';
    } else {
      doseIndex = 2;
      doseLabel = 'Evening Dose';
    }

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

      alert(`✓ ${doseLabel} logged successfully\nRecorded at: ${actualTime}`);
    }
  };

  const handleLogSymptom = () => {
    router.push('/notes');
  };

  // Don't render dashboard until authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
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
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', flexShrink: 0 }}>Your Symptom Trends (Last 24 Hours)</h3>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <canvas id="symptomChart"></canvas>
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '16px', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6' }}></div>
                <span>Your Symptoms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fbbf24' }}></div>
                <span>Medication Taken</span>
              </div>
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
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Status Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: '700' }}>✓</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Medication Status</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>Feeling Good</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: '700' }}>⏰</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Next Medication</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#3b82f6' }}>Due at 2:00 PM</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: '700' }}>✓</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Safety Check</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>No Recent Falls</div>
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
    </>
  );
}

