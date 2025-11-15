'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CoinService } from '@/services/coinService';

// Reward categories and items
const REWARD_CATEGORIES = {
  health: {
    title: 'Health & Wellness',
    description: 'Evidence-based resources for PD management',
    icon: '🏥',
    items: [
      { id: 'stancesense-hoodie', name: 'StanceSense Premium Hoodie', cost: 180, description: 'Comfortable branded hoodie', type: '👕 Merchandise' },
      { id: 'stancesense-waterbottle', name: 'StanceSense Water Bottle', cost: 80, description: 'Insulated stainless steel bottle', type: '👕 Merchandise' },
      { id: 'amazon-giftcard', name: '$25 Amazon Gift Card', cost: 125, description: 'Shop health products online', type: '🎁 Gift Card' },
      { id: 'walmart-giftcard', name: '$30 Walmart Gift Card', cost: 150, description: 'In-store or online shopping', type: '🎁 Gift Card' },
      { id: 'target-giftcard', name: '$25 Target Gift Card', cost: 125, description: 'Everyday essentials', type: '🎁 Gift Card' }
    ]
  },
  daily: {
    title: 'Daily Ease',
    description: 'Practical tools and adaptive strategies',
    icon: '🛠️',
    items: [
      { id: 'stancesense-tshirt', name: 'StanceSense T-Shirt', cost: 120, description: 'Soft cotton branded tee', type: '👕 Merchandise' },
      { id: 'stancesense-cap', name: 'StanceSense Baseball Cap', cost: 90, description: 'Adjustable branded cap', type: '👕 Merchandise' },
      { id: 'grocery-card', name: '$25 Grocery Gift Card', cost: 125, description: 'For grocery delivery or in-store', type: '🎁 Gift Card' },
      { id: 'doordash-card', name: '$30 DoorDash Gift Card', cost: 150, description: 'Food delivery service', type: '🎁 Gift Card' },
      { id: 'uber-card', name: '$25 Uber Gift Card', cost: 125, description: 'Rides or Uber Eats', type: '🎁 Gift Card' }
    ]
  },
  relax: {
    title: 'Relax & Restore',
    description: 'Comfort and stress reduction',
    icon: '🌿',
    items: [
      { id: 'comfort-hoodie', name: 'Premium Comfort Hoodie', cost: 180, description: 'Ultra-soft relaxation hoodie', type: '👕 Merchandise' },
      { id: 'tumbler', name: 'Insulated Tumbler', cost: 70, description: 'Keep drinks hot or cold', type: '👕 Merchandise' },
      { id: 'spa-voucher', name: '$50 Spa Gift Card', cost: 250, description: 'Redeemable at partner spas', type: '🎁 Gift Card' },
      { id: 'starbucks-card', name: '$20 Starbucks Gift Card', cost: 100, description: 'Coffee and treats', type: '🎁 Gift Card' },
      { id: 'spotify-card', name: '$30 Spotify Gift Card', cost: 150, description: 'Premium music streaming', type: '🎁 Gift Card' }
    ]
  },
  learn: {
    title: 'Learn & Connect',
    description: 'Education and community engagement',
    icon: '📚',
    items: [
      { id: 'backpack', name: 'StanceSense Backpack', cost: 160, description: 'Durable branded backpack', type: '👕 Merchandise' },
      { id: 'notebook-set', name: 'Premium Notebook Set', cost: 65, description: 'StanceSense branded notebooks', type: '👕 Merchandise' },
      { id: 'book-voucher', name: '$30 Barnes & Noble Gift Card', cost: 150, description: 'Choose your own books', type: '🎁 Gift Card' },
      { id: 'audible-card', name: '$25 Audible Gift Card', cost: 125, description: 'Audiobooks subscription', type: '🎁 Gift Card' },
      { id: 'kindle-card', name: '$30 Kindle Gift Card', cost: 150, description: 'Digital books', type: '🎁 Gift Card' }
    ]
  },
  space: {
    title: 'Your Space',
    description: 'Personalize your environment',
    icon: '🏡',
    items: [
      { id: 'throw-blanket', name: 'StanceSense Throw Blanket', cost: 140, description: 'Cozy branded blanket', type: '👕 Merchandise' },
      { id: 'mug-set', name: 'Coffee Mug Set', cost: 75, description: 'StanceSense branded mugs', type: '👕 Merchandise' },
      { id: 'home-depot-card', name: '$50 Home Depot Gift Card', cost: 250, description: 'Home improvement projects', type: '🎁 Gift Card' },
      { id: 'ikea-card', name: '$40 IKEA Gift Card', cost: 200, description: 'Furniture and decor', type: '🎁 Gift Card' },
      { id: 'wayfair-card', name: '$35 Wayfair Gift Card', cost: 175, description: 'Online home furnishings', type: '🎁 Gift Card' }
    ]
  }
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const category = REWARD_CATEGORIES[categoryId as keyof typeof REWARD_CATEGORIES];
  
  const [balance, setBalance] = useState(0);
  const [filter, setFilter] = useState<'all' | 'affordable'>('all');

  useEffect(() => {
    setBalance(CoinService.getBalance());
  }, []);

  if (!category) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Category Not Found</h1>
        <button onClick={() => router.push('/rewards')} style={styles.backButton}>
          ← Back to Rewards
        </button>
      </div>
    );
  }

  const filteredItems = filter === 'affordable' 
    ? category.items.filter(item => item.cost <= balance)
    : category.items;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push('/rewards')} style={styles.backButton}>
          ← Back to Rewards
        </button>
        <div style={styles.headerContent}>
          <span style={styles.categoryIcon}>{category.icon}</span>
          <div>
            <h1 style={styles.title}>{category.title}</h1>
            <p style={styles.description}>{category.description}</p>
          </div>
        </div>
        <div style={styles.balanceDisplay}>
          Your Balance: <strong>{balance} coins</strong>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={styles.filterBar}>
        <button 
          onClick={() => setFilter('all')}
          style={filter === 'all' ? styles.filterButtonActive : styles.filterButton}
        >
          All Items ({category.items.length})
        </button>
        <button 
          onClick={() => setFilter('affordable')}
          style={filter === 'affordable' ? styles.filterButtonActive : styles.filterButton}
        >
          What I Can Afford ({category.items.filter(i => i.cost <= balance).length})
        </button>
      </div>

      {/* Reward Grid */}
      <div style={styles.grid}>
        {filteredItems.map(item => {
          const canAfford = item.cost <= balance;
          
          // Get image path for merchandise items
          const getItemImage = (id: string) => {
            if (id.includes('hoodie')) return '/icons/hoodie.png';
            if (id.includes('waterbottle') || id.includes('bottle')) return '/icons/bottle.png';
            return null;
          };
          
          const imagePath = getItemImage(item.id);
          
          return (
            <div 
              key={item.id} 
              style={canAfford ? styles.rewardCard : styles.rewardCardDisabled}
              onClick={() => canAfford && router.push(`/rewards/${categoryId}/${item.id}`)}
            >
              <div style={styles.rewardType}>{item.type}</div>
              {imagePath && (
                <div style={styles.imageContainer}>
                  <Image src={imagePath} alt={item.name} width={120} height={120} style={styles.itemImage} />
                </div>
              )}
              <h3 style={styles.rewardName}>{item.name}</h3>
              <p style={styles.rewardDescription}>{item.description}</p>
              <div style={styles.rewardFooter}>
                <span style={styles.costBadge}>
                  {item.cost} coins
                </span>
                {!canAfford && (
                  <span style={styles.needMore}>
                    Need {item.cost - balance} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={styles.emptyState}>
          <p>No affordable items right now.</p>
          <p>Keep exercising to earn more coins!</p>
          <button onClick={() => router.push('/games')} style={styles.playButton}>
            Play Exercise Games
          </button>
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
    maxWidth: '1200px',
    margin: '0 auto 2rem',
  } as React.CSSProperties,
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    transition: 'all 0.3s',
  } as React.CSSProperties,
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  categoryIcon: {
    fontSize: '4rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: 'white',
  } as React.CSSProperties,
  description: {
    fontSize: '1.2rem',
    color: '#cbd5e1',
    margin: 0,
  } as React.CSSProperties,
  balanceDisplay: {
    padding: '1.25rem 1.5rem',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    fontSize: '1.2rem',
    color: '#10b981',
    fontWeight: 'bold',
  } as React.CSSProperties,
  filterBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem',
  } as React.CSSProperties,
  filterButton: {
    padding: '1rem 2rem',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#cbd5e1',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
  } as React.CSSProperties,
  filterButtonActive: {
    padding: '1rem 2rem',
    border: '2px solid #a78bfa',
    background: 'rgba(167, 139, 250, 0.2)',
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  rewardCard: {
    padding: '2rem',
    border: '2px solid rgba(167, 139, 250, 0.5)',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    position: 'relative' as const,
  } as React.CSSProperties,
  rewardCardDisabled: {
    padding: '2rem',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    opacity: 0.5,
    cursor: 'not-allowed',
    position: 'relative' as const,
  } as React.CSSProperties,
  rewardType: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '20px',
    fontSize: '0.85rem',
    color: '#10b981',
    fontWeight: '600',
    marginBottom: '1rem',
  } as React.CSSProperties,
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1.5rem',
    marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
  } as React.CSSProperties,
  itemImage: {
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain' as const,
  } as React.CSSProperties,
  rewardName: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    margin: '0 0 1rem 0',
    color: 'white',
  } as React.CSSProperties,
  rewardDescription: {
    fontSize: '1rem',
    color: '#cbd5e1',
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  } as React.CSSProperties,
  rewardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  } as React.CSSProperties,
  costBadge: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    color: 'white',
    borderRadius: '25px',
    fontWeight: 'bold',
    fontSize: '1rem',
  } as React.CSSProperties,
  needMore: {
    fontSize: '0.9rem',
    color: '#fca5a5',
    fontWeight: '600',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#cbd5e1',
    maxWidth: '600px',
    margin: '0 auto',
  } as React.CSSProperties,
  playButton: {
    marginTop: '2rem',
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  } as React.CSSProperties,
};
