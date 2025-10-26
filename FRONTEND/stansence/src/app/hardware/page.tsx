"use client";

import { useEffect, useRef, useState } from "react";

type DeviceStatus = {
	id: string;
	name: string;
	status: "operational" | "standby" | "alert";
	statusLabel: string;
	battery: number;
	signal: string;
	lastSync: string;
	firmware: string;
	location: string;
	notes: string;
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
	// Red (warning) conditions:
	// 1. Status is "alert" (malfunctioning)
	// 2. Battery is low (< 20%)
	// 3. Signal indicates not connected or very weak
	
	if (device.status === "alert") return "warning";
	if (device.battery < 20) return "warning";
	if (device.signal.toLowerCase().includes("disconnected") || 
	    device.signal.toLowerCase().includes("no signal") ||
	    device.signal.toLowerCase().includes("weak")) return "warning";
	
	return "healthy";
};

const devices: DeviceStatus[] = [
	{
		id: "wrist-unit",
		name: "Wrist Unit",
		status: "operational",
		statusLabel: "Operational",
		battery: 82,
		signal: "-58 dBm (Strong)",
		lastSync: "12:45:18",
		firmware: "v1.9.4",
		location: "Left wrist",
		notes: "Stable accelerometer feed and vibration cue response.",
	},
	{
		id: "arm-patch",
		name: "Arm Patch",
		status: "standby",
		statusLabel: "Standby",
		battery: 15,
		signal: "-67 dBm (Moderate)",
		lastSync: "12:44:02",
		firmware: "v1.4.1",
		location: "Right forearm",
		notes: "Awaiting calibration pulse to resume scheduled sensing.",
	},
];

const logStream: LogEntry[] = [
	{
		timestamp: "12:44:51",
		device: "Wrist Unit",
		message: "PING seq=214 latency 42ms",
		status: "info",
	},
	{
		timestamp: "12:44:54",
		device: "Arm Patch",
		message: "SYNC attempt acknowledged",
		status: "success",
	},
	{
		timestamp: "12:44:58",
		device: "Gateway",
		message: "WebSocket heartbeat received (id=5d4f)",
		status: "info",
	},
	{
		timestamp: "12:45:04",
		device: "Wrist Unit",
		message: "Retransmit request resolved; 0 packets queued",
		status: "success",
	},
	{
		timestamp: "12:45:08",
		device: "Arm Patch",
		message: "CRC mismatch detected; requesting resend",
		status: "warning",
	},
	{
		timestamp: "12:45:12",
		device: "Wrist Unit",
		message: "Battery report 82% / 3.92V",
		status: "info",
	},
	{
		timestamp: "12:45:16",
		device: "Gateway",
		message: "QoS channel stabilized at 1.8Mbps",
		status: "success",
	},
	{
		timestamp: "12:45:20",
		device: "Arm Patch",
		message: "Temperature reading 36.6C within normal range",
		status: "success",
	},
	{
		timestamp: "12:45:24",
		device: "Wrist Unit",
		message: "IMU drift exceeds threshold; scheduling recalibration",
		status: "warning",
	},
	{
		timestamp: "12:45:28",
		device: "Gateway",
		message: "Packet loss spike >5% detected",
		status: "error",
	},
];

const INITIAL_LOG_COUNT = 8;
const MAX_LOG_ITEMS = 16;
const LOG_INTERVAL_MS = 3200;
const CLEAR_NOTIFICATION_DELAY = 2400;

export default function Hardware() {
	const [visibleLogs, setVisibleLogs] = useState<ExtendedLogEntry[]>(() =>
		logStream.slice(0, INITIAL_LOG_COUNT).map((entry, index) => ({
			...entry,
			id: `initial-${index}`,
		}))
	);
	const [scanState, setScanState] = useState<"idle" | "scanning" | "complete">("idle");
	const [scanMessage, setScanMessage] = useState<string>("");
	const logCursor = useRef<number>(Math.min(INITIAL_LOG_COUNT, logStream.length));
	const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Simulate live log feed cycling through mock entries.
		if (logStream.length === 0) {
			return;
		}

		const interval = setInterval(() => {
			setVisibleLogs((prev) => {
				const cursor = logCursor.current % logStream.length;
				const entry = logStream[cursor];
				logCursor.current += 1;

				const enriched: ExtendedLogEntry = {
					...entry,
					id: `log-${logCursor.current}-${Date.now()}`,
				};

				const next = [...prev, enriched];
				return next.length > MAX_LOG_ITEMS ? next.slice(next.length - MAX_LOG_ITEMS) : next;
			});
		}, LOG_INTERVAL_MS);

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
					<div className="hardware-device-grid">
						{devices.map((device) => {
							const healthStatus = getDeviceHealthStatus(device);
							return (
							<article key={device.id} className={`hardware-device-card device-${healthStatus}`}>
								<header className="hardware-device-header">
									<h2>{device.name}</h2>
									<span className={`hardware-status-chip status-${device.status}`}>
										{device.statusLabel}
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
											aria-valuenow={device.battery}
											aria-label={`${device.name} battery level`}
										>
											<div
												className="hardware-meter-fill"
												style={{ width: `${device.battery}%` }}
											/>
										</div>
										<span className="metric-value">{device.battery}%</span>
									</div>
									<div className="hardware-metric">
										<span className="metric-label">Signal</span>
										<span className="metric-value">{device.signal}</span>
									</div>
								</div>
								<dl className="hardware-meta">
									<div>
										<dt>Last sync</dt>
										<dd>{device.lastSync}</dd>
									</div>
									<div>
										<dt>Firmware</dt>
										<dd>{device.firmware}</dd>
									</div>
									<div>
										<dt>Placement</dt>
										<dd>{device.location}</dd>
									</div>
								</dl>
								<p className="hardware-notes">{device.notes}</p>
							</article>
							);
						})}
					</div>

					<section className="hardware-network-card">
						<h3>Gateway Health</h3>
						<ul>
											<li>
												<span>Backhaul</span>
												<strong>Ethernet | 0.3% packet loss</strong>
											</li>
											<li>
												<span>Latency</span>
												<strong>37 ms median | jitter 4 ms</strong>
											</li>
											<li>
												<span>Uptime</span>
												<strong>26h 18m</strong>
											</li>
											<li>
												<span>Last reboot</span>
												<strong>Oct 24 | 10:22</strong>
											</li>
						</ul>
					</section>
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
						<span>Response Log</span>
						<span className="hardware-cli-indicator">
							<span className="hardware-cli-dot" /> Live feed
						</span>
					</div>
					<div
						className="hardware-cli-log"
						aria-live="polite"
						aria-atomic="false"
					>
						{visibleLogs.map((log) => (
							<div
								key={log.id}
								className={`cli-entry status-${log.status}`}
							>
								<span className="cli-timestamp">[{log.timestamp}]</span>
								<span className="cli-device">{log.device}:</span>
								<span className="cli-message">{log.message}</span>
							</div>
						))}
					</div>
					<footer className="hardware-cli-footer">
						<span>Mock data stream rotates through latest telemetry.</span>
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
