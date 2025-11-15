'use client';

import { useEffect, useState } from 'react';
import { useSensorData } from '@/contexts/SensorDataContext';

type DeviceStatus = {
  device_id: string;
  name: string;
  status: 'operational' | 'warning';
  battery_percent: number;
  signal_strength_dbm: number;
  connection_quality: string;
  last_ping: string;
  firmware_version: string;
  location: string;
  packet_loss_percent: number;
  latency_ms: number;
  uptime_seconds: number;
};

type GatewayStatus = {
  connection_type: string;
  packet_loss_percent: number;
  latency_median_ms: number;
  jitter_ms: number;
  uptime_seconds: number;
  last_reboot: string;
};

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function Hardware() {
  const { latestData, isConnected } = useSensorData();
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHardwareStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/hardware/status', {
          headers: { 'Authorization': 'Bearer simulator_test_token' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDevices(data.devices || []);
          setGateway(data.gateway || null);
        }
      } catch (error) {
        console.error('Failed to fetch hardware status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHardwareStatus();
    const interval = setInterval(fetchHardwareStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getBatteryColor = (percent: number) => {
    if (percent < 20) return '#ef4444';
    if (percent < 50) return '#f59e0b';
    return '#10b981';
  };

  const getSignalStrength = (dbm: number) => {
    if (dbm > -60) return { label: 'Strong', color: '#10b981' };
    if (dbm > -70) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'Weak', color: '#ef4444' };
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
            Hardware Monitoring
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Real-time device health and network diagnostics
          </p>
        </div>

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
            {isConnected ? 'System Online' : 'System Offline'}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{
          padding: '80px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            border: '4px solid rgba(139, 92, 246, 0.2)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading hardware status...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Device Cards */}
          {devices.map((device) => {
            const signal = getSignalStrength(device.signal_strength_dbm);
            const isHealthy = device.status === 'operational' && device.battery_percent >= 20;
            
            return (
              <div
                key={device.device_id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  boxShadow: `0 8px 32px ${isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 48px ${isHealthy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`;
                }}
              >
                {/* Device Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      {device.location}
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                      {device.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {device.device_id}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isHealthy ? '#10b981' : '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {device.status === 'operational' ? '✓ Online' : '⚠ Warning'}
                  </div>
                </div>

                {/* Battery Meter */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Battery Level</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: getBatteryColor(device.battery_percent) }}>
                      {device.battery_percent.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${device.battery_percent}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getBatteryColor(device.battery_percent)} 0%, ${getBatteryColor(device.battery_percent)}dd 100%)`,
                      borderRadius: '5px',
                      transition: 'width 0.6s ease',
                      boxShadow: `0 0 10px ${getBatteryColor(device.battery_percent)}40`
                    }} />
                  </div>
                </div>

                {/* Signal Strength */}
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Signal Strength</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: signal.color }}>
                      {device.signal_strength_dbm} dBm
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: `${signal.color}20`,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: signal.color
                    }}>
                      {signal.label}
                    </span>
                  </div>
                </div>

                {/* Device Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Packet Loss</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: device.packet_loss_percent > 5 ? '#f59e0b' : '#10b981' }}>
                      {device.packet_loss_percent.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Latency</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: device.latency_ms > 100 ? '#f59e0b' : '#10b981' }}>
                      {device.latency_ms}ms
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Firmware:</span> {device.firmware_version}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Uptime:</span> {formatUptime(device.uptime_seconds)}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Last Sync:</span> {new Date(device.last_ping).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gateway Health Section */}
      {gateway && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🌐
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                Gateway Health
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Network infrastructure diagnostics
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Connection Type</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                {gateway.connection_type}
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Packet Loss</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: gateway.packet_loss_percent > 2 ? '#f59e0b' : '#10b981' }}>
                {gateway.packet_loss_percent.toFixed(2)}%
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Latency</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                {gateway.latency_median_ms}ms
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Jitter</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                {gateway.jitter_ms}ms
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Uptime</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                {formatUptime(gateway.uptime_seconds)}
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              borderLeft: '4px solid #64748b'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Last Reboot</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                {new Date(gateway.last_reboot).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Feed */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
            Live Sensor Feed
          </h3>
          <div style={{
            padding: '6px 12px',
            background: latestData ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            color: latestData ? '#10b981' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: latestData ? '#10b981' : '#6b7280',
              animation: latestData ? 'pulse 1.5s infinite' : 'none'
            }} />
            {latestData ? 'STREAMING' : 'WAITING'}
          </div>
        </div>

        <div style={{
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: '13px',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
          lineHeight: '1.8'
        }}>
          {latestData ? (
            <>
              <div style={{ color: '#10b981', marginBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>●</span> <strong>Device ID:</strong> {latestData.device_id || 'Unknown'}
              </div>
              <div style={{ color: '#3b82f6', marginBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>●</span> <strong>Timestamp:</strong> {new Date(latestData.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ color: '#8b5cf6', marginBottom: '4px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <strong>📊 TREMOR DATA:</strong>
              </div>
              <div style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                <div>Frequency: <span style={{ color: '#f59e0b' }}>{latestData.tremor.frequency_hz.toFixed(2)} Hz</span></div>
                <div>Amplitude: <span style={{ color: '#f59e0b' }}>{latestData.tremor.amplitude_g.toFixed(3)}g</span></div>
                <div>Status: <span style={{ color: latestData.tremor.tremor_detected ? '#ef4444' : '#10b981' }}>
                  {latestData.tremor.tremor_detected ? '⚠ DETECTED' : '✓ Normal'}
                </span></div>
              </div>

              <div style={{ color: '#8b5cf6', marginBottom: '4px', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <strong>💪 RIGIDITY DATA:</strong>
              </div>
              <div style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                <div>EMG Wrist: <span style={{ color: '#f59e0b' }}>{latestData.rigidity.emg_wrist.toFixed(1)} µV</span></div>
                <div>EMG Arm: <span style={{ color: '#f59e0b' }}>{latestData.rigidity.emg_arm.toFixed(1)} µV</span></div>
                <div>Status: <span style={{ color: latestData.rigidity.rigid ? '#ef4444' : '#10b981' }}>
                  {latestData.rigidity.rigid ? '⚠ RIGID' : '✓ Normal'}
                </span></div>
              </div>

              <div style={{ color: '#8b5cf6', marginBottom: '4px', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <strong>🛡️ SAFETY DATA:</strong>
              </div>
              <div style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                <div>Accel X: <span style={{ color: '#3b82f6' }}>{latestData.safety.accel_x_g.toFixed(3)}g</span></div>
                <div>Accel Y: <span style={{ color: '#3b82f6' }}>{latestData.safety.accel_y_g.toFixed(3)}g</span></div>
                <div>Accel Z: <span style={{ color: '#3b82f6' }}>{latestData.safety.accel_z_g.toFixed(3)}g</span></div>
                <div>Fall Status: <span style={{ color: latestData.safety.fall_detected ? '#ef4444' : '#10b981' }}>
                  {latestData.safety.fall_detected ? '🚨 FALL DETECTED' : '✓ No Fall'}
                </span></div>
              </div>

              {latestData.scores && (
                <>
                  <div style={{ color: '#8b5cf6', marginBottom: '4px', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <strong>🤖 AI ANALYSIS:</strong>
                  </div>
                  <div style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                    <div>Tremor Score: <span style={{ color: '#ef4444' }}>{(latestData.scores.tremor * 100).toFixed(1)}%</span></div>
                    <div>Rigidity Score: <span style={{ color: '#f59e0b' }}>{(latestData.scores.rigidity * 100).toFixed(1)}%</span></div>
                    <div>Slowness Score: <span style={{ color: '#3b82f6' }}>{(latestData.scores.slowness * 100).toFixed(1)}%</span></div>
                    <div>Gait Score: <span style={{ color: '#8b5cf6' }}>{(latestData.scores.gait * 100).toFixed(1)}%</span></div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
              Waiting for sensor data stream...
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
