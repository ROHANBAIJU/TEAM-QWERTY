'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CoinService } from '@/services/coinService';

// Import reward data (simplified - would be from database in production)
const REWARD_DATA: Record<string, any> = {
  // Health & Wellness
  'exercise-video': { 
    name: 'Guided Exercise Video', 
    cost: 50, 
    category: 'health',
    categoryName: 'Health & Wellness',
    description: 'Professional-led exercise routine designed specifically for people with Parkinson\'s Disease.',
    details: [
      '30-minute guided session',
      'Focus on balance and flexibility',
      'Low-impact movements',
      'Can be done at home',
      'Lifetime access'
    ],
    fulfillment: 'Video link will be emailed within 24 hours'
  },
  'nutrition-guide': {
    name: 'PD Nutrition Guide',
    cost: 75,
    category: 'health',
    categoryName: 'Health & Wellness',
    description: 'Comprehensive guide to nutrition strategies that support Parkinson\'s management.',
    details: [
      '40-page PDF guide',
      'Evidence-based recommendations',
      'Meal planning templates',
      'Protein timing strategies',
      'Supplement guidance'
    ],
    fulfillment: 'PDF will be available immediately after redemption'
  },
  // Daily Ease
  'button-hook': {
    name: 'Adaptive Button Hook',
    cost: 100,
    category: 'daily',
    categoryName: 'Daily Ease',
    description: 'Ergonomic tool that makes buttoning shirts and jackets significantly easier.',
    details: [
      'Non-slip grip handle',
      'Works with all button sizes',
      'Durable construction',
      'Compact for travel',
      'Easy to use'
    ],
    fulfillment: 'Ships within 3-5 business days to your address on file'
  },
  'jar-opener': {
    name: 'Easy-Grip Jar Opener',
    cost: 80,
    category: 'daily',
    categoryName: 'Daily Ease',
    description: 'Multi-size jar opener that requires minimal hand strength to operate.',
    details: [
      'Works on jars up to 4 inches',
      'Non-slip grip pads',
      'Wall-mountable option',
      'Dishwasher safe',
      'Reduces hand strain'
    ],
    fulfillment: 'Ships within 3-5 business days'
  },
  // Add more items as needed...
};

export default function RewardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { categoryId, rewardId } = params as { categoryId: string; rewardId: string };
  
  const [balance, setBalance] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const reward = REWARD_DATA[rewardId];

  useEffect(() => {
    setBalance(CoinService.getBalance());
  }, []);

  if (!reward) {
    return (
      <div style={styles.container}>
        <h1>Reward Not Found</h1>
        <button onClick={() => router.push('/rewards')} style={styles.backButton}>
          ← Back to Rewards
        </button>
      </div>
    );
  }

  const canAfford = balance >= reward.cost;

  const handleRedeem = () => {
    if (!canAfford) return;
    setShowConfirmation(true);
  };

  const confirmRedemption = () => {
    setRedeeming(true);
    
    // Simulate processing
    setTimeout(() => {
      const result = CoinService.spendCoins(reward.cost, rewardId, reward.name);
      
      if (result.success) {
        setBalance(result.newBalance);
        setRedeeming(false);
        setRedeemed(true);
        
        // Store redemption
        const redemptions = JSON.parse(localStorage.getItem('stancesense_redemptions') || '[]');
        redemptions.push({
          id: rewardId,
          name: reward.name,
          cost: reward.cost,
          date: new Date().toISOString(),
          fulfillment: reward.fulfillment
        });
        localStorage.setItem('stancesense_redemptions', JSON.stringify(redemptions));
      }
    }, 1500);
  };

  if (redeemed) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Redeemed Successfully!</h1>
          <p style={styles.successMessage}>{reward.name}</p>
          <div style={styles.fulfillmentBox}>
            <strong>Next Steps:</strong>
            <p>{reward.fulfillment}</p>
          </div>
          <div style={styles.newBalance}>
            Your new balance: <strong>{balance} coins</strong>
          </div>
          <div style={styles.actionButtons}>
            <button onClick={() => router.push('/rewards')} style={styles.primaryButton}>
              Browse More Rewards
            </button>
            <button onClick={() => router.push('/games')} style={styles.secondaryButton}>
              Earn More Coins
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <button 
        onClick={() => router.push(`/rewards/${categoryId}`)} 
        style={styles.backButton}
      >
        ← Back to {reward.categoryName}
      </button>

      {/* Reward Details */}
      <div style={styles.detailCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>{reward.name}</h1>
          <div style={styles.costBadge}>{reward.cost} coins</div>
        </div>

        <p style={styles.description}>{reward.description}</p>

        <div style={styles.detailsSection}>
          <h2 style={styles.sectionTitle}>What's Included:</h2>
          <ul style={styles.detailsList}>
            {reward.details.map((detail: string, idx: number) => (
              <li key={idx} style={styles.detailItem}>{detail}</li>
            ))}
          </ul>
        </div>

        <div style={styles.fulfillmentSection}>
          <h3 style={styles.sectionTitle}>How You'll Receive It:</h3>
          <p style={styles.fulfillmentText}>{reward.fulfillment}</p>
        </div>

        {/* Balance & Action */}
        <div style={styles.actionSection}>
          <div style={styles.balanceInfo}>
            <span>Your Balance:</span>
            <strong>{balance} coins</strong>
          </div>

          {canAfford ? (
            <button onClick={handleRedeem} style={styles.redeemButton}>
              Redeem for {reward.cost} Coins
            </button>
          ) : (
            <div style={styles.cannotAfford}>
              <p style={styles.needMoreText}>
                You need {reward.cost - balance} more coins
              </p>
              <button onClick={() => router.push('/games')} style={styles.earnButton}>
                Play Games to Earn Coins
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div style={styles.modalOverlay} onClick={() => !redeeming && setShowConfirmation(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Confirm Redemption</h2>
            <p style={styles.modalText}>
              Are you sure you want to redeem <strong>{reward.name}</strong> for <strong>{reward.cost} coins</strong>?
            </p>
            <div style={styles.modalBalance}>
              After redemption, you'll have <strong>{balance - reward.cost} coins</strong> remaining.
            </div>
            <div style={styles.modalButtons}>
              <button 
                onClick={() => setShowConfirmation(false)} 
                style={styles.cancelButton}
                disabled={redeeming}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRedemption} 
                style={styles.confirmButton}
                disabled={redeeming}
              >
                {redeeming ? 'Processing...' : 'Yes, Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
  } as React.CSSProperties,
  backButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  detailCard: {
    background: 'white',
    border: '2px solid #4a90e2',
    borderRadius: '12px',
    padding: '2rem',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0,
    flex: 1,
  } as React.CSSProperties,
  costBadge: {
    padding: '0.75rem 1.25rem',
    background: '#4a90e2',
    color: 'white',
    borderRadius: '25px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  description: {
    fontSize: '1.1rem',
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '2rem',
  } as React.CSSProperties,
  detailsSection: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  } as React.CSSProperties,
  detailsList: {
    listStyle: 'none',
    padding: 0,
  } as React.CSSProperties,
  detailItem: {
    padding: '0.5rem 0',
    paddingLeft: '1.5rem',
    position: 'relative' as const,
    fontSize: '1rem',
    '::before': {
      content: '"✓"',
      position: 'absolute',
      left: 0,
      color: '#4a90e2',
      fontWeight: 'bold',
    }
  } as React.CSSProperties,
  fulfillmentSection: {
    background: '#f0f7ff',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  } as React.CSSProperties,
  fulfillmentText: {
    margin: 0,
    fontSize: '1rem',
    color: '#333',
  } as React.CSSProperties,
  actionSection: {
    borderTop: '2px solid #e0e0e0',
    paddingTop: '1.5rem',
  } as React.CSSProperties,
  balanceInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.1rem',
    marginBottom: '1rem',
    padding: '1rem',
    background: '#f9f9f9',
    borderRadius: '8px',
  } as React.CSSProperties,
  redeemButton: {
    width: '100%',
    padding: '1rem',
    background: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  cannotAfford: {
    textAlign: 'center',
  } as React.CSSProperties,
  needMoreText: {
    color: '#f44336',
    fontSize: '1.1rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  earnButton: {
    padding: '1rem 2rem',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  } as React.CSSProperties,
  modalText: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    color: '#555',
  } as React.CSSProperties,
  modalBalance: {
    padding: '1rem',
    background: '#f0f7ff',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  modalButtons: {
    display: 'flex',
    gap: '1rem',
  } as React.CSSProperties,
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  confirmButton: {
    flex: 1,
    padding: '0.75rem',
    background: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  successCard: {
    background: 'white',
    border: '3px solid #4caf50',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textAlign: 'center',
  } as React.CSSProperties,
  successIcon: {
    fontSize: '4rem',
    color: '#4caf50',
    marginBottom: '1rem',
  } as React.CSSProperties,
  successTitle: {
    fontSize: '2rem',
    color: '#4caf50',
    marginBottom: '1rem',
  } as React.CSSProperties,
  successMessage: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
  } as React.CSSProperties,
  fulfillmentBox: {
    background: '#f0f7ff',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'left',
  } as React.CSSProperties,
  newBalance: {
    fontSize: '1.1rem',
    marginBottom: '2rem',
    padding: '1rem',
    background: '#f9f9f9',
    borderRadius: '8px',
  } as React.CSSProperties,
  actionButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  primaryButton: {
    flex: 1,
    minWidth: '200px',
    padding: '1rem',
    background: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  secondaryButton: {
    flex: 1,
    minWidth: '200px',
    padding: '1rem',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
};
