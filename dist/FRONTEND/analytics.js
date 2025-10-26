/**
 * Analytics Module - Symptom Breakdown & Rehab Games
 * Handles symptom score display, sparklines, demo mode, and game integration
 */
class AnalyticsManager {
    constructor() {
        this.demoMode = false;
        this.websocket = null;
        this.symptomData = null;
        this.updateInterval = null;
        this.gameTimer = null;
        this.gameStartTime = 0;
        this.currentSessionId = null;
        this.initializeUI();
        this.attachEventListeners();
    }
    /**
     * Initialize the analytics UI and start demo mode by default
     */
    initializeUI() {
        // Enable demo mode by default for testing
        const demoToggle = document.getElementById('demo-mode-toggle');
        if (demoToggle) {
            demoToggle.checked = true;
            this.demoMode = true;
            this.startDemoMode();
        }
    }
    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Demo mode toggle
        const demoToggle = document.getElementById('demo-mode-toggle');
        if (demoToggle) {
            demoToggle.addEventListener('change', (e) => {
                this.demoMode = e.target.checked;
                if (this.demoMode) {
                    this.startDemoMode();
                }
                else {
                    this.stopDemoMode();
                    this.connectToSensors();
                }
            });
        }
        // Game buttons
        const gameButtons = document.querySelectorAll('.btn-suggest-game');
        gameButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const gameId = target.dataset.game || '';
                const symptom = target.dataset.symptom || '';
                this.launchGame(gameId, symptom);
            });
        });
        // Close game modal
        const closeBtn = document.getElementById('close-game');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeGame());
        }
        const stopBtn = document.getElementById('stop-game');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.closeGame());
        }
        // Close modal on overlay click
        const modal = document.getElementById('game-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('game-modal-overlay')) {
                    this.closeGame();
                }
            });
        }
    }
    /**
     * Start demo mode with simulated data
     */
    startDemoMode() {
        console.log('[Analytics] Starting demo mode...');
        this.updateSensorStatus('demo', '● Demo Mode Active');
        // Generate initial demo data
        this.generateDemoData();
        // Update demo data every 3 seconds
        this.updateInterval = window.setInterval(() => {
            this.generateDemoData();
        }, 3000);
    }
    /**
     * Stop demo mode
     */
    stopDemoMode() {
        console.log('[Analytics] Stopping demo mode...');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.updateSensorStatus('disconnected', '● Disconnected');
    }
    /**
     * Generate simulated symptom data
     */
    generateDemoData() {
        // Generate realistic fluctuating scores
        const baseScores = {
            tremor: 42,
            rigidity: 28,
            slowness: 55,
            gait: 33
        };
        const newScores = {
            tremor: Math.max(0, Math.min(100, baseScores.tremor + (Math.random() - 0.5) * 10)),
            rigidity: Math.max(0, Math.min(100, baseScores.rigidity + (Math.random() - 0.5) * 8)),
            slowness: Math.max(0, Math.min(100, baseScores.slowness + (Math.random() - 0.5) * 12)),
            gait: Math.max(0, Math.min(100, baseScores.gait + (Math.random() - 0.5) * 10))
        };
        // Generate history if not exists
        if (!this.symptomData) {
            this.symptomData = {
                updatedAt: new Date().toISOString(),
                scores: newScores,
                history: {
                    tremor: this.generateHistorySeries(baseScores.tremor, 12),
                    rigidity: this.generateHistorySeries(baseScores.rigidity, 12),
                    slowness: this.generateHistorySeries(baseScores.slowness, 12),
                    gait: this.generateHistorySeries(baseScores.gait, 12)
                }
            };
        }
        else {
            // Update scores and shift history
            this.symptomData.scores = newScores;
            this.symptomData.updatedAt = new Date().toISOString();
            // Add new value and remove oldest
            Object.keys(this.symptomData.history).forEach((key) => {
                const symptomKey = key;
                this.symptomData.history[symptomKey].push(newScores[symptomKey]);
                if (this.symptomData.history[symptomKey].length > 12) {
                    this.symptomData.history[symptomKey].shift();
                }
            });
        }
        this.updateUI();
    }
    /**
     * Generate a history series with realistic variation
     */
    generateHistorySeries(baseValue, length) {
        const series = [];
        let current = baseValue;
        for (let i = 0; i < length; i++) {
            current = Math.max(0, Math.min(100, current + (Math.random() - 0.5) * 8));
            series.push(Math.round(current));
        }
        return series;
    }
    /**
     * Connect to real sensor WebSocket
     */
    async connectToSensors() {
        console.log('[Analytics] Connecting to sensors...');
        this.updateSensorStatus('connecting', '● Connecting...');
        try {
            // Note: Replace with actual WebSocket URL when backend is ready
            // this.websocket = new WebSocket('ws://localhost:3000/ws/sensors?userId=user-123');
            // For now, show error and suggest demo mode
            setTimeout(() => {
                console.error('[Analytics] WebSocket not configured yet. Use demo mode.');
                this.updateSensorStatus('disconnected', '● Connection failed - Use Demo Mode');
            }, 1000);
        }
        catch (error) {
            console.error('[Analytics] Failed to connect to sensors:', error);
            this.updateSensorStatus('disconnected', '● Connection failed');
        }
    }
    /**
     * Update sensor connection status indicator
     */
    updateSensorStatus(status, text) {
        const statusEl = document.getElementById('sensor-status');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = status;
        }
    }
    /**
     * Update all UI elements with current symptom data
     */
    updateUI() {
        if (!this.symptomData)
            return;
        const { scores, history } = this.symptomData;
        // Update each symptom card
        Object.keys(scores).forEach((symptom) => {
            const symptomKey = symptom;
            const score = Math.round(scores[symptomKey]);
            const historyData = history[symptomKey];
            // Update score display
            const scoreEl = document.querySelector(`[data-score="${symptom}"]`);
            if (scoreEl) {
                scoreEl.textContent = score.toString();
            }
            // Update progress bar
            const barEl = document.querySelector(`[data-bar="${symptom}"]`);
            if (barEl) {
                barEl.style.width = `${score}%`;
            }
            // Update trend indicator
            if (historyData.length >= 2) {
                const trend = historyData[historyData.length - 1] - historyData[historyData.length - 2];
                const trendEl = document.querySelector(`[data-trend="${symptom}"]`);
                if (trendEl) {
                    const trendSymbol = trend > 0 ? '▲' : trend < 0 ? '▼' : '▬';
                    trendEl.textContent = `${trendSymbol} ${Math.abs(Math.round(trend))}`;
                }
            }
            // Draw sparkline
            this.drawSparkline(symptom, historyData);
        });
    }
    /**
     * Draw a mini sparkline chart on canvas
     */
    drawSparkline(symptom, data) {
        const canvas = document.querySelector(`[data-sparkline="${symptom}"]`);
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 4;
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        if (data.length < 2)
            return;
        // Find min/max for scaling
        const min = Math.min(...data, 0);
        const max = Math.max(...data, 100);
        const range = max - min || 1;
        // Calculate points
        const points = data.map((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - ((value - min) / range) * (height - padding * 2);
            return { x, y };
        });
        // Set color based on symptom
        const colors = {
            tremor: '#fbbf24',
            rigidity: '#ef4444',
            slowness: '#3b82f6',
            gait: '#8b5cf6'
        };
        const color = colors[symptom] || '#ffffff';
        // Draw glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        // Draw line with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Draw line
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            }
            else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        // Reset shadow
        ctx.shadowBlur = 0;
        // Draw dots with glow
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        points.forEach((point, index) => {
            // Larger dot for last point
            const radius = index === points.length - 1 ? 4 : 3;
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    /**
     * Launch a rehab game in the modal
     */
    async launchGame(gameId, symptom) {
        console.log(`[Analytics] Launching game: ${gameId} for symptom: ${symptom}`);
        // Show modal
        const modal = document.getElementById('game-modal');
        const gameTitle = document.getElementById('game-title');
        const gameFrame = document.getElementById('game-frame');
        if (!modal || !gameFrame)
            return;
        // Set game title
        const gameTitles = {
            'steady-hand': '🤚 Steady Hand Maze',
            'strength-meter': '💪 Strength Meter',
            'rhythm-tap': '🐢 Rhythm Tap',
            'rhythm-walker': '🚶 Rhythm Walker'
        };
        if (gameTitle) {
            gameTitle.textContent = gameTitles[gameId] || 'Loading Game...';
        }
        // Load game
        gameFrame.src = `games/${gameId}/index.html`;
        // Show modal
        modal.classList.remove('hidden');
        // Start game timer
        this.gameStartTime = Date.now();
        this.startGameTimer();
        // Create game session (mock for now)
        this.currentSessionId = `sess-${Date.now()}`;
        console.log(`[Analytics] Session started: ${this.currentSessionId}`);
        // TODO: POST to /api/games/session when backend is ready
    }
    /**
     * Close the game modal and stop session
     */
    closeGame() {
        const modal = document.getElementById('game-modal');
        const gameFrame = document.getElementById('game-frame');
        if (modal) {
            modal.classList.add('hidden');
        }
        if (gameFrame) {
            gameFrame.src = '';
        }
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        // TODO: POST game results to /api/games/session/:id/result
        console.log(`[Analytics] Game session ended: ${this.currentSessionId}`);
        this.currentSessionId = null;
        // Refresh symptom data after game
        if (this.demoMode) {
            this.generateDemoData();
        }
    }
    /**
     * Start the game timer display
     */
    startGameTimer() {
        const timerEl = document.getElementById('game-timer');
        if (!timerEl)
            return;
        this.gameTimer = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerEl.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            // Auto-stop after 3 minutes (safety)
            if (elapsed >= 180) {
                this.closeGame();
            }
        }, 1000);
    }
}
// Initialize analytics when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AnalyticsManager();
    });
}
else {
    new AnalyticsManager();
}
// Export for potential external use
export { AnalyticsManager };
//# sourceMappingURL=analytics.js.map