/**
 * Analytics Module - Symptom Breakdown & Rehab Games
 * Handles symptom score display, sparklines, demo mode, and game integration
 */
declare class AnalyticsManager {
    private demoMode;
    private websocket;
    private symptomData;
    private updateInterval;
    private gameTimer;
    private gameStartTime;
    private currentSessionId;
    constructor();
    /**
     * Initialize the analytics UI and start demo mode by default
     */
    private initializeUI;
    /**
     * Attach event listeners to UI elements
     */
    private attachEventListeners;
    /**
     * Start demo mode with simulated data
     */
    private startDemoMode;
    /**
     * Stop demo mode
     */
    private stopDemoMode;
    /**
     * Generate simulated symptom data
     */
    private generateDemoData;
    /**
     * Generate a history series with realistic variation
     */
    private generateHistorySeries;
    /**
     * Connect to real sensor WebSocket
     */
    private connectToSensors;
    /**
     * Update sensor connection status indicator
     */
    private updateSensorStatus;
    /**
     * Update all UI elements with current symptom data
     */
    private updateUI;
    /**
     * Draw a mini sparkline chart on canvas
     */
    private drawSparkline;
    /**
     * Launch a rehab game in the modal
     */
    private launchGame;
    /**
     * Close the game modal and stop session
     */
    private closeGame;
    /**
     * Start the game timer display
     */
    private startGameTimer;
}
export { AnalyticsManager };
//# sourceMappingURL=analytics.d.ts.map