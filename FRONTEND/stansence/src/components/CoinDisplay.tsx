"use client";

import { useEffect, useState } from 'react';
import './CoinDisplay.css';

interface CoinDisplayProps {
  compact?: boolean;
  onClick?: () => void;
}

export function CoinDisplay({ compact = false, onClick }: CoinDisplayProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load coin balance from localStorage
    const loadBalance = () => {
      try {
        const stored = localStorage.getItem('stancesense_coins');
        if (stored) {
          const data = JSON.parse(stored);
          setBalance(data.totalBalance || 0);
        }
      } catch (error) {
        console.error('Error loading coin balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();

    // Listen for coin updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stancesense_coins') {
        loadBalance();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    const handleCoinUpdate = () => loadBalance();
    window.addEventListener('coinsUpdated', handleCoinUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('coinsUpdated', handleCoinUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className={`coin-display ${compact ? 'compact' : ''}`}>
        <div className="skeleton">Loading...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="coin-display-compact"
        aria-label={`Your current balance is ${balance} wellness coins`}
      >
        <span className="coin-icon">🪙</span>
        <span className="coin-amount">{balance.toLocaleString()}</span>
      </button>
    );
  }

  return (
    <div 
      className={`coin-display-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      aria-label={`Your current balance is ${balance} wellness coins`}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="coin-header">Your Wellness Coins</div>
      <div className="coin-balance">
        <span className="coin-icon-large">🪙</span>
        <span className="coin-amount-large">{balance.toLocaleString()}</span>
        <span className="coin-label">coins</span>
      </div>
      {onClick && (
        <button className="coin-store-button">
          View Reward Store →
        </button>
      )}
    </div>
  );
}
