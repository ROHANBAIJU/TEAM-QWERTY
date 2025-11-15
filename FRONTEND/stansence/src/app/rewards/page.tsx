"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CoinDisplay } from '@/components/CoinDisplay';

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
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: '🏥',
    description: 'Professional care and therapeutic services',
    color: '#14b8a6',
    rewardCount: 15
  },
  {
    id: 'daily-ease',
    name: 'Daily Ease',
    icon: '🛒',
    description: 'Convenient services for everyday tasks',
    color: '#f59e0b',
    rewardCount: 12
  },
  {
    id: 'relax-restore',
    name: 'Relax & Restore',
    icon: '🧘',
    description: 'Mindfulness, rest, and relaxation',
    color: '#a78bfa',
    rewardCount: 18
  },
  {
    id: 'learn-explore',
    name: 'Learn & Explore',
    icon: '📚',
    description: 'Educational content and experiences',
    color: '#fb923c',
    rewardCount: 13
  },
  {
    id: 'your-space',
    name: 'Your Space',
    icon: '🎨',
    description: 'Personalize your app experience',
    color: '#34d399',
    rewardCount: 15
  }
];

export default function RewardStorePage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const loadBalance = () => {
      try {
        const stored = localStorage.getItem('stancesense_coins');
        if (stored) {
          const data = JSON.parse(stored);
          setBalance(data.totalBalance || 0);
        }
      } catch (error) {
        console.error('Error loading balance:', error);
      }
    };

    loadBalance();
    const handleUpdate = () => loadBalance();
    window.addEventListener('coinsUpdated', handleUpdate);
    return () => window.removeEventListener('coinsUpdated', handleUpdate);
  }, []);

  return (
    <div className="reward-store-page">
      <header className="store-header">
        <button 
          onClick={() => router.back()} 
          className="back-button"
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1>Reward Store</h1>
        <button 
          onClick={() => router.push('/my-rewards')}
          className="my-rewards-button"
          aria-label="View my redeemed rewards"
        >
          My Rewards →
        </button>
      </header>

      <div className="balance-section">
        <div className="balance-card">
          <div className="balance-label">Your Balance</div>
          <div className="balance-amount">{balance.toLocaleString()} coins</div>
        </div>
      </div>

      <div className="categories-section">
        <h2 className="section-heading">Choose a category</h2>
        
        <div className="category-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className="category-card"
              onClick={() => router.push(`/rewards/${category.id}`)}
              style={{
                borderColor: `${category.color}33`,
                backgroundColor: `${category.color}0d`
              }}
              aria-label={`${category.name}, ${category.rewardCount} rewards available`}
            >
              <div className="category-icon" style={{ fontSize: '4rem' }}>
                {category.icon}
              </div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">{category.description}</p>
              <div className="category-count">{category.rewardCount} rewards</div>
            </button>
          ))}
        </div>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>How It Works</h3>
          <ul>
            <li>Complete exercise sessions to earn coins</li>
            <li>Browse rewards that support your wellness</li>
            <li>Redeem coins for meaningful rewards</li>
            <li>All rewards support your health journey</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .reward-store-page {
          min-height: 100vh;
          height: 100vh;
          overflow: auto;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 2rem;
        }

        .store-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .back-button {
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 80px;
          min-height: 60px;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(-4px);
        }

        .my-rewards-button {
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          background: rgba(74, 144, 226, 0.2);
          border: 2px solid rgba(74, 144, 226, 0.5);
          border-radius: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-left: auto;
        }

        .my-rewards-button:hover {
          background: rgba(74, 144, 226, 0.3);
          transform: translateX(4px);
        }

        .store-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
        }

        .balance-section {
          margin-bottom: 2.5rem;
        }

        .balance-card {
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 1rem;
          padding: 1.5rem;
          text-align: center;
          max-width: 400px;
        }

        .balance-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .balance-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #10b981;
        }

        .categories-section {
          margin-bottom: 3rem;
        }

        .section-heading {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .category-card {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid;
          border-radius: 1.25rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .category-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .category-card:focus {
          outline: 4px solid #10b981;
          outline-offset: 2px;
        }

        .category-icon {
          margin-bottom: 0.5rem;
        }

        .category-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .category-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.4;
        }

        .category-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.5rem;
        }

        .info-section {
          max-width: 600px;
          margin: 0 auto;
        }

        .info-card {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .info-card h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: #60a5fa;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-card li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .info-card li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .reward-store-page {
            padding: 1rem;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }

          .store-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
