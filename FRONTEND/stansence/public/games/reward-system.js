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
        // Game-specific badges for CONSISTENCY and EFFORT, never accuracy
        const gameBadges = {
            'steady-hand': [
                { id: 'getting_started', sets: 1, icon: '🌱', name: 'Getting Started', desc: 'Completed your first set' },
                { id: 'persistent', sets: 3, icon: '👍', name: 'Persistent', desc: 'Completed 3 sets' },
                { id: 'dedicated', sets: 5, icon: '⭐', name: 'Dedicated', desc: 'Completed 5 sets' },
                { id: 'champion', sets: 10, icon: '🏆', name: 'Champion', desc: 'Completed 10 sets' },
                { id: 'master', sets: 20, icon: '💎', name: 'Master', desc: 'Completed 20 sets' },
                { id: 'legend', sets: 50, icon: '👑', name: 'Legend', desc: 'Completed 50 sets' }
            ],
            'rhythm-tap': [
                { id: 'rhythm_starter', sets: 1, icon: '�', name: 'Rhythm Starter', desc: 'First steps in timing' },
                { id: 'beat_keeper', sets: 3, icon: '🥁', name: 'Beat Keeper', desc: 'Finding your rhythm' },
                { id: 'tempo_master', sets: 5, icon: '🎼', name: 'Tempo Master', desc: 'Steady beat control' },
                { id: 'rhythm_pro', sets: 10, icon: '🎹', name: 'Rhythm Pro', desc: 'Consistent timing' },
                { id: 'metronome', sets: 20, icon: '⏱️', name: 'Metronome', desc: 'Perfect consistency' },
                { id: 'conductor', sets: 50, icon: '�', name: 'Conductor', desc: 'Timing excellence' }
            ],
            'strength-meter': [
                { id: 'first_squeeze', sets: 1, icon: '💪', name: 'First Squeeze', desc: 'Building control' },
                { id: 'grip_builder', sets: 3, icon: '🤝', name: 'Grip Builder', desc: 'Developing strength' },
                { id: 'control_expert', sets: 5, icon: '�', name: 'Control Expert', desc: 'Mastering tension' },
                { id: 'strength_warrior', sets: 10, icon: '⚡', name: 'Strength Warrior', desc: 'Powerful practice' },
                { id: 'iron_grip', sets: 20, icon: '🔨', name: 'Iron Grip', desc: 'Remarkable endurance' },
                { id: 'titan', sets: 50, icon: '🦾', name: 'Titan', desc: 'Ultimate strength' }
            ],
            'rhythm-walker': [
                { id: 'first_steps', sets: 1, icon: '👣', name: 'First Steps', desc: 'Starting your journey' },
                { id: 'steady_walker', sets: 3, icon: '🚶', name: 'Steady Walker', desc: 'Building gait rhythm' },
                { id: 'balanced_mover', sets: 5, icon: '⚖️', name: 'Balanced Mover', desc: 'Stable and consistent' },
                { id: 'gait_master', sets: 10, icon: '�', name: 'Gait Master', desc: 'Confident movement' },
                { id: 'stride_champion', sets: 20, icon: '🥇', name: 'Stride Champion', desc: 'Excellent control' },
                { id: 'walking_legend', sets: 50, icon: '🌟', name: 'Walking Legend', desc: 'Incredible consistency' }
            ]
        };
        
        const effortBadges = gameBadges[this.gameName] || gameBadges['steady-hand'];
        
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
        // DISABLED: Corner notifications moved to session complete screen
        // Badges and achievements will now be shown in the session complete box
        // This provides a better user experience by consolidating all feedback
        
        // Store badge info for session complete display (already in this.session.badges)
        console.log(`Set ${setNumber} complete${badge ? ` - ${badge.name} earned` : ''}${cosmetic ? ` - ${cosmetic.name} unlocked` : ''}`);
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

