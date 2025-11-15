'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CoinService } from '@/services/coinService';

interface Redemption {
  id: string;
  name: string;
  cost: number;
  date: string;
  fulfillment: string;
}

interface Transaction {
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  timestamp: string;
}

export default function MyRewardsPage() {
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<'redemptions' | 'history'>('redemptions');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Load balance
    setBalance(CoinService.getBalance());

    // Load redemptions
    const stored = localStorage.getItem('stancesense_redemptions');
    if (stored) {
      setRedemptions(JSON.parse(stored));
    }

    // Load transaction history
    const coinData = localStorage.getItem('stancesense_coins');
    if (coinData) {
      const data = JSON.parse(coinData);
      setTransactions(data.transactions || []);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Rewards</h1>
        <div style={styles.balanceCard}>
          <span style={styles.balanceLabel}>Current Balance</span>
          <span style={styles.balanceAmount}>{balance} coins</span>
        </div>
      </div>

      {/* View Toggle */}
      <div style={styles.viewToggle}>
        <button
          onClick={() => setView('redemptions')}
          style={view === 'redemptions' ? styles.tabActive : styles.tab}
        >
          Redeemed Items ({redemptions.length})
        </button>
        <button
          onClick={() => setView('history')}
          style={view === 'history' ? styles.tabActive : styles.tab}
        >
          Transaction History ({transactions.length})
        </button>
      </div>

      {/* Redemptions View */}
      {view === 'redemptions' && (
        <div style={styles.content}>
          {redemptions.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>You haven't redeemed any rewards yet.</p>
              <button 
                onClick={() => router.push('/rewards')}
                style={styles.browseButton}
              >
                Browse Rewards
              </button>
            </div>
          ) : (
            <div style={styles.redemptionsList}>
              {redemptions.map((redemption, idx) => (
                <div key={idx} style={styles.redemptionCard}>
                  <div style={styles.redemptionHeader}>
                    <h3 style={styles.redemptionName}>{redemption.name}</h3>
                    <span style={styles.redemptionCost}>{redemption.cost} coins</span>
                  </div>
                  <div style={styles.redemptionDate}>
                    Redeemed: {formatDate(redemption.date)}
                  </div>
                  <div style={styles.fulfillmentInfo}>
                    <strong>Status:</strong> {redemption.fulfillment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div style={styles.content}>
          {transactions.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No transactions yet.</p>
              <button 
                onClick={() => router.push('/games')}
                style={styles.browseButton}
              >
                Play Games to Earn Coins
              </button>
            </div>
          ) : (
            <div style={styles.transactionsList}>
              {transactions.slice().reverse().map((transaction, idx) => (
                <div key={idx} style={styles.transactionCard}>
                  <div style={styles.transactionIcon}>
                    {transaction.type === 'earn' ? '🟢' : '🔵'}
                  </div>
                  <div style={styles.transactionDetails}>
                    <div style={styles.transactionReason}>{transaction.reason}</div>
                    <div style={styles.transactionDate}>{formatDate(transaction.timestamp)}</div>
                  </div>
                  <div style={transaction.type === 'earn' ? styles.amountEarned : styles.amountSpent}>
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div style={styles.statsSection}>
        <h2 style={styles.statsTitle}>Your Stats</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{redemptions.length}</div>
            <div style={styles.statLabel}>Items Redeemed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>
              {redemptions.reduce((sum, r) => sum + r.cost, 0)}
            </div>
            <div style={styles.statLabel}>Coins Spent</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>
              {transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0)}
            </div>
            <div style={styles.statLabel}>Total Earned</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{balance}</div>
            <div style={styles.statLabel}>Current Balance</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button onClick={() => router.push('/rewards')} style={styles.actionButton}>
          Browse Rewards
        </button>
        <button onClick={() => router.push('/games')} style={styles.actionButtonSecondary}>
          Play Games
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1000px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: 0,
  } as React.CSSProperties,
  balanceCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    padding: '1rem 1.5rem',
    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
    borderRadius: '12px',
    color: 'white',
  } as React.CSSProperties,
  balanceLabel: {
    fontSize: '0.9rem',
    opacity: 0.9,
  } as React.CSSProperties,
  balanceAmount: {
    fontSize: '2rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  viewToggle: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #e0e0e0',
  } as React.CSSProperties,
  tab: {
    padding: '1rem 2rem',
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#666',
    borderBottom: '3px solid transparent',
  } as React.CSSProperties,
  tabActive: {
    padding: '1rem 2rem',
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#4a90e2',
    borderBottom: '3px solid #4a90e2',
  } as React.CSSProperties,
  content: {
    marginBottom: '3rem',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: '#f9f9f9',
    borderRadius: '12px',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  browseButton: {
    padding: '1rem 2rem',
    background: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  redemptionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  } as React.CSSProperties,
  redemptionCard: {
    padding: '1.5rem',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
  } as React.CSSProperties,
  redemptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  redemptionName: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    margin: 0,
  } as React.CSSProperties,
  redemptionCost: {
    padding: '0.5rem 1rem',
    background: '#e3f2fd',
    color: '#4a90e2',
    borderRadius: '20px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  redemptionDate: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '1rem',
  } as React.CSSProperties,
  fulfillmentInfo: {
    padding: '1rem',
    background: '#f0f7ff',
    borderRadius: '8px',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  transactionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  } as React.CSSProperties,
  transactionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  } as React.CSSProperties,
  transactionIcon: {
    fontSize: '1.5rem',
  } as React.CSSProperties,
  transactionDetails: {
    flex: 1,
  } as React.CSSProperties,
  transactionReason: {
    fontSize: '1rem',
    fontWeight: '500',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  transactionDate: {
    fontSize: '0.85rem',
    color: '#666',
  } as React.CSSProperties,
  amountEarned: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#4caf50',
  } as React.CSSProperties,
  amountSpent: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#2196f3',
  } as React.CSSProperties,
  statsSection: {
    marginBottom: '2rem',
    padding: '2rem',
    background: '#f9f9f9',
    borderRadius: '12px',
  } as React.CSSProperties,
  statsTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  statCard: {
    padding: '1.5rem',
    background: 'white',
    borderRadius: '8px',
    textAlign: 'center',
  } as React.CSSProperties,
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  actionButton: {
    padding: '1rem 2rem',
    background: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '200px',
  } as React.CSSProperties,
  actionButtonSecondary: {
    padding: '1rem 2rem',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '200px',
  } as React.CSSProperties,
};
