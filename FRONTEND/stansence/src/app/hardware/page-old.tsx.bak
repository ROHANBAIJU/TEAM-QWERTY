"use client";

import { useEffect, useRef, useState } from "react";
import { useSensorData } from "@/contexts/SensorDataContext";

type DeviceStatus = {
	device_id: string;
	name: string;
	status: "operational" | "warning";
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

type HardwareResponse = {
	devices: DeviceStatus[];
	gateway: GatewayStatus;
};

type LogLevel = "info" | "success" | "warning" | "error";

type LogEntry = {
	timestamp: string;
	device: string;
	message: string;
	status: LogLevel;
};

type ExtendedLogEntry = LogEntry & { id: string };

// Helper function to determine if device has issues
const getDeviceHealthStatus = (device: DeviceStatus): "healthy" | "warning" => {
	if (device.status === "warning") return "warning";
	if (device.battery_percent < 20) return "warning";
	if (device.connection_quality === "weak") return "warning";
	return "healthy";
};

const formatUptime = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return `${hours}h ${minutes}m`;
};

const formatSignalStrength = (dbm: number): string => {
	if (dbm > -60) return `${dbm} dBm (Strong)`;
	if (dbm > -70) return `${dbm} dBm (Moderate)`;
	return `${dbm} dBm (Weak)`;
};

export default function Hardware() {
	const { latestData, isConnected } = useSensorData();
	const [devices, setDevices] = useState<DeviceStatus[]>([]);
	const [gateway, setGateway] = useState<GatewayStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [scanState, setScanState] = useState<"idle" | "scanning" | "complete">("idle");
	const [scanMessage, setScanMessage] = useState<string>("");
	const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Fetch hardware status
	useEffect(() => {
		const fetchHardwareStatus = async () => {
			try {
				const response = await fetch('http://localhost:8000/api/hardware/status', {
					headers: {
						'Authorization': 'Bearer simulator_test_token'
					}
				});
				
				if (response.ok) {
					const data: HardwareResponse = await response.json();
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
		const interval = setInterval(fetchHardwareStatus, 10000); // Refresh every 10 seconds

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		// Prevent pending timeouts from persisting on unmount.
		return () => {
			if (scanTimerRef.current) {
				clearTimeout(scanTimerRef.current);
			}
		};
	}, []);

	const handleAddDevice = () => {
		if (scanTimerRef.current) {
			clearTimeout(scanTimerRef.current);
		}

		setScanState("scanning");
		setScanMessage("Scanning for new devices...");

		scanTimerRef.current = setTimeout(() => {
			setScanState("complete");
			setScanMessage("No new devices detected. Make sure your wearable is powered on and nearby.");

			scanTimerRef.current = setTimeout(() => {
				setScanState("idle");
				setScanMessage("");
				scanTimerRef.current = null;
			}, CLEAR_NOTIFICATION_DELAY);
		}, CLEAR_NOTIFICATION_DELAY);
	};

	return (
		<section className="hardware-page">
			<div className="hardware-main">
				<div className="hardware-status-column">
					{loading ? (
						<div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
							Loading hardware status...
						</div>
					) : devices.length === 0 ? (
						<div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
							No devices connected. Click "Add New Device" to scan.
						</div>
					) : (
						<div className="hardware-device-grid">
							{devices.map((device) => {
								const healthStatus = getDeviceHealthStatus(device);
								const lastPingDate = new Date(device.last_ping);
								const lastPingTime = lastPingDate.toLocaleTimeString('en-US', { 
									hour: '2-digit', 
									minute: '2-digit', 
									second: '2-digit' 
								});
								
								return (
									<article key={device.device_id} className={`hardware-device-card device-${healthStatus}`}>
										<header className="hardware-device-header">
											<h2>{device.name || device.device_id}</h2>
											<span className={`hardware-status-chip status-${device.status}`}>
												{device.status === 'operational' ? 'Operational' : 'Warning'}
											</span>
										</header>
										<div className="hardware-metric-row">
											<div className="hardware-metric">
												<span className="metric-label">Battery</span>
												<div
													className="hardware-meter"
													role="progressbar"
													aria-valuemin={0}
													aria-valuemax={100}
													aria-valuenow={device.battery_percent}
													aria-label={`${device.name} battery level`}
												>
													<div
														className="hardware-meter-fill"
														style={{ 
															width: `${device.battery_percent}%`,
															backgroundColor: device.battery_percent < 20 ? '#ef4444' : 
																device.battery_percent < 50 ? '#f59e0b' : '#10b981'
														}}
													/>
												</div>
												<span className="metric-value">{device.battery_percent.toFixed(1)}%</span>
											</div>
											<div className="hardware-metric">
												<span className="metric-label">Signal</span>
												<span className="metric-value">{formatSignalStrength(device.signal_strength_dbm)}</span>
											</div>
										</div>
										<dl className="hardware-meta">
											<div>
												<dt>Last sync</dt>
												<dd>{lastPingTime}</dd>
											</div>
											<div>
												<dt>Firmware</dt>
												<dd>{device.firmware_version}</dd>
											</div>
											<div>
												<dt>Placement</dt>
												<dd>{device.location}</dd>
											</div>
											<div>
												<dt>Packet Loss</dt>
												<dd>{device.packet_loss_percent.toFixed(1)}%</dd>
											</div>
											<div>
												<dt>Latency</dt>
												<dd>{device.latency_ms}ms</dd>
											</div>
											<div>
												<dt>Uptime</dt>
												<dd>{formatUptime(device.uptime_seconds)}</dd>
											</div>
										</dl>
									</article>
								);
							})}
						</div>
					)}

					{gateway && (
						<section className="hardware-network-card">
							<h3>Gateway Health</h3>
							<ul>
								<li>
									<span>Backhaul</span>
									<strong>{gateway.connection_type} | {gateway.packet_loss_percent.toFixed(1)}% packet loss</strong>
								</li>
								<li>
									<span>Latency</span>
									<strong>{gateway.latency_median_ms} ms median | jitter {gateway.jitter_ms} ms</strong>
								</li>
								<li>
									<span>Uptime</span>
									<strong>{formatUptime(gateway.uptime_seconds)}</strong>
								</li>
								<li>
									<span>Last reboot</span>
									<strong>{new Date(gateway.last_reboot).toLocaleString()}</strong>
								</li>
							</ul>
						</section>
					)}
				</div>

				<aside className="hardware-cli">
					<button
						className="hardware-add-device"
						onClick={handleAddDevice}
						disabled={scanState === "scanning"}
					>
						{scanState === "scanning" ? "Scanning..." : "Add New Device"}
					</button>
					<div className="hardware-cli-header">
						<span>Live Data Feed</span>
						<span className="hardware-cli-indicator">
							<span className="hardware-cli-dot" style={{ 
								backgroundColor: isConnected ? '#10b981' : '#ef4444',
								animation: isConnected ? 'pulse 2s infinite' : 'none'
							}} /> 
							{isConnected ? 'Connected' : 'Disconnected'}
						</span>
					</div>
					<div
						className="hardware-cli-log"
						aria-live="polite"
						aria-atomic="false"
						style={{
							fontFamily: 'monospace',
							fontSize: '13px',
							padding: '12px',
							maxHeight: '400px',
							overflowY: 'auto',
							backgroundColor: 'rgba(0, 0, 0, 0.3)',
							borderRadius: '8px'
						}}
					>
						{latestData ? (
							<>
								<div style={{ color: '#10b981', marginBottom: '8px' }}>
									✓ Device: {latestData.device_id || 'Unknown'}
								</div>
								<div style={{ color: '#3b82f6', marginBottom: '8px' }}>
									🕒 Time: {new Date(latestData.timestamp).toLocaleTimeString()}
								</div>
								<div style={{ color: latestData.tremor.tremor_detected ? '#f59e0b' : '#6b7280' }}>
									📊 Tremor: {latestData.tremor.frequency_hz.toFixed(1)} Hz @ {latestData.tremor.amplitude_g.toFixed(2)}g
									{latestData.tremor.tremor_detected && ' ⚠ DETECTED'}
								</div>
								<div style={{ color: latestData.rigidity.rigid ? '#ef4444' : '#6b7280' }}>
									💪 Rigidity: Wrist {latestData.rigidity.emg_wrist.toFixed(1)} | Arm {latestData.rigidity.emg_arm.toFixed(1)}
									{latestData.rigidity.rigid && ' ⚠ RIGID'}
								</div>
								<div style={{ color: latestData.safety.fall_detected ? '#ef4444' : '#6b7280' }}>
									🛡️ Safety: Accel [{latestData.safety.accel_x_g.toFixed(2)}, {latestData.safety.accel_y_g.toFixed(2)}, {latestData.safety.accel_z_g.toFixed(2)}]g
									{latestData.safety.fall_detected && ' 🚨 FALL DETECTED'}
								</div>
								{latestData.scores && (
									<div style={{ color: '#8b5cf6', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
										<div>🎯 AI Scores:</div>
										<div style={{ paddingLeft: '16px', fontSize: '12px' }}>
											<div>Tremor: {(latestData.scores.tremor * 100).toFixed(1)}%</div>
											<div>Rigidity: {(latestData.scores.rigidity * 100).toFixed(1)}%</div>
											<div>Gait: {(latestData.scores.gait * 100).toFixed(1)}%</div>
										</div>
									</div>
								)}
							</>
						) : (
							<div style={{ color: '#6b7280' }}>Waiting for data...</div>
						)}
					</div>
					<footer className="hardware-cli-footer">
						<span>Real-time sensor data stream from backend</span>
					</footer>
				</aside>
			</div>

			{scanState !== "idle" && (
				<div
					className={`hardware-toast toast-${scanState}`}
					role="status"
					aria-live="assertive"
				>
					{scanMessage}
				</div>
			)}
		</section>
	);
}
