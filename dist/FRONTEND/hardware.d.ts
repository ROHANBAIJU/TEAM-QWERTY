/**
 * Hardware Status Module
 * Patient-friendly hardware monitoring with self-tests, fall-test,
 * placement guidance, caregiver contact, and charge reminders.
 */
interface DeviceFirmware {
    version: string;
    updateAvailable: boolean;
}
interface Device {
    id: string;
    name: string;
    purpose: string;
    status: 'online' | 'delayed' | 'offline';
    batteryPercent: number;
    lastSync: string;
    fit: 'good' | 'loose' | 'too_high';
    signal: number;
    contactQuality: 'good' | 'weak';
    firmware: DeviceFirmware;
}
interface SelfTestResult {
    result: 'ok' | 'warn' | 'fail';
    details: {
        check: string;
        status: 'ok' | 'weak' | 'fail';
    }[];
    suggestion?: string;
}
declare class HardwareManager {
    private devices;
    private currentDevice;
    private chargeReminder;
    constructor();
    private initializeEventListeners;
    private fetchDevices;
    private mockGetDevices;
    private renderDevices;
    private renderDeviceCard;
    private getFitGuidance;
    private getTimeSinceSync;
    private runSelfTest;
    private mockSelfTest;
    private showSelfTestResults;
    private hideSelfTestResults;
    private showFallTestConfirm;
    private hideFallTestConfirm;
    private runFallTest;
    private showFallTestResult;
    private hideFallTestResult;
    private showReconnectModal;
    private hideReconnectModal;
    private startReconnect;
    private updateReconnectStep;
    private syncDevice;
    private showCaregiverContact;
    private hideCaregiverContact;
    private confirmCaregiverContact;
    private toggleChargeReminder;
    private loadSettings;
    private saveSettings;
    private showToast;
    private announce;
}
//# sourceMappingURL=hardware.d.ts.map