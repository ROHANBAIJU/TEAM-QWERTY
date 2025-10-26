"use strict";
/**
 * Hardware Status Module
 * Patient-friendly hardware monitoring with self-tests, fall-test,
 * placement guidance, caregiver contact, and charge reminders.
 */
class HardwareManager {
    constructor() {
        this.devices = [];
        this.currentDevice = null;
        this.chargeReminder = false;
        this.loadSettings();
        this.initializeEventListeners();
        this.fetchDevices();
    }
    initializeEventListeners() {
        // Caregiver contact buttons
        const btnCall = document.getElementById('btnCallCaregiver');
        const btnMessage = document.getElementById('btnMessageCaregiver');
        btnCall === null || btnCall === void 0 ? void 0 : btnCall.addEventListener('click', () => this.showCaregiverContact('call'));
        btnMessage === null || btnMessage === void 0 ? void 0 : btnMessage.addEventListener('click', () => this.showCaregiverContact('message'));
        // Caregiver contact modal
        const btnCancelContact = document.getElementById('btnCancelContact');
        const btnConfirmContact = document.getElementById('btnConfirmContact');
        const caregiverContactModal = document.getElementById('caregiverContactModal');
        btnCancelContact === null || btnCancelContact === void 0 ? void 0 : btnCancelContact.addEventListener('click', () => this.hideCaregiverContact());
        btnConfirmContact === null || btnConfirmContact === void 0 ? void 0 : btnConfirmContact.addEventListener('click', () => this.confirmCaregiverContact());
        caregiverContactModal === null || caregiverContactModal === void 0 ? void 0 : caregiverContactModal.addEventListener('click', (e) => {
            if (e.target === caregiverContactModal)
                this.hideCaregiverContact();
        });
        // Self-test modal close
        const btnCloseSelfTest = document.getElementById('btnCloseSelfTest');
        const selfTestModal = document.getElementById('selfTestModal');
        btnCloseSelfTest === null || btnCloseSelfTest === void 0 ? void 0 : btnCloseSelfTest.addEventListener('click', () => this.hideSelfTestResults());
        selfTestModal === null || selfTestModal === void 0 ? void 0 : selfTestModal.addEventListener('click', (e) => {
            if (e.target === selfTestModal)
                this.hideSelfTestResults();
        });
        // Fall test modals
        const btnCancelFallTest = document.getElementById('btnCancelFallTest');
        const btnConfirmFallTest = document.getElementById('btnConfirmFallTest');
        const btnCloseFallTestResult = document.getElementById('btnCloseFallTestResult');
        const fallTestModal = document.getElementById('fallTestModal');
        const fallTestResultModal = document.getElementById('fallTestResultModal');
        btnCancelFallTest === null || btnCancelFallTest === void 0 ? void 0 : btnCancelFallTest.addEventListener('click', () => this.hideFallTestConfirm());
        btnConfirmFallTest === null || btnConfirmFallTest === void 0 ? void 0 : btnConfirmFallTest.addEventListener('click', () => this.runFallTest());
        btnCloseFallTestResult === null || btnCloseFallTestResult === void 0 ? void 0 : btnCloseFallTestResult.addEventListener('click', () => this.hideFallTestResult());
        fallTestModal === null || fallTestModal === void 0 ? void 0 : fallTestModal.addEventListener('click', (e) => {
            if (e.target === fallTestModal)
                this.hideFallTestConfirm();
        });
        fallTestResultModal === null || fallTestResultModal === void 0 ? void 0 : fallTestResultModal.addEventListener('click', (e) => {
            if (e.target === fallTestResultModal)
                this.hideFallTestResult();
        });
        // Reconnect modal
        const btnCancelReconnect = document.getElementById('btnCancelReconnect');
        const btnStartReconnect = document.getElementById('btnStartReconnect');
        const btnRetryReconnect = document.getElementById('btnRetryReconnect');
        const reconnectModal = document.getElementById('reconnectModal');
        btnCancelReconnect === null || btnCancelReconnect === void 0 ? void 0 : btnCancelReconnect.addEventListener('click', () => this.hideReconnectModal());
        btnStartReconnect === null || btnStartReconnect === void 0 ? void 0 : btnStartReconnect.addEventListener('click', () => this.startReconnect());
        btnRetryReconnect === null || btnRetryReconnect === void 0 ? void 0 : btnRetryReconnect.addEventListener('click', () => this.startReconnect());
        reconnectModal === null || reconnectModal === void 0 ? void 0 : reconnectModal.addEventListener('click', (e) => {
            if (e.target === reconnectModal)
                this.hideReconnectModal();
        });
    }
    async fetchDevices() {
        // Mock API call - replace with real endpoint
        this.devices = await this.mockGetDevices();
        this.renderDevices();
    }
    async mockGetDevices() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            {
                id: 'wrist-001',
                name: 'Wrist Unit',
                purpose: 'Tremor/Fall Detection',
                status: 'online',
                batteryPercent: 87,
                lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                fit: 'good',
                signal: 4,
                contactQuality: 'good',
                firmware: { version: '1.2.0', updateAvailable: false }
            },
            {
                id: 'arm-001',
                name: 'Arm Patch',
                purpose: 'Rigidity Monitoring',
                status: 'online',
                batteryPercent: 92,
                lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
                fit: 'good',
                signal: 5,
                contactQuality: 'good',
                firmware: { version: '1.2.0', updateAvailable: false }
            }
        ];
    }
    renderDevices() {
        const container = document.getElementById('devicesList');
        if (!container)
            return;
        if (this.devices.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.5);padding:40px;">No devices found.</p>';
            return;
        }
        container.innerHTML = this.devices.map(device => this.renderDeviceCard(device)).join('');
        // Attach event listeners to dynamically created buttons
        this.devices.forEach(device => {
            var _a, _b, _c, _d;
            (_a = document.getElementById(`btn-check-${device.id}`)) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.runSelfTest(device));
            (_b = document.getElementById(`btn-falltest-${device.id}`)) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => this.showFallTestConfirm(device));
            (_c = document.getElementById(`btn-reconnect-${device.id}`)) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => this.showReconnectModal(device));
            (_d = document.getElementById(`btn-sync-${device.id}`)) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => this.syncDevice(device));
            // Charge reminder toggle
            const reminderToggle = document.getElementById(`reminder-${device.id}`);
            reminderToggle === null || reminderToggle === void 0 ? void 0 : reminderToggle.addEventListener('click', () => this.toggleChargeReminder(device));
        });
    }
    renderDeviceCard(device) {
        const timeSinceSync = this.getTimeSinceSync(device.lastSync);
        const batteryIcon = device.batteryPercent > 80 ? '🔋' : device.batteryPercent > 20 ? '🔋' : '🪫';
        const batteryClass = device.batteryPercent <= 20 ? 'low' : '';
        const batteryWarning = device.batteryPercent <= 20 ? `<div class="battery-warning">Low — Charge now</div>` : '';
        const fitIcon = device.fit === 'good' ? '✅' : device.fit === 'loose' ? '⚠️' : '❌';
        const fitTextClass = device.fit;
        const fitText = device.fit === 'good' ? 'Good fit' : device.fit === 'loose' ? 'Band too loose' : 'Band too high';
        const fitGuidance = device.fit !== 'good' ? this.getFitGuidance(device.fit) : '';
        const deviceIcon = device.name.includes('Wrist') ? '📱' : '📍';
        // Show reconnect button if offline/delayed
        const reconnectBtn = (device.status === 'offline' || device.status === 'delayed')
            ? `<button class="btn-device-action warning" id="btn-reconnect-${device.id}" aria-label="Reconnect ${device.name}">
                <span class="action-icon">🔄</span>
                <span>Reconnect</span>
            </button>`
            : '';
        return `
            <div class="device-card" role="region" aria-label="${device.name} status ${device.status}">
                <div class="device-header">
                    <div class="device-main-info">
                        <div class="device-icon">${deviceIcon}</div>
                        <div class="device-title-group">
                            <div class="device-name">${device.name}</div>
                            <div class="device-purpose">${device.purpose}</div>
                        </div>
                    </div>
                    <div class="device-status-group">
                        <div class="device-status-badge ${device.status}">${device.status.toUpperCase()}</div>
                        <div class="device-battery">
                            <span class="battery-icon">${batteryIcon}</span>
                            <span class="battery-percent ${batteryClass}">${device.batteryPercent}%</span>
                        </div>
                        ${batteryWarning}
                    </div>
                </div>

                <div class="device-meta">
                    <div class="device-meta-item">
                        <span class="device-meta-label">Last reading:</span>
                        <span class="device-meta-value">${timeSinceSync}</span>
                    </div>
                    <div class="device-meta-item">
                        <span class="device-meta-label">Signal:</span>
                        <span class="device-meta-value">${'▮'.repeat(device.signal)}${'▯'.repeat(5 - device.signal)}</span>
                    </div>
                    <div class="device-meta-item">
                        <span class="device-meta-label">Contact:</span>
                        <span class="device-meta-value">${device.contactQuality === 'good' ? 'Good' : 'Weak'}</span>
                    </div>
                </div>

                <div class="device-fit">
                    <div class="fit-indicator">
                        <span class="fit-icon">${fitIcon}</span>
                        <span class="fit-text ${fitTextClass}">${fitText}</span>
                    </div>
                    ${fitGuidance ? `<div class="fit-guidance">${fitGuidance}</div>` : ''}
                </div>

                <div class="device-actions">
                    <button class="btn-device-action primary" id="btn-check-${device.id}" aria-label="Run quick device check">
                        <span class="action-icon">✓</span>
                        <span>Run quick check</span>
                    </button>
                    <button class="btn-device-action warning" id="btn-falltest-${device.id}" aria-label="Test fall alert (does not notify anyone)">
                        <span class="action-icon">⚠️</span>
                        <span>Test fall alert (safe)</span>
                    </button>
                    <button class="btn-device-action secondary" id="btn-sync-${device.id}" aria-label="Sync device now">
                        <span class="action-icon">🔄</span>
                        <span>Sync now</span>
                    </button>
                    ${reconnectBtn}
                </div>

                <div class="charge-reminder">
                    <span class="reminder-label">Remind me to charge at 20%</span>
                    <div class="reminder-toggle ${this.chargeReminder ? 'active' : ''}" id="reminder-${device.id}" role="switch" aria-checked="${this.chargeReminder}" tabindex="0">
                        <div class="reminder-toggle-slider"></div>
                    </div>
                </div>
            </div>
        `;
    }
    getFitGuidance(fit) {
        if (fit === 'loose') {
            return 'Tighten band by one finger-width for better readings.';
        }
        return 'Move band down one finger-width for proper placement.';
    }
    getTimeSinceSync(timestamp) {
        const now = Date.now();
        const syncTime = new Date(timestamp).getTime();
        const diffMs = now - syncTime;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins === 1)
            return '1 min ago';
        if (diffMins < 60)
            return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1)
            return '1 hour ago';
        return `${diffHours} hours ago`;
    }
    async runSelfTest(device) {
        this.currentDevice = device;
        // Show loading state
        const btn = document.getElementById(`btn-check-${device.id}`);
        if (btn) {
            btn.textContent = 'Checking...';
            btn.disabled = true;
        }
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await this.mockSelfTest(device);
        // Restore button
        if (btn) {
            btn.innerHTML = '<span class="action-icon">✓</span><span>Run quick check</span>';
            btn.disabled = false;
        }
        this.showSelfTestResults(result);
    }
    async mockSelfTest(device) {
        // Simulate random test results
        const rand = Math.random();
        if (rand > 0.7) {
            // All pass
            return {
                result: 'ok',
                details: [
                    { check: 'Accelerometer', status: 'ok' },
                    { check: 'Sensor contact', status: 'ok' },
                    { check: 'Battery health', status: 'ok' }
                ]
            };
        }
        else if (rand > 0.4) {
            // Weak contact
            return {
                result: 'warn',
                details: [
                    { check: 'Accelerometer', status: 'ok' },
                    { check: 'Sensor contact', status: 'weak' },
                    { check: 'Battery health', status: 'ok' }
                ],
                suggestion: 'Tighten band slightly for better sensor contact.'
            };
        }
        else {
            // Multiple issues
            return {
                result: 'fail',
                details: [
                    { check: 'Accelerometer', status: 'ok' },
                    { check: 'Sensor contact', status: 'fail' },
                    { check: 'Battery health', status: 'weak' }
                ],
                suggestion: 'Clean sensor and tighten band. Charge device when possible.'
            };
        }
    }
    showSelfTestResults(result) {
        const resultsDiv = document.getElementById('selfTestResults');
        if (!resultsDiv)
            return;
        let html = result.details.map(item => `
            <div class="test-item">
                <span class="test-label">${item.check}</span>
                <span class="test-status ${item.status}">${item.status === 'ok' ? '✓ OK' : item.status === 'weak' ? '⚠ Weak' : '✗ Needs attention'}</span>
            </div>
        `).join('');
        if (result.suggestion) {
            html += `<div class="test-suggestion">💡 ${result.suggestion}</div>`;
        }
        resultsDiv.innerHTML = html;
        const modal = document.getElementById('selfTestModal');
        if (modal)
            modal.style.display = 'flex';
        // Announce to screen readers
        this.announce(`Self-test complete. Result: ${result.result === 'ok' ? 'All checks passed' : 'Some items need attention'}`);
    }
    hideSelfTestResults() {
        const modal = document.getElementById('selfTestModal');
        if (modal)
            modal.style.display = 'none';
    }
    showFallTestConfirm(device) {
        this.currentDevice = device;
        const modal = document.getElementById('fallTestModal');
        if (modal)
            modal.style.display = 'flex';
    }
    hideFallTestConfirm() {
        const modal = document.getElementById('fallTestModal');
        if (modal)
            modal.style.display = 'none';
    }
    async runFallTest() {
        this.hideFallTestConfirm();
        // Show loading toast
        this.showToast('Running fall test...', 'info');
        // Simulate test
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = {
            success: true,
            message: 'Fall detection is working correctly.',
            details: 'Simulated fall detected at correct sensitivity. Last 60s sensor data would be attached to alert.'
        };
        this.showFallTestResult(result);
    }
    showFallTestResult(result) {
        const resultsDiv = document.getElementById('fallTestResult');
        if (!resultsDiv)
            return;
        resultsDiv.innerHTML = `
            <div class="test-item">
                <span class="test-label">Test result</span>
                <span class="test-status ok">✓ ${result.message}</span>
            </div>
            <div class="test-suggestion">${result.details}</div>
        `;
        const modal = document.getElementById('fallTestResultModal');
        if (modal)
            modal.style.display = 'flex';
        this.announce('Fall test complete. Detection is working correctly.');
    }
    hideFallTestResult() {
        const modal = document.getElementById('fallTestResultModal');
        if (modal)
            modal.style.display = 'none';
    }
    showReconnectModal(device) {
        this.currentDevice = device;
        // Reset steps
        for (let i = 1; i <= 3; i++) {
            const statusEl = document.getElementById(`stepStatus${i}`);
            if (statusEl) {
                statusEl.textContent = '⏳ Waiting...';
                statusEl.className = 'step-status waiting';
            }
        }
        // Show start button, hide retry
        const btnStart = document.getElementById('btnStartReconnect');
        const btnRetry = document.getElementById('btnRetryReconnect');
        if (btnStart)
            btnStart.style.display = 'block';
        if (btnRetry)
            btnRetry.style.display = 'none';
        const modal = document.getElementById('reconnectModal');
        if (modal)
            modal.style.display = 'flex';
    }
    hideReconnectModal() {
        const modal = document.getElementById('reconnectModal');
        if (modal)
            modal.style.display = 'none';
    }
    async startReconnect() {
        const btnStart = document.getElementById('btnStartReconnect');
        const btnCancel = document.getElementById('btnCancelReconnect');
        const btnRetry = document.getElementById('btnRetryReconnect');
        if (btnStart)
            btnStart.style.display = 'none';
        if (btnRetry)
            btnRetry.style.display = 'none';
        if (btnCancel)
            btnCancel.disabled = true;
        // Step 1
        await this.updateReconnectStep(1, 'checking');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.updateReconnectStep(1, 'success');
        // Step 2
        await this.updateReconnectStep(2, 'checking');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.updateReconnectStep(2, 'success');
        // Step 3 - random success/fail
        await this.updateReconnectStep(3, 'checking');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const success = Math.random() > 0.3;
        await this.updateReconnectStep(3, success ? 'success' : 'error');
        if (btnCancel)
            btnCancel.disabled = false;
        if (success) {
            this.showToast('Device reconnected successfully!', 'success');
            setTimeout(() => this.hideReconnectModal(), 1500);
            // Update device status
            if (this.currentDevice) {
                this.currentDevice.status = 'online';
                this.renderDevices();
            }
        }
        else {
            if (btnRetry)
                btnRetry.style.display = 'block';
            this.showToast('Reconnection failed. Try moving closer to device.', 'error');
        }
    }
    async updateReconnectStep(step, status) {
        const statusEl = document.getElementById(`stepStatus${step}`);
        if (!statusEl)
            return;
        const statusText = {
            waiting: '⏳ Waiting...',
            checking: '🔄 Checking...',
            success: '✓ Done',
            error: '✗ Failed'
        };
        statusEl.textContent = statusText[status];
        statusEl.className = `step-status ${status}`;
    }
    async syncDevice(device) {
        const btn = document.getElementById(`btn-sync-${device.id}`);
        if (btn) {
            btn.textContent = 'Syncing...';
            btn.disabled = true;
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Update last sync time
        device.lastSync = new Date().toISOString();
        this.renderDevices();
        if (btn) {
            btn.disabled = false;
        }
        this.showToast('Device synced successfully!', 'success');
    }
    showCaregiverContact(type) {
        const titleEl = document.getElementById('caregiverActionTitle');
        if (titleEl) {
            titleEl.textContent = type === 'call' ? 'Call Caregiver?' : 'Send Message to Caregiver?';
        }
        // Store type for confirmation
        window.caregiverContactType = type;
        const modal = document.getElementById('caregiverContactModal');
        if (modal)
            modal.style.display = 'flex';
    }
    hideCaregiverContact() {
        const modal = document.getElementById('caregiverContactModal');
        if (modal)
            modal.style.display = 'none';
    }
    confirmCaregiverContact() {
        const type = window.caregiverContactType;
        this.hideCaregiverContact();
        if (type === 'call') {
            this.showToast('Calling caregiver... (Demo mode - no actual call placed)', 'info');
            console.log('Would call: +1 (555) 123-4567');
        }
        else {
            this.showToast('Opening message app... (Demo mode)', 'info');
            console.log('Would message: +1 (555) 123-4567');
        }
    }
    toggleChargeReminder(device) {
        this.chargeReminder = !this.chargeReminder;
        this.saveSettings();
        const toggle = document.getElementById(`reminder-${device.id}`);
        if (toggle) {
            if (this.chargeReminder) {
                toggle.classList.add('active');
                toggle.setAttribute('aria-checked', 'true');
            }
            else {
                toggle.classList.remove('active');
                toggle.setAttribute('aria-checked', 'false');
            }
        }
        this.showToast(this.chargeReminder
            ? 'Charge reminders enabled'
            : 'Charge reminders disabled', 'info');
    }
    loadSettings() {
        try {
            const stored = localStorage.getItem('hardwareSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                this.chargeReminder = settings.chargeReminder || false;
            }
        }
        catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    saveSettings() {
        try {
            const settings = {
                chargeReminder: this.chargeReminder
            };
            localStorage.setItem('hardwareSettings', JSON.stringify(settings));
        }
        catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    showToast(message, type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    announce(message) {
        // Announce to screen readers
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        liveRegion.textContent = message;
        document.body.appendChild(liveRegion);
        setTimeout(() => liveRegion.remove(), 1000);
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HardwareManager();
    });
}
else {
    new HardwareManager();
}
//# sourceMappingURL=hardware.js.map