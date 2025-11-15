/**
 * Coin Management Service
 * Handles all coin earning, spending, and tracking operations
 */

export interface CoinTransaction {
  id: string;
  timestamp: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;
  metadata?: Record<string, any>;
  balanceAfter: number;
}

export interface CoinData {
  totalBalance: number;
  lifetimeEarned: number;
  coinsEarnedToday: number;
  lastDailyReset: string;
  transactions: CoinTransaction[];
}

export class CoinService {
  private static DAILY_CAP = 200;
  private static STORAGE_KEY = 'stancesense_coins';
  private static TRANSACTION_KEY = 'stancesense_transactions';

  static initializeCoins(): CoinData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const initial: CoinData = {
      totalBalance: 0,
      lifetimeEarned: 0,
      coinsEarnedToday: 0,
      lastDailyReset: new Date().toISOString(),
      transactions: []
    };

    this.saveCoins(initial);
    return initial;
  }

  static saveCoins(data: CoinData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    // Dispatch event for cross-component updates
    window.dispatchEvent(new Event('coinsUpdated'));
  }

  static checkAndResetDaily(): void {
    const data = this.initializeCoins();
    const now = new Date();
    const lastReset = new Date(data.lastDailyReset);

    if (now.toDateString() !== lastReset.toDateString()) {
      data.coinsEarnedToday = 0;
      data.lastDailyReset = now.toISOString();
      this.saveCoins(data);
    }
  }

  static awardCoins(
    amount: number,
    source: string,
    metadata?: Record<string, any>
  ): { success: boolean; coinsAwarded: number; newBalance: number; message: string; reason?: string } {
    this.checkAndResetDaily();
    const data = this.initializeCoins();

    // Check daily cap for exercise activities
    if (source.startsWith('exercise_') && data.coinsEarnedToday >= this.DAILY_CAP) {
      return {
        success: false,
        coinsAwarded: 0,
        newBalance: data.totalBalance,
        message: "You've done excellent work today. Time to rest.",
        reason: 'daily_cap_reached'
      };
    }

    // Award coins
    const newBalance = data.totalBalance + amount;
    const newDailyTotal = source.startsWith('exercise_')
      ? data.coinsEarnedToday + amount
      : data.coinsEarnedToday;

    // Create transaction
    const transaction: CoinTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'earn',
      amount,
      source,
      metadata,
      balanceAfter: newBalance
    };

    // Update data
    data.totalBalance = newBalance;
    data.lifetimeEarned += amount;
    data.coinsEarnedToday = newDailyTotal;
    data.transactions.unshift(transaction);

    // Keep only last 100 transactions
    if (data.transactions.length > 100) {
      data.transactions = data.transactions.slice(0, 100);
    }

    this.saveCoins(data);

    return {
      success: true,
      coinsAwarded: amount,
      newBalance,
      message: this.getEarningMessage(source)
    };
  }

  static spendCoins(
    amount: number,
    rewardId: string,
    rewardName: string
  ): { success: boolean; coinsSpent: number; newBalance: number; reason?: string } {
    const data = this.initializeCoins();

    if (data.totalBalance < amount) {
      return {
        success: false,
        coinsSpent: 0,
        newBalance: data.totalBalance,
        reason: 'insufficient_balance'
      };
    }

    const newBalance = data.totalBalance - amount;

    // Create transaction
    const transaction: CoinTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'spend',
      amount,
      source: 'redemption',
      metadata: { rewardId, rewardName },
      balanceAfter: newBalance
    };

    data.totalBalance = newBalance;
    data.transactions.unshift(transaction);

    if (data.transactions.length > 100) {
      data.transactions = data.transactions.slice(0, 100);
    }

    this.saveCoins(data);

    return {
      success: true,
      coinsSpent: amount,
      newBalance
    };
  }

  static getBalance(): number {
    const data = this.initializeCoins();
    return data.totalBalance;
  }

  static getEarningPotential(): { earned: number; remaining: number; cap: number } {
    this.checkAndResetDaily();
    const data = this.initializeCoins();
    return {
      earned: data.coinsEarnedToday,
      remaining: Math.max(0, this.DAILY_CAP - data.coinsEarnedToday),
      cap: this.DAILY_CAP
    };
  }

  static getTransactionHistory(days: number = 7): CoinTransaction[] {
    const data = this.initializeCoins();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return data.transactions.filter(t => 
      new Date(t.timestamp) >= cutoff
    );
  }

  private static getEarningMessage(source: string): string {
    const messages: Record<string, string> = {
      'exercise_session_start': 'You started—that\'s what matters.',
      'exercise_set_complete': 'Set complete.',
      'exercise_session_complete': 'Session complete. Well done.',
      'rest_day': 'Rest is part of training.',
      'streak_bonus': 'Consistent showing up.',
      'safe_movement': 'Controlled movement noticed.',
      'daily_checkin': 'Welcome back.',
      'weekly_milestone': 'Weekly consistency achieved.',
      'monthly_milestone': 'Monthly dedication recognized.'
    };
    return messages[source] || 'Coins earned.';
  }

  // Add welcome bonus for new users
  static addWelcomeBonus(): void {
    const data = this.initializeCoins();
    if (data.lifetimeEarned === 0) {
      this.awardCoins(50, 'welcome_bonus', { description: 'Welcome to StanceSense' });
    }
  }
}
