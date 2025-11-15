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
  { id: 'health', name: 'Health & Wellness', icon: '🏥', description: 'Evidence-based resources for PD management', color: '#14b8a6', rewardCount: 5 },
  { id: 'daily', name: 'Daily Ease', icon: '🛠️', description: 'Practical tools and adaptive strategies', color: '#f59e0b', rewardCount: 5 },
  { id: 'relax', name: 'Relax & Restore', icon: '🌿', description: 'Comfort and stress reduction', color: '#a78bfa', rewardCount: 5 },
  { id: 'learn', name: 'Learn & Connect', icon: '📚', description: 'Education and community engagement', color: '#fb923c', rewardCount: 5 },
  { id: 'space', name: 'Your Space', icon: '🏡', description: 'Personalize your environment', color: '#34d399', rewardCount: 5 }
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
    if (stored) setRedemptions(JSON.parse(stored));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>🎁 Rewards Center</h1>
          <p style={{ fontSize: '15px', color: '#cbd5e1', margin: 0 }}>
            Earn coins by exercising, redeem for meaningful rewards
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CoinDisplay onClick={() => setView('store')} />
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Today's Progress</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
              {earningPotential.earned} / 200 coins
            </div>
            {earningPotential.remaining > 0 && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {earningPotential.remaining} more available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '32px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => setView('store')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: view === 'store' ? '3px solid #a78bfa' : '3px solid transparent',
            color: view === 'store' ? 'white' : '#94a3b8',
            fontSize: '15px',
            fontWeight: view === 'store' ? '700' : '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🛍️ Reward Store
        </button>
        <button
          onClick={() => setView('myrewards')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: view === 'myrewards' ? '3px solid #a78bfa' : '3px solid transparent',
            color: view === 'myrewards' ? 'white' : '#94a3b8',
            fontSize: '15px',
            fontWeight: view === 'myrewards' ? '700' : '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📦 My Rewards ({redemptions.length})
        </button>
      </div>

      {/* Store View */}
      {view === 'store' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Browse by Category</h2>
            <p style={{ fontSize: '15px', color: '#cbd5e1', margin: 0 }}>Choose a category to explore available rewards</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '48px'
          }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => router.push(`/rewards/${category.id}`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{category.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: 'white' }}>
                  {category.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '16px', lineHeight: '1.5' }}>
                  {category.description}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '600' }}>
                    {category.rewardCount} rewards
                  </span>
                  <span style={{ fontSize: '24px', color: '#a78bfa' }}>→</span>
                </div>
              </button>
            ))}
          </div>

          {/* How It Works */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '20px',
            padding: '32px'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>How It Works</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px'
            }}>
              {[
                { icon: '💪', title: '1. Exercise', desc: 'Play exercise games to earn coins' },
                { icon: '🛍️', title: '2. Browse', desc: 'Explore rewards that support your wellness' },
                { icon: '🎁', title: '3. Redeem', desc: 'Exchange coins for meaningful rewards' }
              ].map((step) => (
                <div key={step.title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>{step.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{step.title}</div>
                  <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Rewards View */}
      {view === 'myrewards' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
          {redemptions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
              <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>No Rewards Yet</h3>
              <p style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '32px' }}>
                You haven't redeemed any rewards yet. Keep exercising to earn coins!
              </p>
              <button
                onClick={() => router.push('/games')}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
                }}
              >
                🎮 Play Exercise Games
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Your Redeemed Rewards</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {redemptions.map((redemption, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                        {redemption.name}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Redeemed on {formatDate(redemption.date)}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      color: '#a78bfa',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {redemption.cost} coins
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
