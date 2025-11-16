'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CoinDisplay } from '@/components/CoinDisplay';
import { CoinService } from '@/services/coinService';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  rewardCount: number;
}

const categories: Category[] = [
  {
    id: 'health',
    name: 'Health & Wellness',
    icon: '🏥',
    description: 'Evidence-based resources for PD management',
    color: '#14b8a6',
    rewardCount: 5
  },
  {
    id: 'daily',
    name: 'Daily Ease',
    icon: '🛠️',
    description: 'Practical tools and adaptive strategies',
    color: '#f59e0b',
    rewardCount: 5
  },
  {
    id: 'relax',
    name: 'Relax & Restore',
    icon: '🌿',
    description: 'Comfort and stress reduction',
    color: '#a78bfa',
    rewardCount: 5
  },
  {
    id: 'learn',
    name: 'Learn & Connect',
    icon: '📚',
    description: 'Education and community engagement',
    color: '#fb923c',
    rewardCount: 5
  },
  {
    id: 'space',
    name: 'Your Space',
    icon: '🏡',
    description: 'Personalize your environment',
    color: '#34d399',
    rewardCount: 5
  }
];

interface Redemption {
  id: string;
  name: string;
  cost: number;
  date: string;
}

export default function RewardsHubPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [view, setView] = useState<'store' | 'myrewards'>('store');
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [earningPotential, setEarningPotential] = useState({ earned: 0, remaining: 0 });

  useEffect(() => {
    // Initialize coins and add welcome bonus
    CoinService.addWelcomeBonus();
    loadBalance();
    loadRedemptions();
  }, []);

  const loadBalance = () => {
    setBalance(CoinService.getBalance());
    const potential = CoinService.getEarningPotential();
    setEarningPotential(potential);
  };

  const loadRedemptions = () => {
    const stored = localStorage.getItem('stancesense_redemptions');
    if (stored) {
      setRedemptions(JSON.parse(stored));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      {/* Header with Coin Display */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🎁 Rewards Center</h1>
          <p style={styles.subtitle}>
            Earn coins by exercising, redeem them for meaningful rewards
          </p>
        </div>
        
        {/* Coin Display Card */}
        <div style={styles.coinSection}>
          <CoinDisplay onClick={() => setView('store')} />
          <div style={styles.earningInfo}>
            <span style={styles.earningLabel}>Today's Progress:</span>
            <span style={styles.earningValue}>
              {earningPotential.earned} / 200 coins earned
            </span>
            {earningPotential.remaining > 0 && (
              <span style={styles.earningRemaining}>
                ({earningPotential.remaining} more available)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={styles.viewToggle}>
        <button
          onClick={() => setView('store')}
          style={view === 'store' ? styles.tabActive : styles.tab}
        >
          🛍️ Reward Store
        </button>
        <button
          onClick={() => setView('myrewards')}
          style={view === 'myrewards' ? styles.tabActive : styles.tab}
        >
          📦 My Rewards ({redemptions.length})
        </button>
      </div>

      {/* Store View */}
      {view === 'store' && (
        <div style={styles.content}>
          <div style={styles.storeHeader}>
            <h2 style={styles.sectionTitle}>Browse by Category</h2>
            <p style={styles.sectionSubtitle}>
              Choose a category to explore available rewards
            </p>
          </div>

          <div style={styles.categoryGrid}>
            {categories.map((category) => (
              <button
                key={category.id}
                style={styles.categoryCard}
                onClick={() => router.push(`/rewards/${category.id}`)}
              >
                <div style={styles.categoryIcon}>{category.icon}</div>
                <h3 style={styles.categoryName}>{category.name}</h3>
                <p style={styles.categoryDescription}>{category.description}</p>
                <div style={styles.categoryFooter}>
                  <span style={styles.rewardCount}>{category.rewardCount} rewards</span>
                  <span style={styles.arrow}>→</span>
                </div>
              </button>
            ))}
          </div>

          {/* How It Works */}
          <div style={styles.infoSection}>
            <h3 style={styles.infoTitle}>How It Works</h3>
            <div style={styles.stepsGrid}>
              <div style={styles.step}>
                <div style={styles.stepIcon}>💪</div>
                <div style={styles.stepTitle}>1. Exercise</div>
                <div style={styles.stepDescription}>
                  Play exercise games to earn coins
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepIcon}>🛍️</div>
                <div style={styles.stepTitle}>2. Browse</div>
                <div style={styles.stepDescription}>
                  Explore rewards that support your wellness
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepIcon}>🎁</div>
                <div style={styles.stepTitle}>3. Redeem</div>
                <div style={styles.stepDescription}>
                  Exchange coins for meaningful rewards
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Rewards View */}
      {view === 'myrewards' && (
        <div style={styles.content}>
          {redemptions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📦</div>
              <h3 style={styles.emptyTitle}>No Rewards Yet</h3>
              <p style={styles.emptyText}>
                You haven't redeemed any rewards yet. Keep exercising to earn coins!
              </p>
              <button 
                onClick={() => router.push('/games')}
                style={styles.playGamesButton}
              >
                🎮 Play Exercise Games
              </button>
            </div>
          ) : (
            <div style={styles.redemptionsList}>
              <h2 style={styles.sectionTitle}>Your Redeemed Rewards</h2>
              {redemptions.map((redemption, idx) => (
                <div key={idx} style={styles.redemptionCard}>
                  <div style={styles.redemptionHeader}>
                    <h3 style={styles.redemptionName}>{redemption.name}</h3>
                    <span style={styles.redemptionCost}>{redemption.cost} coins</span>
                  </div>
                  <div style={styles.redemptionDate}>
                    Redeemed on {formatDate(redemption.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    height: '100vh',
    overflow: 'auto',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: 'white',
    padding: '2rem',
  } as React.CSSProperties,
  header: {
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '2rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  headerContent: {
    flex: '1',
    minWidth: '300px',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    margin: 0,
  } as React.CSSProperties,
  coinSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  } as React.CSSProperties,
  earningInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    fontSize: '0.9rem',
    color: '#cbd5e1',
  } as React.CSSProperties,
  earningLabel: {
    color: '#94a3b8',
  } as React.CSSProperties,
  earningValue: {
    fontWeight: 'bold',
    color: '#10b981',
  } as React.CSSProperties,
  earningRemaining: {
    fontSize: '0.85rem',
    color: '#64748b',
  } as React.CSSProperties,
  viewToggle: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
  } as React.CSSProperties,
  tab: {
    padding: '1rem 2rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1rem',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s',
  } as React.CSSProperties,
  tabActive: {
    padding: '1rem 2rem',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderBottom: '3px solid #a78bfa',
  } as React.CSSProperties,
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  storeHeader: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  sectionSubtitle: {
    fontSize: '1rem',
    color: '#cbd5e1',
    margin: 0,
  } as React.CSSProperties,
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  } as React.CSSProperties,
  categoryCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '2rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left' as const,
  } as React.CSSProperties,
  categoryIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  categoryName: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: 'white',
  } as React.CSSProperties,
  categoryDescription: {
    fontSize: '0.95rem',
    color: '#cbd5e1',
    marginBottom: '1rem',
    lineHeight: '1.5',
  } as React.CSSProperties,
  categoryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  } as React.CSSProperties,
  rewardCount: {
    fontSize: '0.9rem',
    color: '#a78bfa',
    fontWeight: 'bold',
  } as React.CSSProperties,
  arrow: {
    fontSize: '1.5rem',
    color: '#a78bfa',
  } as React.CSSProperties,
  infoSection: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '16px',
    padding: '2rem',
  } as React.CSSProperties,
  infoTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
  } as React.CSSProperties,
  step: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  stepIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  stepTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  stepDescription: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  emptyTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    marginBottom: '2rem',
  } as React.CSSProperties,
  playGamesButton: {
    padding: '1rem 2rem',
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  } as React.CSSProperties,
  redemptionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  } as React.CSSProperties,
  redemptionCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
  } as React.CSSProperties,
  redemptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    gap: '1rem',
  } as React.CSSProperties,
  redemptionName: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    margin: 0,
    flex: 1,
  } as React.CSSProperties,
  redemptionCost: {
    padding: '0.5rem 1rem',
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    borderRadius: '20px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  redemptionDate: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  } as React.CSSProperties,
};
