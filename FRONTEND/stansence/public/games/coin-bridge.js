/**
 * Coin Integration Bridge for Exercise Games
 * Connects the game reward system with the centralized coin service
 */

class CoinBridge {
    static awardSessionStart() {
        return this.awardCoins(10, 'exercise_session_start', {
            message: 'You started—that\'s what matters.'
        });
    }

    static awardSetComplete(setNumber, gameName) {
        return this.awardCoins(20, 'exercise_set_complete', {
            setNumber,
            gameName,
            message: 'Set complete.'
        });
    }

    static awardSessionComplete(totalSets, gameName, duration) {
        return this.awardCoins(30, 'exercise_session_complete', {
            totalSets,
            gameName,
            duration,
            message: 'Session complete. Well done.'
        });
    }

    static awardSafeMovement() {
        // Occasional bonus for controlled movement
        if (Math.random() < 0.3) {
            return this.awardCoins(15, 'safe_movement', {
                message: 'Controlled movement noticed.'
            });
        }
        return { success: false, coinsAwarded: 0 };
    }

    static awardCoins(amount, source, metadata = {}) {
        try {
            // Get coin data from localStorage
            const stored = localStorage.getItem('stancesense_coins');
            let coinData = stored ? JSON.parse(stored) : {
                totalBalance: 0,
                lifetimeEarned: 0,
                coinsEarnedToday: 0,
                lastDailyReset: new Date().toISOString(),
                transactions: []
            };

            // Check daily reset
            const now = new Date();
            const lastReset = new Date(coinData.lastDailyReset);
            if (now.toDateString() !== lastReset.toDateString()) {
                coinData.coinsEarnedToday = 0;
                coinData.lastDailyReset = now.toISOString();
            }

            // Check daily cap (200 coins)
            const DAILY_CAP = 200;
            if (source.startsWith('exercise_') && coinData.coinsEarnedToday >= DAILY_CAP) {
                this.showNotification('Daily cap reached', 'You\'ve done excellent work today. Time to rest.', 'info');
                return {
                    success: false,
                    coinsAwarded: 0,
                    newBalance: coinData.totalBalance,
                    reason: 'daily_cap_reached'
                };
            }

            // Award coins
            const newBalance = coinData.totalBalance + amount;
            const newDailyTotal = source.startsWith('exercise_') 
                ? coinData.coinsEarnedToday + amount 
                : coinData.coinsEarnedToday;

            // Create transaction
            const transaction = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: now.toISOString(),
                type: 'earn',
                amount,
                source,
                metadata,
                balanceAfter: newBalance
            };

            // Update data
            coinData.totalBalance = newBalance;
            coinData.lifetimeEarned += amount;
            coinData.coinsEarnedToday = newDailyTotal;
            coinData.transactions.unshift(transaction);

            // Keep only last 100 transactions
            if (coinData.transactions.length > 100) {
                coinData.transactions = coinData.transactions.slice(0, 100);
            }

            // Save to localStorage
            localStorage.setItem('stancesense_coins', JSON.stringify(coinData));
            
            // Dispatch event for UI updates
            window.dispatchEvent(new Event('coinsUpdated'));

            // Show notification
            this.showNotification('Coins Earned', `+${amount} coins: ${metadata.message || 'Well done!'}`, 'success');

            return {
                success: true,
                coinsAwarded: amount,
                newBalance,
                message: metadata.message || 'Coins earned.'
            };

        } catch (error) {
            console.error('Error awarding coins:', error);
            return {
                success: false,
                coinsAwarded: 0,
                reason: 'error'
            };
        }
    }

    static showNotification(title, message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `coin-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${type === 'success' ? '🪙' : 'ℹ️'}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;

        // Add styles if not already present
        if (!document.getElementById('coin-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'coin-notification-styles';
            style.textContent = `
                .coin-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(15, 23, 42, 0.95);
                    border: 2px solid rgba(16, 185, 129, 0.5);
                    border-radius: 12px;
                    padding: 16px;
                    min-width: 300px;
                    max-width: 400px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease-out;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }

                .coin-notification.info {
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .notification-icon {
                    font-size: 32px;
                    line-height: 1;
                }

                .notification-text {
                    flex: 1;
                }

                .notification-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #10b981;
                    margin-bottom: 4px;
                }

                .coin-notification.info .notification-title {
                    color: #60a5fa;
                }

                .notification-message {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.4;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    static getBalance() {
        try {
            const stored = localStorage.getItem('stancesense_coins');
            if (stored) {
                const data = JSON.parse(stored);
                return data.totalBalance || 0;
            }
        } catch (error) {
            console.error('Error getting balance:', error);
        }
        return 0;
    }

    static getEarningPotential() {
        try {
            const stored = localStorage.getItem('stancesense_coins');
            let data = stored ? JSON.parse(stored) : { coinsEarnedToday: 0 };

            // Check daily reset
            const now = new Date();
            const lastReset = data.lastDailyReset ? new Date(data.lastDailyReset) : now;
            if (now.toDateString() !== lastReset.toDateString()) {
                data.coinsEarnedToday = 0;
            }

            const DAILY_CAP = 200;
            return {
                earned: data.coinsEarnedToday,
                remaining: Math.max(0, DAILY_CAP - data.coinsEarnedToday),
                cap: DAILY_CAP
            };
        } catch (error) {
            console.error('Error getting earning potential:', error);
            return { earned: 0, remaining: 200, cap: 200 };
        }
    }
}

// Make available globally for game integration
if (typeof window !== 'undefined') {
    window.CoinBridge = CoinBridge;
}

// Also export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoinBridge;
}
