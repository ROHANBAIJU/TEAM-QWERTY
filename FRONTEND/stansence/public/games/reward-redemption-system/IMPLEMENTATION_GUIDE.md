# Implementation Guide: Technical Specifications

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Exercise   │  │ Coin System  │  │ Reward Store │  │
│  │  Games      │  │  Manager     │  │  Interface   │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Backend API (Node.js)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Coin       │  │  Redemption  │  │  Partner     │  │
│  │  Service    │  │  Service     │  │  Integration │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                Database (Firestore)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  User       │  │  Transaction │  │  Redemption  │  │
│  │  Profiles   │  │  Logs        │  │  History     │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Models

### User Profile Schema
```javascript
{
  userId: "uuid",
  profile: {
    name: "Margaret Thompson",
    email: "margaret@example.com",
    diagnosisDate: "2022-03-15",
    stage: "moderate",
    preferences: {
      notificationsEnabled: true,
      audioFeedback: true,
      reducedMotion: false,
      highContrast: false,
      preferredExerciseTime: "morning"
    }
  },
  coins: {
    totalBalance: 1300,
    lifetimeEarned: 5420,
    coinsEarnedToday: 115,
    lastDailyReset: "2025-11-15T00:00:00Z"
  },
  activity: {
    currentStreak: 12,
    longestStreak: 18,
    totalSessions: 45,
    lastSessionDate: "2025-11-15T09:22:00Z",
    sessionsToday: 1,
    capacityProfile: "moderate" // auto-detected
  },
  rewards: {
    unlockedThemes: ["default", "ocean", "forest"],
    activeRedemptions: [
      {
        redemptionId: "uuid",
        rewardId: "HW-002",
        rewardName: "Massage Therapy (30 min)",
        voucherCode: "MASSAGE-P7R3-9K2M",
        redeemedAt: "2025-11-15T09:29:00Z",
        expiresAt: "2026-03-15T23:59:59Z",
        status: "active"
      }
    ],
    wishlist: ["HW-004", "RR-008"]
  }
}
```

### Coin Transaction Log Schema
```javascript
{
  transactionId: "uuid",
  userId: "uuid",
  timestamp: "2025-11-15T09:22:00Z",
  type: "earn", // or "spend"
  amount: 30,
  source: "session_complete", // session_start, set_complete, bonus, etc.
  metadata: {
    sessionId: "uuid",
    gameName: "steady-hand",
    setNumber: 3,
    bypassedCap: false
  },
  balanceAfter: 1300
}
```

### Reward Catalog Schema
```javascript
{
  rewardId: "HW-002",
  category: "health-wellness",
  name: "Massage Therapy (30 min)",
  description: "Therapeutic massage to reduce muscle rigidity and tension",
  costCoins: 600,
  realWorldValue: 40,
  icon: "💆",
  therapeuticBenefit: "Reduces stiffness, improves circulation, supports relaxation",
  redemptionType: "voucher", // instant, voucher, physical, subscription
  partner: {
    name: "Zeel, Soothe",
    contactEmail: "support@partner.com",
    instructions: "Download app, create account, enter voucher at checkout"
  },
  validityDays: 120,
  isActive: true,
  inventory: null, // null = unlimited
  requiresAddress: false,
  requiresEmail: true,
  ageRestriction: null,
  availableRegions: ["US", "CA"]
}
```

### Redemption Record Schema
```javascript
{
  redemptionId: "uuid",
  userId: "uuid",
  rewardId: "HW-002",
  rewardSnapshot: { /* full reward object at time of redemption */ },
  coinsSpent: 600,
  redeemedAt: "2025-11-15T09:29:00Z",
  expiresAt: "2026-03-15T23:59:59Z",
  status: "active", // active, used, expired
  fulfillment: {
    type: "voucher",
    voucherCode: "MASSAGE-P7R3-9K2M",
    emailSent: true,
    emailSentAt: "2025-11-15T09:29:15Z",
    trackingInfo: null
  },
  usage: {
    usedAt: null,
    usageLocation: null,
    userFeedback: null
  }
}
```

---

## Core Services Implementation

### 1. Coin Service

```javascript
// coin-service.js

class CoinService {
  constructor(db) {
    this.db = db;
    this.DAILY_CAP = 200;
    this.GRACE_PERIOD_HOURS = 24;
  }

  /**
   * Award coins to user with validation and caps
   */
  async awardCoins(userId, amount, source, metadata = {}) {
    const user = await this.db.getUser(userId);
    
    // Check daily reset
    await this.checkAndResetDaily(userId, user);
    
    // Apply daily cap for exercise activities
    if (source.startsWith('exercise_') && user.coins.coinsEarnedToday >= this.DAILY_CAP) {
      return {
        success: false,
        reason: 'daily_cap_reached',
        coinsAwarded: 0,
        message: "You've done excellent work today. Time to rest."
      };
    }
    
    // Award coins
    const newBalance = user.coins.totalBalance + amount;
    const newDailyTotal = source.startsWith('exercise_') 
      ? user.coins.coinsEarnedToday + amount 
      : user.coins.coinsEarnedToday;
    
    // Update user record
    await this.db.updateUser(userId, {
      'coins.totalBalance': newBalance,
      'coins.lifetimeEarned': user.coins.lifetimeEarned + amount,
      'coins.coinsEarnedToday': newDailyTotal
    });
    
    // Log transaction
    await this.logTransaction({
      userId,
      type: 'earn',
      amount,
      source,
      metadata,
      balanceAfter: newBalance
    });
    
    return {
      success: true,
      coinsAwarded: amount,
      newBalance,
      message: this.getEarningMessage(source, amount)
    };
  }

  /**
   * Deduct coins for redemption with validation
   */
  async spendCoins(userId, amount, rewardId) {
    const user = await this.db.getUser(userId);
    
    // Validate sufficient balance
    if (user.coins.totalBalance < amount) {
      return {
        success: false,
        reason: 'insufficient_balance',
        required: amount,
        current: user.coins.totalBalance
      };
    }
    
    // Deduct coins
    const newBalance = user.coins.totalBalance - amount;
    
    await this.db.updateUser(userId, {
      'coins.totalBalance': newBalance
    });
    
    // Log transaction
    await this.logTransaction({
      userId,
      type: 'spend',
      amount,
      source: 'redemption',
      metadata: { rewardId },
      balanceAfter: newBalance
    });
    
    return {
      success: true,
      coinsSpent: amount,
      newBalance
    };
  }

  /**
   * Reset daily counters at midnight local time
   */
  async checkAndResetDaily(userId, user) {
    const now = new Date();
    const lastReset = new Date(user.coins.lastDailyReset);
    
    // Check if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      await this.db.updateUser(userId, {
        'coins.coinsEarnedToday': 0,
        'coins.lastDailyReset': now.toISOString(),
        'activity.sessionsToday': 0
      });
    }
  }

  /**
   * Calculate streak with grace period
   */
  async updateStreak(userId) {
    const user = await this.db.getUser(userId);
    const today = new Date().toDateString();
    const lastSession = user.activity.lastSessionDate 
      ? new Date(user.activity.lastSessionDate).toDateString() 
      : null;
    
    if (!lastSession) {
      // First session ever
      await this.db.updateUser(userId, {
        'activity.currentStreak': 1,
        'activity.longestStreak': Math.max(1, user.activity.longestStreak)
      });
      return;
    }
    
    if (lastSession === today) {
      // Same day, no change
      return;
    }
    
    const daysSince = Math.floor(
      (new Date(today) - new Date(lastSession)) / (1000 * 60 * 60 * 24)
    );
    
    let newStreak;
    if (daysSince === 1) {
      // Perfect continuation
      newStreak = user.activity.currentStreak + 1;
    } else if (daysSince <= 3) {
      // Grace period (symptom accommodation)
      newStreak = user.activity.currentStreak + 1;
    } else {
      // Gentle reset
      newStreak = 1;
    }
    
    await this.db.updateUser(userId, {
      'activity.currentStreak': newStreak,
      'activity.longestStreak': Math.max(newStreak, user.activity.longestStreak)
    });
    
    // Award streak bonus if weekly milestone
    if (newStreak % 7 === 0) {
      const bonusAmount = this.calculateStreakBonus(newStreak);
      await this.awardCoins(userId, bonusAmount, 'streak_bonus', { 
        streakDays: newStreak 
      });
    }
  }

  calculateStreakBonus(streakDays) {
    const weeks = Math.floor(streakDays / 7);
    if (weeks === 1) return 50;
    if (weeks === 2) return 75;
    if (weeks === 3) return 100;
    return 125;
  }

  getEarningMessage(source, amount) {
    const messages = {
      'session_start': 'You started—that\'s what matters.',
      'set_complete': 'Set complete.',
      'session_complete': 'Session complete. Well done.',
      'rest_day': 'Rest is part of training.',
      'streak_bonus': 'Consistent showing up.',
      'safe_movement': 'Controlled movement noticed.',
      'daily_checkin': 'Welcome back.'
    };
    return messages[source] || 'Coins earned.';
  }

  async logTransaction(data) {
    await this.db.collection('coin_transactions').add({
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = CoinService;
```

---

### 2. Redemption Service

```javascript
// redemption-service.js

class RedemptionService {
  constructor(db, coinService, emailService, partnerService) {
    this.db = db;
    this.coinService = coinService;
    this.emailService = emailService;
    this.partnerService = partnerService;
  }

  /**
   * Process reward redemption
   */
  async redeemReward(userId, rewardId) {
    try {
      // 1. Get reward details
      const reward = await this.db.getReward(rewardId);
      if (!reward || !reward.isActive) {
        return {
          success: false,
          error: 'reward_not_available'
        };
      }

      // 2. Check inventory (if applicable)
      if (reward.inventory !== null && reward.inventory <= 0) {
        return {
          success: false,
          error: 'reward_out_of_stock'
        };
      }

      // 3. Deduct coins
      const spendResult = await this.coinService.spendCoins(
        userId, 
        reward.costCoins, 
        rewardId
      );
      
      if (!spendResult.success) {
        return {
          success: false,
          error: 'insufficient_coins',
          ...spendResult
        };
      }

      // 4. Generate fulfillment (voucher code, etc.)
      const fulfillment = await this.generateFulfillment(reward, userId);

      // 5. Create redemption record
      const expiresAt = reward.validityDays 
        ? new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000)
        : null;

      const redemption = {
        userId,
        rewardId,
        rewardSnapshot: reward,
        coinsSpent: reward.costCoins,
        redeemedAt: new Date().toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        status: 'active',
        fulfillment
      };

      const redemptionId = await this.db.createRedemption(redemption);

      // 6. Update user's active redemptions
      await this.db.updateUser(userId, {
        'rewards.activeRedemptions': admin.firestore.FieldValue.arrayUnion({
          redemptionId,
          rewardId,
          rewardName: reward.name,
          voucherCode: fulfillment.voucherCode,
          redeemedAt: redemption.redeemedAt,
          expiresAt: redemption.expiresAt,
          status: 'active'
        })
      });

      // 7. Update inventory (if applicable)
      if (reward.inventory !== null) {
        await this.db.updateReward(rewardId, {
          inventory: admin.firestore.FieldValue.increment(-1)
        });
      }

      // 8. Send confirmation email
      const user = await this.db.getUser(userId);
      await this.emailService.sendRedemptionConfirmation(
        user.profile.email,
        reward,
        fulfillment
      );

      // 9. Notify partner service (if applicable)
      if (reward.partner && reward.partner.notificationWebhook) {
        await this.partnerService.notifyRedemption(
          reward.partner.notificationWebhook,
          { userId, rewardId, fulfillment }
        );
      }

      return {
        success: true,
        redemptionId,
        newBalance: spendResult.newBalance,
        fulfillment
      };

    } catch (error) {
      console.error('Redemption error:', error);
      return {
        success: false,
        error: 'processing_error',
        message: 'Unable to process redemption. Please try again.'
      };
    }
  }

  /**
   * Generate fulfillment based on reward type
   */
  async generateFulfillment(reward, userId) {
    switch (reward.redemptionType) {
      case 'voucher':
        return {
          type: 'voucher',
          voucherCode: this.generateVoucherCode(reward.rewardId),
          emailSent: false,
          emailSentAt: null
        };
      
      case 'instant':
        // In-app rewards (themes, sounds, etc.)
        return {
          type: 'instant',
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      
      case 'physical':
        const user = await this.db.getUser(userId);
        return {
          type: 'physical',
          shippingAddress: user.profile.address,
          trackingNumber: null,
          shippedAt: null
        };
      
      case 'subscription':
        return {
          type: 'subscription',
          activationCode: this.generateActivationCode(),
          activatedAt: null,
          expiresAt: null
        };
      
      default:
        throw new Error('Unknown redemption type');
    }
  }

  /**
   * Generate unique voucher code
   */
  generateVoucherCode(rewardId) {
    const prefix = rewardId.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${random.substring(0, 4)}-${random.substring(4, 8)}`;
  }

  generateActivationCode() {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  /**
   * Check for expiring redemptions and send reminders
   */
  async checkExpiringRedemptions() {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const expiring = await this.db.getRedemptions({
      status: 'active',
      expiresAt: { '<=': sevenDaysFromNow.toISOString() },
      reminderSent: false
    });

    for (const redemption of expiring) {
      const user = await this.db.getUser(redemption.userId);
      await this.emailService.sendExpirationReminder(
        user.profile.email,
        redemption
      );
      
      await this.db.updateRedemption(redemption.redemptionId, {
        reminderSent: true
      });
    }
  }

  /**
   * Mark expired redemptions
   */
  async markExpiredRedemptions() {
    const now = new Date().toISOString();
    
    await this.db.updateRedemptions(
      { status: 'active', expiresAt: { '<': now } },
      { status: 'expired' }
    );
  }
}

module.exports = RedemptionService;
```

---

### 3. Fatigue Detection Service

```javascript
// fatigue-detection-service.js

class FatigueDetectionService {
  constructor() {
    this.VARIABILITY_THRESHOLD = 0.3; // 30% increase in variability
    this.PAUSE_THRESHOLD = 2.0; // 2x longer pauses than baseline
    this.QUALITY_DECLINE_THRESHOLD = 0.25; // 25% decline
  }

  /**
   * Analyze session data for fatigue indicators
   */
  analyzeFatigue(sessionData, userBaseline) {
    const indicators = {
      increasedVariability: false,
      longerPauses: false,
      decliningQuality: false,
      timeBasedFatigue: false
    };

    // 1. Check movement variability
    const currentVariability = this.calculateVariability(sessionData.movements);
    if (currentVariability > userBaseline.variability * (1 + this.VARIABILITY_THRESHOLD)) {
      indicators.increasedVariability = true;
    }

    // 2. Check pause duration
    const currentPauseDuration = this.averagePauseDuration(sessionData.movements);
    if (currentPauseDuration > userBaseline.pauseDuration * this.PAUSE_THRESHOLD) {
      indicators.longerPauses = true;
    }

    // 3. Check quality decline over sets
    if (sessionData.sets.length >= 2) {
      const qualityTrend = this.calculateQualityTrend(sessionData.sets);
      if (qualityTrend < -this.QUALITY_DECLINE_THRESHOLD) {
        indicators.decliningQuality = true;
      }
    }

    // 4. Time-based fatigue (>20 minutes)
    if (sessionData.durationMinutes > 20) {
      indicators.timeBasedFatigue = true;
    }

    // Decision: Show fatigue warning if 2+ indicators
    const indicatorCount = Object.values(indicators).filter(v => v).length;
    
    return {
      shouldWarn: indicatorCount >= 2,
      indicators,
      severity: indicatorCount >= 3 ? 'high' : indicatorCount === 2 ? 'moderate' : 'low'
    };
  }

  calculateVariability(movements) {
    if (movements.length < 2) return 0;
    const values = movements.map(m => m.duration || m.amplitude);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  averagePauseDuration(movements) {
    const pauses = [];
    for (let i = 1; i < movements.length; i++) {
      pauses.push(movements[i].timestamp - movements[i-1].timestamp - movements[i-1].duration);
    }
    return pauses.reduce((a, b) => a + b, 0) / pauses.length;
  }

  calculateQualityTrend(sets) {
    // Linear regression of quality scores over sets
    const scores = sets.map((set, index) => ({ x: index, y: set.qualityScore }));
    const n = scores.length;
    const sumX = scores.reduce((sum, p) => sum + p.x, 0);
    const sumY = scores.reduce((sum, p) => sum + p.y, 0);
    const sumXY = scores.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = scores.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope; // Negative slope indicates decline
  }

  /**
   * Update user baseline from recent sessions
   */
  async updateBaseline(userId, recentSessions) {
    // Calculate baseline from last 7 sessions (excluding outliers)
    const movements = recentSessions.flatMap(s => s.movements);
    
    const baseline = {
      variability: this.calculateVariability(movements),
      pauseDuration: this.averagePauseDuration(movements),
      avgSessionDuration: recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / recentSessions.length,
      updatedAt: new Date().toISOString()
    };

    await this.db.updateUser(userId, {
      'activity.baseline': baseline
    });
  }
}

module.exports = FatigueDetectionService;
```

---

## Frontend Integration (React)

### Coin Display Component

```jsx
// components/CoinDisplay.jsx

import React from 'react';
import { useCoinBalance } from '../hooks/useCoinBalance';
import './CoinDisplay.css';

export function CoinDisplay() {
  const { balance, loading } = useCoinBalance();

  if (loading) {
    return <div className="coin-display skeleton">Loading...</div>;
  }

  return (
    <div className="coin-display" role="status" aria-label={`Your current balance is ${balance} wellness coins`}>
      <div className="coin-icon">🪙</div>
      <div className="coin-amount">{balance.toLocaleString()}</div>
      <div className="coin-label">coins</div>
    </div>
  );
}
```

### Reward Store Component

```jsx
// components/RewardStore.jsx

import React, { useState, useEffect } from 'react';
import { useRewards } from '../hooks/useRewards';
import { useCoinBalance } from '../hooks/useCoinBalance';
import { CategoryCard } from './CategoryCard';
import { RewardCard } from './RewardCard';
import { RedemptionModal } from './RedemptionModal';
import './RewardStore.css';

export function RewardStore() {
  const { balance } = useCoinBalance();
  const { categories, getRewardsByCategory } = useRewards();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);

  // Category view
  if (!selectedCategory) {
    return (
      <div className="reward-store">
        <header className="store-header">
          <button className="back-button" onClick={() => window.history.back()}>
            ← Back
          </button>
          <h1>Reward Store</h1>
        </header>

        <div className="balance-display">
          <CoinDisplay />
        </div>

        <h2 className="section-heading">Choose a category</h2>

        <div className="category-grid">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Reward list view
  const rewards = getRewardsByCategory(selectedCategory.id);
  const filteredRewards = showAffordableOnly
    ? rewards.filter(r => r.costCoins <= balance)
    : rewards;

  return (
    <div className="reward-store">
      <header className="store-header">
        <button className="back-button" onClick={() => setSelectedCategory(null)}>
          ← Back
        </button>
        <h1>{selectedCategory.icon} {selectedCategory.name}</h1>
      </header>

      <div className="balance-display">
        Balance: {balance.toLocaleString()} coins
      </div>

      <div className="filter-toggle">
        <button
          className={`filter-button ${showAffordableOnly ? 'active' : ''}`}
          onClick={() => setShowAffordableOnly(!showAffordableOnly)}
          aria-pressed={showAffordableOnly}
        >
          {showAffordableOnly ? '🟢' : '⚪'} I can afford now 
          ({rewards.filter(r => r.costCoins <= balance).length})
        </button>
      </div>

      <div className="reward-list">
        {filteredRewards.map(reward => (
          <RewardCard
            key={reward.rewardId}
            reward={reward}
            userBalance={balance}
            onClick={() => setSelectedReward(reward)}
          />
        ))}
      </div>

      {selectedReward && (
        <RedemptionModal
          reward={selectedReward}
          userBalance={balance}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </div>
  );
}
```

---

## API Endpoints

### Coin Management

```
POST /api/coins/award
Body: { userId, amount, source, metadata }
Response: { success, coinsAwarded, newBalance, message }

GET /api/coins/balance/:userId
Response: { balance, coinsEarnedToday, dailyCapRemaining }

GET /api/coins/history/:userId?days=7
Response: { transactions: [...], summary: {...} }
```

### Redemption

```
POST /api/rewards/redeem
Body: { userId, rewardId }
Response: { success, redemptionId, newBalance, fulfillment }

GET /api/rewards/catalog
Query: ?category=health-wellness&affordable=true&userId=xxx
Response: { rewards: [...] }

GET /api/rewards/my-redemptions/:userId
Response: { active: [...], expired: [...] }

POST /api/rewards/use/:redemptionId
Body: { usageLocation, userFeedback }
Response: { success }
```

---

## Security Considerations

### Rate Limiting
```javascript
// Prevent abuse of coin earning
app.use('/api/coins/award', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 coin awards per minute per user
  keyGenerator: (req) => req.body.userId
}));
```

### Transaction Integrity
```javascript
// Use Firestore transactions for coin operations
async function awardCoinsTransaction(userId, amount) {
  const userRef = db.collection('users').doc(userId);
  
  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentBalance = userDoc.data().coins.totalBalance;
    const newBalance = currentBalance + amount;
    
    transaction.update(userRef, {
      'coins.totalBalance': newBalance,
      'coins.lifetimeEarned': admin.firestore.FieldValue.increment(amount)
    });
    
    return newBalance;
  });
}
```

### Validation
```javascript
// Validate all coin operations server-side
function validateCoinAward(source, amount, metadata) {
  const validSources = [
    'session_start', 'set_complete', 'session_complete',
    'rest_day', 'streak_bonus', 'safe_movement', 'daily_checkin'
  ];
  
  if (!validSources.includes(source)) {
    throw new Error('Invalid coin source');
  }
  
  if (amount < 0 || amount > 200) {
    throw new Error('Invalid coin amount');
  }
  
  // Additional validation based on source
  if (source === 'set_complete' && (!metadata.sessionId || !metadata.setNumber)) {
    throw new Error('Missing required metadata for set completion');
  }
}
```

---

## Testing Strategy

### Unit Tests
```javascript
describe('CoinService', () => {
  test('awards coins correctly', async () => {
    const result = await coinService.awardCoins('user123', 20, 'set_complete');
    expect(result.success).toBe(true);
    expect(result.coinsAwarded).toBe(20);
  });

  test('enforces daily cap', async () => {
    // Award coins up to cap
    for (let i = 0; i < 10; i++) {
      await coinService.awardCoins('user123', 20, 'exercise_set_complete');
    }
    
    // Next award should fail
    const result = await coinService.awardCoins('user123', 20, 'exercise_set_complete');
    expect(result.success).toBe(false);
    expect(result.reason).toBe('daily_cap_reached');
  });

  test('calculates streak correctly with grace period', async () => {
    // Test 1-day gap (should continue)
    // Test 3-day gap (should continue with grace)
    // Test 4-day gap (should reset)
  });
});
```

### Integration Tests
```javascript
describe('Redemption Flow', () => {
  test('complete redemption process', async () => {
    // 1. User earns coins
    await coinService.awardCoins('user123', 600, 'session_complete');
    
    // 2. User redeems reward
    const redemption = await redemptionService.redeemReward('user123', 'HW-002');
    expect(redemption.success).toBe(true);
    expect(redemption.fulfillment.voucherCode).toBeDefined();
    
    // 3. Verify coins deducted
    const balance = await coinService.getBalance('user123');
    expect(balance).toBe(0);
    
    // 4. Verify email sent
    expect(emailService.sendRedemptionConfirmation).toHaveBeenCalled();
  });
});
```

---

## Deployment Checklist

- [ ] Database indexes created (userId, redemptionId, rewardId)
- [ ] Environment variables configured (API keys, partner credentials)
- [ ] Rate limiting enabled on all endpoints
- [ ] Email service configured and tested
- [ ] Partner webhooks tested
- [ ] Backup strategy implemented (daily snapshots)
- [ ] Monitoring alerts configured (failed redemptions, low inventory)
- [ ] GDPR compliance verified (data export, deletion)
- [ ] Accessibility audit passed (WCAG AAA)
- [ ] Load testing completed (1000 concurrent users)
- [ ] Security audit passed (penetration testing)
- [ ] Analytics tracking implemented (redemption funnel)
- [ ] User documentation published
- [ ] Support team trained on redemption issues

---

**This implementation guide provides the technical foundation for a production-ready reward system that is secure, scalable, and maintainable.**
