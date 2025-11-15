/**
 * Clinically Grounded Reward System for Parkinson's Disease
 * 
 * CORE PRINCIPLE: Reinforce effort, consistency, and safe movement patterns,
 * NOT symptom-limited performance. We motivate the PATIENT, not the disease.
 * 
 * NEVER punishes: tremors, slowness, freeze episodes, or symptom fluctuations
 * NEVER compares: against other players or unrealistic precision standards
 * ALWAYS rewards: showing up, completing movements, maintaining consistency
 */

class RewardSystem {
    constructor(gameName) {
        this.gameName = gameName;
        this.session = {
            actions: 0,
            setsCompleted: 0,
            timeSpent: 0,
            startTime: Date.now(),
            badges: [],
            movementPatterns: [], // Track movement quality, not accuracy
            effortLevel: 'moderate' // Adaptive difficulty
        };
        
        // Load persistent data
        this.loadProgress();
        this.assessDailyCapacity();
        this.audio = this.initAudio();
    }

    initAudio() {
        // Gentle, predictable audio feedback
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return {
            context: audioContext,
            // Consistent, calming tones - never jarring
            playAction: () => this.playTone(audioContext, 440, 0.15, 0.12), // Soft A4
            playSet: () => this.playChord(audioContext, [392, 493.88, 587.33], 0.4), // Warm G-B-D
            playMilestone: () => this.playChord(audioContext, [523.25, 659.25, 783.99], 0.6) // Bright C-E-G
        };
    }

    playTone(context, frequency, duration, volume = 0.15) {
        try {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            // Gentle fade in/out
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
            
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + duration);
        } catch (error) {
            console.warn('Audio feedback unavailable:', error);
        }
    }

    playChord(context, frequencies, duration) {
        frequencies.forEach((freq, i) => {
            setTimeout(() => this.playTone(context, freq, duration, 0.1), i * 30);
        });
    }

    assessDailyCapacity() {
        // Recognize that symptom severity fluctuates daily
        // This is NOT about performance - it's about adapting to the patient's current state
        const today = new Date().toDateString();
        const todaysSessions = this.progress.sessions.filter(s => 
            new Date(s.date).toDateString() === today
        );
        
        if (todaysSessions.length > 0) {
            // If they've already played today, maintain gentle difficulty
            const avgEffort = todaysSessions.reduce((sum, s) => sum + (s.effortScore || 50), 0) / todaysSessions.length;
            this.session.effortLevel = avgEffort > 60 ? 'comfortable' : 'gentle';
        } else {
            // New day - start gently
            this.session.effortLevel = 'gentle';
        }
    }

    loadProgress() {
        const saved = localStorage.getItem(`parkinsons_therapy_${this.gameName}`);
        if (saved) {
            this.progress = JSON.parse(saved);
        } else {
            this.progress = {
                totalSessions: 0,
                consecutiveDays: 0,
                lastSessionDate: null,
                sessions: [], // Full session history
                milestones: [],
                unlockedCosmetics: ['default'],
                currentTheme: 'default',
                longestStreak: 0
            };
        }
    }

    saveProgress() {
        localStorage.setItem(`parkinsons_therapy_${this.gameName}`, JSON.stringify(this.progress));
    }

    // ========================================
    // IMMEDIATE FEEDBACK: After Each Action
    // ========================================
    rewardAction(movementType = 'movement', safetyLevel = 'safe') {
        this.session.actions++;
        
        // Track movement pattern (for trend analysis, not judgment)
        this.session.movementPatterns.push({
            type: movementType,
            safety: safetyLevel,
            timestamp: Date.now() - this.session.startTime
        });
        
        // IMMEDIATE sensory feedback
        this.audio.playAction();
        this.showSoftGlow();
        
        // PREDICTABLE points - always positive
        const basePoints = 10;
        const encouragementBonus = Math.random() < 0.3 ? 5 : 0; // Random encouragement
        const totalPoints = basePoints + encouragementBonus;
        
        // Show what the movement accomplished (meaningful feedback)
        const feedback = this.getMovementMeaning(movementType);
        
        return {
            points: totalPoints,
            message: feedback,
            sound: 'action'
        };
    }

    getMovementMeaning(movementType) {
        // Explain why the movement matters (clinical benefit)
        const meanings = {
            'timing': [
                'Building rhythm awareness',
                'Strengthening motor planning',
                'Improving movement initiation'
            ],
            'steadiness': [
                'Practicing motor control',
                'Enhancing stability',
                'Training smooth movements'
            ],
            'effort': [
                'Building muscle memory',
                'Strengthening neural pathways',
                'Increasing endurance'
            ],
            'movement': [
                'Maintaining mobility',
                'Promoting neuroplasticity',
                'Supporting motor function'
            ]
        };
        
        const options = meanings[movementType] || meanings['movement'];
        return options[Math.floor(Math.random() * options.length)];
    }

    showSoftGlow() {
        // Gentle visual feedback - predictable and calming
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: gentleGlowPulse 0.6s ease-out forwards;
        `;
        
        if (!document.getElementById('glow-style')) {
            const style = document.createElement('style');
            style.id = 'glow-style';
            style.textContent = `
                @keyframes gentleGlowPulse {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(glow);
        setTimeout(() => glow.remove(), 600);
    }

    // ========================================
    // SET COMPLETION: Progress Badge System
    // ========================================
    rewardSet(setNumber) {
        this.session.setsCompleted++;
        
        // Play set completion sound
        this.audio.playSet();
        
        // Award EFFORT badge (not accuracy or speed)
        const badge = this.awardEffortBadge(setNumber);
        
        // Unlock cosmetic change
        const cosmetic = this.unlockCosmetic(setNumber);
        
        // Show progress notification (gentle, encouraging)
        this.showSetProgress(setNumber, badge, cosmetic);
        
        return {
            badge,
            cosmetic,
            message: `Set ${setNumber} complete - you showed up and did the work!`
        };
    }

    awardEffortBadge(setNumber) {
        // Badges for CONSISTENCY and EFFORT, never accuracy
        const effortBadges = [
            { id: 'starter', sets: 1, icon: '🌱', name: 'First Step', desc: 'You started - that\'s what counts' },
            { id: 'consistent', sets: 3, icon: '🌿', name: 'Building Routine', desc: 'Three sets of steady effort' },
            { id: 'committed', sets: 5, icon: '🍃', name: 'Committed Practice', desc: 'Five sets - you\'re building strength' },
            { id: 'dedicated', sets: 10, icon: '🌳', name: 'Dedicated Training', desc: 'Ten sets of showing up' },
            { id: 'resilient', sets: 20, icon: '🌲', name: 'Resilience', desc: 'Twenty sets - remarkable consistency' },
            { id: 'champion', sets: 50, icon: '🏔️', name: 'Movement Champion', desc: 'Fifty sets of dedication' }
        ];
        
        const earned = effortBadges.find(b => b.sets === setNumber);
        if (earned && !this.progress.milestones.find(m => m.id === earned.id)) {
            this.progress.milestones.push({
                ...earned,
                date: new Date().toISOString(),
                type: 'effort'
            });
            this.session.badges.push(earned);
            return earned;
        }
        return null;
    }

    unlockCosmetic(setNumber) {
        // Small, meaningful environmental changes
        const cosmetics = [
            { sets: 2, id: 'morning', name: 'Morning Light', desc: 'Warm sunrise tones', color: '#fbbf24' },
            { sets: 5, id: 'forest', name: 'Forest Path', desc: 'Calming green hues', color: '#10b981' },
            { sets: 10, id: 'ocean', name: 'Ocean Breeze', desc: 'Peaceful blues', color: '#3b82f6' },
            { sets: 20, id: 'sunset', name: 'Evening Calm', desc: 'Soothing oranges', color: '#f97316' },
            { sets: 35, id: 'starlight', name: 'Starlit Sky', desc: 'Deep purple serenity', color: '#8b5cf6' }
        ];
        
        const unlocked = cosmetics.find(c => c.sets === setNumber);
        if (unlocked && !this.progress.unlockedCosmetics.includes(unlocked.id)) {
            this.progress.unlockedCosmetics.push(unlocked.id);
            return unlocked;
        }
        return null;
    }

    showSetProgress(setNumber, badge, cosmetic) {
        // Show progress in a calm, affirming way
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
            border: 2px solid rgba(16, 185, 129, 0.5);
            border-radius: 12px;
            padding: 16px 20px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            z-index: 9998;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
            animation: slideInRight 0.5s ease-out;
            max-width: 280px;
        `;
        
        let content = `<div style="display: flex; align-items: center; gap: 12px;">`;
        content += `<div style="font-size: 24px;">✓</div>`;
        content += `<div>`;
        content += `<div style="font-weight: 700; margin-bottom: 4px;">Set ${setNumber} Complete</div>`;
        if (badge) content += `<div style="font-size: 12px; opacity: 0.9;">${badge.icon} ${badge.name}</div>`;
        if (cosmetic) content += `<div style="font-size: 12px; opacity: 0.9;">🎨 ${cosmetic.name} unlocked!</div>`;
        content += `</div></div>`;
        
        notification.innerHTML = content;
        
        if (!document.getElementById('notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // ========================================
    // SESSION END: Trend-Based Summary
    // ========================================
    endSession() {
        const duration = Math.floor((Date.now() - this.session.startTime) / 1000);
        this.session.timeSpent = duration;
        
        // Calculate EFFORT score (not performance)
        // Based on: time spent, actions completed, consistency
        const effortScore = Math.min(100, Math.floor(
            (this.session.actions * 2) + 
            (this.session.setsCompleted * 10) + 
            (Math.min(duration / 60, 10) * 5) // Max 10 minutes counted
        ));
        
        // Update streak (adaptive - recognizes symptom fluctuations)
        this.updateStreak();
        
        // Store session data for trend analysis
        this.progress.sessions.push({
            date: new Date().toISOString(),
            duration,
            actions: this.session.actions,
            sets: this.session.setsCompleted,
            effortScore,
            effortLevel: this.session.effortLevel,
            badges: this.session.badges.map(b => b.id)
        });
        
        // Keep last 30 sessions for trending
        if (this.progress.sessions.length > 30) {
            this.progress.sessions = this.progress.sessions.slice(-30);
        }
        
        this.progress.totalSessions++;
        this.saveProgress();
        
        // Play milestone sound
        this.audio.playMilestone();
        
        return this.generateTrendSummary(effortScore);
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastDate = this.progress.lastSessionDate 
            ? new Date(this.progress.lastSessionDate).toDateString() 
            : null;
        
        if (lastDate === today) {
            // Same day - maintain streak
            return;
        }
        
        if (!lastDate) {
            // First session ever
            this.progress.consecutiveDays = 1;
        } else {
            const daysSince = Math.floor(
                (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSince === 1) {
                // Perfect! Next day
                this.progress.consecutiveDays++;
            } else if (daysSince <= 3) {
                // Adaptive grace period for bad symptom days
                this.progress.consecutiveDays++;
            } else {
                // Gentle restart (not punishment)
                this.progress.consecutiveDays = 1;
            }
        }
        
        // Update longest streak
        if (this.progress.consecutiveDays > this.progress.longestStreak) {
            this.progress.longestStreak = this.progress.consecutiveDays;
        }
        
        this.progress.lastSessionDate = new Date().toISOString();
    }

    generateTrendSummary(effortScore) {
        // Show TRENDS over time, not raw scores
        const recentSessions = this.progress.sessions.slice(-7); // Last week
        const trend = this.calculateTrend(recentSessions);
        const streakBadge = this.getStreakBadge();
        const adaptedDifficulty = this.adaptDifficulty(effortScore);
        
        return {
            duration: this.session.timeSpent,
            actions: this.session.actions,
            sets: this.session.setsCompleted,
            effortScore,
            badges: this.session.badges,
            
            // Trend data (not comparison)
            trend: {
                direction: trend.direction,
                message: trend.message,
                consistency: trend.consistency
            },
            
            // Streak recognition
            streak: {
                current: this.progress.consecutiveDays,
                longest: this.progress.longestStreak,
                badge: streakBadge
            },
            
            // Adaptive difficulty for next session
            nextSession: {
                recommendedDuration: adaptedDifficulty.duration,
                effortLevel: adaptedDifficulty.level,
                message: adaptedDifficulty.message
            },
            
            // Encouragement
            encouragement: this.getEncouragement(effortScore, trend)
        };
    }

    calculateTrend(sessions) {
        if (sessions.length < 2) {
            return {
                direction: 'stable',
                message: 'Building your baseline',
                consistency: 100
            };
        }
        
        // Calculate consistency (showing up matters most)
        const daysActive = new Set(sessions.map(s => new Date(s.date).toDateString())).size;
        const consistency = Math.floor((daysActive / 7) * 100);
        
        // Calculate effort trend (not performance)
        const recent = sessions.slice(-3);
        const older = sessions.slice(-6, -3);
        
        if (older.length === 0) {
            return {
                direction: 'building',
                message: 'Establishing your routine',
                consistency
            };
        }
        
        const recentAvg = recent.reduce((sum, s) => sum + s.effortScore, 0) / recent.length;
        const olderAvg = older.reduce((sum, s) => sum + s.effortScore, 0) / older.length;
        const change = recentAvg - olderAvg;
        
        if (change > 10) {
            return {
                direction: 'improving',
                message: 'Your consistency is strengthening',
                consistency
            };
        } else if (change < -10) {
            return {
                direction: 'adjusting',
                message: 'Your body is adapting - that\'s normal',
                consistency
            };
        } else {
            return {
                direction: 'steady',
                message: 'Maintaining consistent effort',
                consistency
            };
        }
    }

    getStreakBadge() {
        const streakMilestones = [
            { days: 3, icon: '🔥', name: '3-Day Momentum', desc: 'Building a habit' },
            { days: 7, icon: '⚡', name: 'Week Strong', desc: 'One week of showing up' },
            { days: 14, icon: '💪', name: 'Two-Week Warrior', desc: 'Consistent dedication' },
            { days: 30, icon: '🌟', name: 'Monthly Champion', desc: 'A month of commitment' },
            { days: 60, icon: '👑', name: 'Resilience Master', desc: 'Two months strong' },
            { days: 100, icon: '🏆', name: 'Century Club', desc: 'Extraordinary consistency' }
        ];
        
        return streakMilestones
            .reverse()
            .find(m => this.progress.consecutiveDays >= m.days) || null;
    }

    adaptDifficulty(effortScore) {
        // Adapt NEXT session based on today's effort
        // NOT about making it "harder" - about finding the right challenge level
        
        if (effortScore > 80) {
            return {
                duration: '10-15 minutes',
                level: 'comfortable',
                message: 'You have good energy - we can work at a comfortable pace'
            };
        } else if (effortScore > 50) {
            return {
                duration: '8-12 minutes',
                level: 'moderate',
                message: 'A moderate pace will help build consistency'
            };
        } else {
            return {
                duration: '5-8 minutes',
                level: 'gentle',
                message: 'Let\'s keep it gentle and focus on showing up'
            };
        }
    }

    getEncouragement(effortScore, trend) {
        // Personalized encouragement based on trends and effort
        const messages = {
            improving: [
                'Your consistency is paying off',
                'You\'re building momentum beautifully',
                'Each session is strengthening your routine'
            ],
            steady: [
                'Steady effort is building lasting change',
                'Your consistency is exactly what matters',
                'You\'re showing up - that\'s the real victory'
            ],
            adjusting: [
                'Some days are harder - you still showed up',
                'Adapting to changes shows real strength',
                'You\'re listening to your body and staying consistent'
            ],
            building: [
                'Every session is building your foundation',
                'You\'re establishing a powerful habit',
                'Starting is the hardest part - you\'re doing it'
            ]
        };
        
        const options = messages[trend.direction] || messages.steady;
        return options[Math.floor(Math.random() * options.length)];
    }

    // ========================================
    // UI: Session Summary Display
    // ========================================
    showSessionSummary(summary) {
        // Show TREND-BASED summary (not raw scores)
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.4s ease-out;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
            border: 3px solid rgba(16, 185, 129, 0.4);
            border-radius: 20px;
            padding: 36px;
            max-width: 520px;
            width: 90%;
            color: white;
            animation: slideUp 0.5s ease-out;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 28px;">
                <div style="font-size: 56px; margin-bottom: 12px;">${summary.trend.direction === 'improving' ? '📈' : summary.trend.direction === 'steady' ? '🎯' : '🌱'}</div>
                <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #10b981;">Session Complete</h2>
                <p style="font-size: 16px; color: rgba(255,255,255,0.8);">${summary.encouragement}</p>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 12px;">YOUR EFFORT TODAY</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${summary.sets}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Sets Completed</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${Math.floor(summary.duration / 60)}m</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Time Invested</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${summary.actions}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Movements</div>
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 12px;">YOUR PROGRESS TREND</div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="font-size: 32px;">${summary.trend.direction === 'improving' ? '↗️' : summary.trend.direction === 'steady' ? '➡️' : '🔄'}</div>
                    <div>
                        <div style="font-size: 16px; font-weight: 600; color: #a78bfa;">${summary.trend.message}</div>
                        <div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 4px;">Consistency: ${summary.trend.consistency}%</div>
                    </div>
                </div>
            </div>
            
            ${summary.streak.current >= 3 ? `
            <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 40px;">${summary.streak.badge ? summary.streak.badge.icon : '🔥'}</div>
                    <div>
                        <div style="font-size: 16px; font-weight: 600; color: #fbbf24;">${summary.streak.current}-Day Streak!</div>
                        <div style="font-size: 13px; color: rgba(255,255,255,0.6);">You've shown up ${summary.streak.current} days in a row</div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 8px;">NEXT SESSION RECOMMENDATION</div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.6;">
                    ${summary.nextSession.message}<br>
                    <span style="color: #60a5fa; font-weight: 600;">Suggested duration: ${summary.nextSession.recommendedDuration}</span>
                </div>
            </div>
            
            <button id="close-summary" style="
                width: 100%;
                padding: 16px;
                font-size: 16px;
                font-weight: 700;
                color: white;
                background: linear-gradient(135deg, #10b981, #059669);
                border: 2px solid rgba(16, 185, 129, 0.3);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
            ">Continue</button>
        `;
        
        if (!document.getElementById('summary-animation-style')) {
            const style = document.createElement('style');
            style.id = 'summary-animation-style';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        document.getElementById('close-summary').addEventListener('click', () => {
            modal.style.transition = 'opacity 0.3s ease-out';
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });
        
        // Also allow clicking backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.getElementById('close-summary').click();
            }
        });
    }

    showSessionBadges() {
        // Show badges earned during session in a beautiful, comforting way
        if (this.session.badges.length === 0) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            animation: fadeInBackdrop 0.6s ease-out forwards;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
            border: 3px solid rgba(139, 92, 246, 0.4);
            border-radius: 24px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 30px 80px rgba(139, 92, 246, 0.3);
            animation: slideUpFadeIn 0.8s ease-out forwards;
        `;
        
        let badgeHTML = `
            <div style="margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 15px; animation: gentlePulse 2s ease-in-out infinite;">🎖️</div>
                <h2 style="font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 10px;">
                    Milestones Achieved!
                </h2>
                <p style="font-size: 18px; color: rgba(255, 255, 255, 0.75); line-height: 1.6;">
                    You've earned ${this.session.badges.length} milestone${this.session.badges.length > 1 ? 's' : ''} for your effort
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin: 30px 0;">
        `;
        
        this.session.badges.forEach((badge, index) => {
            badgeHTML += `
                <div style="
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
                    border: 2px solid rgba(16, 185, 129, 0.3);
                    border-radius: 16px;
                    padding: 24px;
                    animation: badgeSlideIn ${0.6 + index * 0.2}s ease-out forwards;
                    opacity: 0;
                ">
                    <div style="font-size: 48px; margin-bottom: 12px;">
                        ${badge.icon}
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #10b981; margin-bottom: 8px;">
                        ${badge.name}
                    </div>
                    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.4;">
                        ${badge.desc}
                    </div>
                </div>
            `;
        });
        
        badgeHTML += `
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px;">
                <p style="font-size: 15px; color: rgba(255, 255, 255, 0.85); line-height: 1.7; margin: 0;">
                    These milestones celebrate your consistency and effort. You're building lasting habits—that's the real achievement.
                </p>
            </div>
            
            <button id="close-badges-btn" style="
                margin-top: 30px;
                width: 100%;
                padding: 16px;
                font-size: 17px;
                font-weight: 700;
                color: #fff;
                background: linear-gradient(135deg, #10b981, #059669);
                border: 2px solid rgba(16, 185, 129, 0.3);
                border-radius: 12px;
                cursor: pointer;
                box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
            ">
                Continue ✨
            </button>
        `;
        
        content.innerHTML = badgeHTML;
        
        if (!document.getElementById('badge-celebration-style')) {
            const style = document.createElement('style');
            style.id = 'badge-celebration-style';
            style.textContent = `
                @keyframes fadeInBackdrop {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpFadeIn {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes badgeSlideIn {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes gentlePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Play milestone sound
        this.audio.playMilestone();
        
        document.getElementById('close-badges-btn').addEventListener('click', () => {
            modal.style.transition = 'opacity 0.5s ease-out';
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 500);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.getElementById('close-badges-btn').click();
            }
        });
    }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RewardSystem;
}

        this.session.actions++;
        this.session.movementQuality.push(quality);
        
        // Gentle sensory feedback - no points, no scores
        this.audio.playGentle();
        this.showCalmGlow();
        
        // Meaningful, supportive message
        return {
            message: this.getSupportiveMessage(improvementType, quality),
            quality: quality
        };
    }

    getSupportiveMessage(type, quality) {
        // Adaptive messages based on daily performance
        const performanceAdjusted = quality >= this.session.dailyPerformanceLevel * 0.8;
        
        const messages = {
            movement: {
                high: ['Beautiful movement', 'Flowing nicely', 'Wonderful control', 'Moving with grace'],
                medium: ['That\'s it, nice and steady', 'Good rhythm', 'You\'re in control', 'Smooth progress'],
                low: ['Every movement matters', 'Taking your time is wise', 'You\'re showing up', 'Steady and calm']
            },
            timing: {
                high: ['Perfect rhythm', 'Natural pace', 'Well-timed', 'In sync'],
                medium: ['Finding your rhythm', 'Good pacing', 'Listening to your body', 'At your own pace'],
                low: ['Your timing is unique', 'No rush needed', 'Patience is strength', 'Every beat counts']
            },
            steadiness: {
                high: ['Wonderfully stable', 'Strong and steady', 'Balanced beautifully', 'Centered and calm'],
                medium: ['Finding your balance', 'Building stability', 'Staying grounded', 'Good foundation'],
                low: ['Balance takes practice', 'You\'re working on it', 'Stability comes with time', 'Each try helps']
            },
            effort: {
                high: ['Outstanding effort', 'You\'re fully engaged', 'Committed and focused', 'Giving your all'],
                medium: ['Consistent effort', 'You\'re showing up', 'Staying engaged', 'Building momentum'],
                low: ['Your presence is valuable', 'Effort, not perfection', 'You\'re here, that matters', 'Every bit counts']
            }
        };
        
        const pool = messages[type] || messages.effort;
        const level = performanceAdjusted ? (quality > 0.7 ? 'high' : 'medium') : 'low';
        const levelMessages = pool[level];
        
        return levelMessages[Math.floor(Math.random() * levelMessages.length)];
    }

    showCalmGlow() {
        // Soft, slow-pulsing glow - never jarring
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            background: radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
            animation: calmGlowFade 1.5s ease-in-out;
            z-index: 9999;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('calm-glow-style')) {
            const style = document.createElement('style');
            style.id = 'calm-glow-style';
            style.textContent = `
                @keyframes calmGlowFade {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(glow);
        setTimeout(() => glow.remove(), 1500);
    }

    // Reward after completing a set - micro-achievements
    rewardSet(setNumber) {
        this.session.setsCompleted++;
        this.audio.playCalm();
        
        const microAchievement = this.awardMicroAchievement(setNumber);
        const environmentUpdate = this.updateEnvironment();
        
        return {
            microAchievement,
            environmentUpdate,
            message: `Set ${setNumber} complete. You're building steady progress.`
        };
    }

    awardMicroAchievement(setNumber) {
        // Gentle, meaningful micro-achievements - no childish graphics
        const achievements = [
            { id: 'first_steps', name: 'First Steps Taken', desc: 'You showed up and started', icon: '🌿' },
            { id: 'building_rhythm', name: 'Building Rhythm', desc: 'Three sets of steady practice', icon: '🍃' },
            { id: 'steady_progress', name: 'Steady Progress', desc: 'Five sets of consistent effort', icon: '🌾' },
            { id: 'established_routine', name: 'Established Routine', desc: 'Ten sets - you\'re building a habit', icon: '🌳' },
            { id: 'dedicated_practice', name: 'Dedicated Practice', desc: 'Twenty sets of commitment', icon: '🌲' },
            { id: 'movement_mastery', name: 'Movement Confidence', desc: 'Fifty sets - remarkable dedication', icon: '🏔️' }
        ];
        
        let earned = null;
        if (setNumber === 1) earned = achievements[0];
        else if (setNumber === 3) earned = achievements[1];
        else if (setNumber === 5) earned = achievements[2];
        else if (setNumber === 10) earned = achievements[3];
        else if (setNumber === 20) earned = achievements[4];
        else if (setNumber === 50) earned = achievements[5];
        
        if (earned && !this.progress.microAchievements.find(a => a.id === earned.id)) {
            this.progress.microAchievements.push({ ...earned, date: new Date().toISOString() });
            this.session.badges.push(earned);
            this.audio.playWarm();
            
            // Only show during session if not suppressed
            if (!this.suppressBadgeNotifications) {
                this.showMicroAchievementNotification(earned);
            }
            return earned;
        }
        return null;
    }

    updateEnvironment() {
        // Unlock subtle aesthetic changes based on progress
        const totalSets = this.progress.totalSessions * 3; // Estimate
        const themes = [
            { threshold: 0, theme: 'default', name: 'Calm Beginning', desc: 'Soft blues and grays' },
            { threshold: 10, theme: 'morning', name: 'Morning Light', desc: 'Gentle warm tones' },
            { threshold: 25, theme: 'garden', name: 'Garden Path', desc: 'Peaceful greens' },
            { threshold: 50, theme: 'sunset', name: 'Evening Calm', desc: 'Soothing oranges' },
            { threshold: 100, theme: 'starlight', name: 'Starlit Peace', desc: 'Deep blues with soft stars' }
        ];
        
        const newTheme = themes.reverse().find(t => totalSets >= t.threshold);
        
        if (newTheme && this.progress.environmentTheme !== newTheme.theme) {
            this.progress.environmentTheme = newTheme.theme;
            return newTheme;
        }
        return null;
    }

    showMicroAchievementNotification(achievement) {
        // Calm, gentle notification - never during gameplay by default
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(109, 40, 217, 0.95) 100%);
            border: 2px solid rgba(167, 139, 250, 0.5);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            z-index: 10000;
            animation: gentleAppear 1s ease-out forwards;
            box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 16px; animation: gentleFloat 3s ease-in-out infinite;">${achievement.icon}</div>
            <div style="font-size: 22px; font-weight: 600; color: #ffffff; margin-bottom: 12px; line-height: 1.4;">
                ${achievement.name}
            </div>
            <div style="font-size: 16px; color: rgba(255,255,255,0.9); line-height: 1.6;">${achievement.desc}</div>
        `;
        
        // Add gentle animations
        if (!document.getElementById('gentle-animation-style')) {
            const style = document.createElement('style');
            style.id = 'gentle-animation-style';
            style.textContent = `
                @keyframes gentleAppear {
                    0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                @keyframes gentleFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transition = 'opacity 1s ease-out';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 1000);
        }, 3000);
    }

    unlockCosmetic() {
        const cosmetics = [
            { type: 'color', value: '#10b981', name: 'Emerald theme' },
            { type: 'color', value: '#8b5cf6', name: 'Purple theme' },
            { type: 'color', value: '#3b82f6', name: 'Ocean theme' },
            { type: 'particle', value: 'stars', name: 'Star particles' }
        ];
        
        const random = cosmetics[Math.floor(Math.random() * cosmetics.length)];
        return random;
    }

    showBadgeNotification(badge) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: rgba(10, 12, 16, 0.95);
            border: 3px solid #10b981;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            z-index: 10000;
            animation: badgePopup 2s ease-out forwards;
            box-shadow: 0 20px 60px rgba(16, 185, 129, 0.5);
        `;
        
        notification.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">${badge.name.split(' ')[0]}</div>
            <div style="font-size: 20px; font-weight: 700; color: #10b981; margin-bottom: 5px;">
                ${badge.name.substring(badge.name.indexOf(' ') + 1)}
            </div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.7);">${badge.desc}</div>
        `;
        
        // Add animation
        if (!document.getElementById('badge-animation-style')) {
            const style = document.createElement('style');
            style.id = 'badge-animation-style';
            style.textContent = `
                @keyframes badgePopup {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    70% { transform: translate(-50%, -50%) scale(0.95); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    // End session and show compassionate summary
    endSession() {
        const duration = Math.floor((Date.now() - this.session.startTime) / 1000);
        
        // Calculate movement quality average
        const avgQuality = this.session.movementQuality.length > 0 
            ? this.session.movementQuality.reduce((a, b) => a + b, 0) / this.session.movementQuality.length 
            : 0.5;
        
        // Update best movement quality if improved
        if (avgQuality > this.progress.bestMovementQuality) {
            this.progress.bestMovementQuality = avgQuality;
        }
        
        // Update progress
        this.progress.totalSessions++;
        this.progress.totalActions += this.session.actions;
        
        // Update streak (adaptive - never punishing)
        this.updateAdaptiveStreak();
        
        // Store trend data focusing on quality, not quantity
        this.progress.trendData.push({
            date: new Date().toISOString(),
            actions: this.session.actions,
            sets: this.session.setsCompleted,
            quality: avgQuality,
            duration
        });
        if (this.progress.trendData.length > 10) {
            this.progress.trendData.shift();
        }
        
        // Add micro-achievements to progress
        this.session.badges.forEach(badge => {
            if (!this.progress.microAchievements.find(b => b.id === badge.id)) {
                this.progress.microAchievements.push({ ...badge, date: new Date().toISOString() });
            }
        });
        
        this.saveProgress();
        
        return this.generateCompassionateSummary(duration, avgQuality);
    }

    updateAdaptiveStreak() {
        // Adaptive streak that recognizes symptom fluctuations
        const today = new Date().toDateString();
        const lastSession = this.progress.lastSession ? new Date(this.progress.lastSession).toDateString() : null;
        
        if (lastSession === today) {
            // Same day, maintain streak
            return;
        }
        
        const daysSinceLastSession = lastSession 
            ? Math.floor((new Date() - new Date(this.progress.lastSession)) / (1000 * 60 * 60 * 24))
            : 0;
        
        if (daysSinceLastSession <= 3) {
            // Allow 3-day grace period for bad symptom days
            this.progress.streak++;
        } else if (!lastSession) {
            // First session
            this.progress.streak = 1;
        } else {
            // Gentle reset, not punishment
            this.progress.streak = 1;
        }
        
        this.progress.lastSession = new Date().toISOString();
    }

    generateCompassionateSummary(duration, avgQuality) {
        const functionalProgress = this.calculateFunctionalProgress(avgQuality);
        const streakMilestone = this.getStreakMilestone();
        const encouragement = this.getAdaptiveEncouragement(avgQuality);
        
        // Show badges collected during this session in a beautiful way
        if (this.session.badges.length > 0) {
            setTimeout(() => {
                this.showSessionBadges();
            }, 500);
        }
        
        return {
            duration,
            actions: this.session.actions,
            sets: this.session.setsCompleted,
            movementQuality: Math.round(avgQuality * 100),
            badges: this.session.badges,
            functionalProgress,
            streak: this.progress.streak,
            streakMilestone,
            encouragement,
            environmentTheme: this.progress.environmentTheme
        };
    }

    calculateFunctionalProgress(currentQuality) {
        // Meaningful progress indicators reflecting functional ability
        const improvement = currentQuality - (this.session.dailyPerformanceLevel || 0.5);
        
        if (improvement > 0.15) {
            return { 
                level: 'excellent',
                message: 'Your movements were smoother than usual today',
                icon: '✨'
            };
        } else if (improvement > 0.05) {
            return { 
                level: 'good',
                message: 'You showed steady control throughout',
                icon: '🌟'
            };
        } else if (improvement > -0.05) {
            return { 
                level: 'consistent',
                message: 'You maintained your baseline beautifully',
                icon: '🍃'
            };
        } else {
            return { 
                level: 'participated',
                message: 'You showed up and that\'s what matters most',
                icon: '🌿'
            };
        }
    }

    getStreakMilestone() {
        // Celebrate consistency without pressure
        const milestones = [
            { threshold: 1, name: 'Beginning Your Journey', message: 'Every journey starts with a single step' },
            { threshold: 3, name: 'Building Momentum', message: 'Three days of dedication' },
            { threshold: 7, name: 'One Week Strong', message: 'A full week of commitment' },
            { threshold: 14, name: 'Two Weeks of Progress', message: 'You\'re building a habit' },
            { threshold: 30, name: 'One Month Milestone', message: 'Thirty days of showing up for yourself' },
            { threshold: 60, name: 'Two Months Dedicated', message: 'Remarkable consistency' },
            { threshold: 100, name: 'Century of Commitment', message: 'Extraordinary dedication to your wellness' }
        ];
        
        return milestones.reverse().find(m => this.progress.streak >= m.threshold) || milestones[0];
    }

    getAdaptiveEncouragement(quality) {
        // Adaptive encouragement based on performance relative to daily baseline
        const relativePerformance = quality / (this.session.dailyPerformanceLevel || 0.5);
        
        if (relativePerformance > 1.1) {
            return [
                'You exceeded your usual ability today - wonderful progress',
                'Your body is responding well to the practice',
                'Notice how your movements felt smoother today'
            ];
        } else if (relativePerformance > 0.9) {
            return [
                'You maintained consistent quality throughout',
                'Steady performance shows great body awareness',
                'Your practice is paying off'
            ];
        } else {
            return [
                'Challenging days are part of the journey',
                'Showing up is the most important thing',
                'Your effort today builds tomorrow\'s strength',
                'Rest and recovery are part of progress'
            ];
        }
    }

    getStreakBadge() {
        const streaks = [
            { days: 3, badge: { name: '🔥 3-Day Streak', desc: 'Consistency builds strength' } },
            { days: 7, badge: { name: '⚡ 1-Week Warrior', desc: 'You\'re building a habit' } },
            { days: 14, badge: { name: '💎 2-Week Champion', desc: 'Incredible dedication' } },
            { days: 30, badge: { name: '👑 Monthly Master', desc: 'Outstanding commitment' } }
        ];
        
        for (let i = streaks.length - 1; i >= 0; i--) {
            if (this.progress.streak >= streaks[i].days) {
                return streaks[i].badge;
            }
        }
        return null;
    }

    adaptDifficulty() {
        // Gentle difficulty adaptation based on performance
        const avgActions = this.progress.trendData.length > 0
            ? this.progress.trendData.reduce((sum, d) => sum + d.actions, 0) / this.progress.trendData.length
            : 0;
        
        if (avgActions > 30) return { level: 'moderate', message: 'Ready for a gentle challenge' };
        if (avgActions > 15) return { level: 'comfortable', message: 'Maintaining your pace' };
        return { level: 'gentle', message: 'Taking it at your speed' };
    }

    getEncouragementMessage() {
        const messages = [
            'Every session builds your strength and confidence.',
            'You showed up today - that\'s what matters most.',
            'Your consistency is the key to progress.',
            'Great work! You\'re investing in your health.',
            'Each movement today helps you tomorrow.',
            'You\'re building positive momentum!'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Show session summary modal
    showSessionSummary(summary) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1d24 0%, #0a0c10 100%);
            border: 3px solid #10b981;
            border-radius: 16px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.4s ease-out;
        `;
        
        let badgesHtml = '';
        if (summary.badges.length > 0) {
            badgesHtml = `
                <div style="margin: 20px 0; padding: 20px; background: rgba(16, 185, 129, 0.15); border-radius: 12px; border: 3px solid rgba(16, 185, 129, 0.5);">
                    <div style="font-size: 18px; font-weight: 700; color: #10b981; margin-bottom: 15px; text-align: center;">
                        🎖️ Badges Earned This Session!
                    </div>
                    ${summary.badges.map(b => `
                        <div style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 2px solid rgba(16, 185, 129, 0.3);">
                            <div style="font-size: 20px; font-weight: 700; color: #10b981; margin-bottom: 5px;">
                                ${b.name}
                            </div>
                            <div style="font-size: 14px; color: rgba(255,255,255,0.8);">
                                ${b.desc}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let streakHtml = '';
        if (summary.streakBadge) {
            streakHtml = `
                <div style="margin: 20px 0; padding: 15px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 2px solid rgba(251, 191, 36, 0.3);">
                    <div style="font-size: 18px; font-weight: 700; color: #fbbf24; margin-bottom: 5px;">
                        ${summary.streakBadge.name}
                    </div>
                    <div style="font-size: 13px; color: rgba(255,255,255,0.7);">
                        ${summary.streakBadge.desc}
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            <h2 style="font-size: 24px; margin-bottom: 20px; color: #10b981; text-align: center;">
                Session Complete! 🎉
            </h2>
            
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Duration</div>
                        <div style="font-size: 20px; font-weight: 700; color: #fff;">${Math.floor(summary.duration / 60)}m ${summary.duration % 60}s</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Actions</div>
                        <div style="font-size: 20px; font-weight: 700; color: #fff;">${summary.actions}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Sets</div>
                        <div style="font-size: 20px; font-weight: 700; color: #fff;">${summary.sets}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Streak</div>
                        <div style="font-size: 20px; font-weight: 700; color: #fbbf24;">${summary.streak} days 🔥</div>
                    </div>
                </div>
            </div>
            
            ${badgesHtml}
            ${streakHtml}
            
            <div style="margin: 20px 0; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 2px solid rgba(59, 130, 246, 0.3);">
                <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">📈 Progress Trend</div>
                <div style="font-size: 16px; font-weight: 600; color: #3b82f6;">
                    ${summary.trend.message}
                </div>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 2px solid rgba(139, 92, 246, 0.3);">
                <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">🎯 Next Session</div>
                <div style="font-size: 16px; font-weight: 600; color: #8b5cf6;">
                    ${summary.nextDifficulty.message}
                </div>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; text-align: center; font-size: 15px; color: rgba(255,255,255,0.9); font-style: italic;">
                "${summary.encouragement}"
            </div>
            
            <button id="close-summary" style="
                width: 100%;
                padding: 12px;
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                background: linear-gradient(135deg, #10b981, #059669);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                Continue
            </button>
        `;
        
        // Add animations
        if (!document.getElementById('summary-animation-style')) {
            const style = document.createElement('style');
            style.id = 'summary-animation-style';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        document.getElementById('close-summary').addEventListener('click', () => {
            modal.remove();
        });
    }

    showSessionBadges() {
        // Beautiful, comforting badge celebration screen
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeInBackdrop 0.6s ease-out forwards;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
            border: 3px solid rgba(139, 92, 246, 0.4);
            border-radius: 24px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 30px 80px rgba(139, 92, 246, 0.3);
            animation: slideUpFadeIn 0.8s ease-out forwards;
        `;
        
        // Create badge display
        let badgeHTML = `
            <div style="margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 15px; animation: gentlePulse 2s ease-in-out infinite;">🏆</div>
                <h2 style="font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 10px; text-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);">
                    Wonderful Progress!
                </h2>
                <p style="font-size: 18px; color: rgba(255, 255, 255, 0.75); line-height: 1.6;">
                    You've earned ${this.session.badges.length} new milestone${this.session.badges.length > 1 ? 's' : ''} today
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
        `;
        
        this.session.badges.forEach((badge, index) => {
            badgeHTML += `
                <div style="
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(109, 40, 217, 0.15) 100%);
                    border: 2px solid rgba(167, 139, 250, 0.3);
                    border-radius: 16px;
                    padding: 24px;
                    transition: all 0.4s ease;
                    animation: badgeSlideIn ${0.6 + index * 0.2}s ease-out forwards;
                    opacity: 0;
                    cursor: default;
                " 
                onmouseover="this.style.transform='translateY(-8px) scale(1.05)'; this.style.borderColor='rgba(167, 139, 250, 0.6)'; this.style.boxShadow='0 12px 40px rgba(139, 92, 246, 0.4)';"
                onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.borderColor='rgba(167, 139, 250, 0.3)'; this.style.boxShadow='none';">
                    <div style="font-size: 56px; margin-bottom: 12px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
                        ${badge.icon}
                    </div>
                    <div style="font-size: 18px; font-weight: 700; color: #a78bfa; margin-bottom: 8px; line-height: 1.3;">
                        ${badge.name}
                    </div>
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                        ${badge.desc}
                    </div>
                </div>
            `;
        });
        
        badgeHTML += `
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 12px;">
                <p style="font-size: 16px; color: rgba(255, 255, 255, 0.85); line-height: 1.8; margin: 0;">
                    Each milestone represents your dedication and progress. Take pride in showing up and putting in the effort—that's what truly matters.
                </p>
            </div>
            
            <button id="close-badges" style="
                margin-top: 30px;
                width: 100%;
                padding: 16px;
                font-size: 18px;
                font-weight: 700;
                color: #fff;
                background: linear-gradient(135deg, #8b5cf6, #6366f1);
                border: 2px solid rgba(139, 92, 246, 0.3);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 30px rgba(139, 92, 246, 0.5)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(139, 92, 246, 0.3)';">
                Continue ✨
            </button>
        `;
        
        content.innerHTML = badgeHTML;
        
        // Add animations
        if (!document.getElementById('badge-celebration-style')) {
            const style = document.createElement('style');
            style.id = 'badge-celebration-style';
            style.textContent = `
                @keyframes fadeInBackdrop {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpFadeIn {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes badgeSlideIn {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes gentlePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Play celebratory sound
        this.audio.playWarm();
        
        // Close button handler
        document.getElementById('close-badges').addEventListener('click', () => {
            modal.style.transition = 'opacity 0.5s ease-out';
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 500);
        });
        
        // Also allow clicking backdrop to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.getElementById('close-badges').click();
            }
        });
    }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RewardSystem;
}
