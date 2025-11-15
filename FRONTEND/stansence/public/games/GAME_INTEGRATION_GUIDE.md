# Game Integration Guide: Adding Coin Rewards

## Overview
This guide shows how to integrate the coin reward system into existing exercise games.

## Step 1: Include Required Scripts

Add these scripts to your game's HTML file (before your game's main script):

```html
<!-- In the <head> or before closing </body> -->
<script src="../reward-system.js"></script>
<script src="../coin-bridge.js"></script>
```

## Step 2: Initialize Coin System

At the start of your game script:

```javascript
// Initialize coin bridge
const coins = window.CoinBridge;

// Show current balance (optional)
document.addEventListener('DOMContentLoaded', () => {
    const balance = coins.getBalance();
    const potential = coins.getEarningPotential();
    console.log(`Current balance: ${balance} coins`);
    console.log(`Can earn ${potential.remaining} more coins today`);
});
```

## Step 3: Award Coins at Key Events

### When Session Starts
```javascript
function startGame() {
    // ... your existing start game code ...
    
    // Award coins for starting
    const result = coins.awardSessionStart();
    if (result.success) {
        console.log(`Earned ${result.coinsAwarded} coins for starting!`);
    }
}
```

### When Set Completes
```javascript
function completeSet(setNumber) {
    // ... your existing set completion code ...
    
    // Award coins for completing set
    const result = coins.awardSetComplete(setNumber, 'steady-hand');
    if (result.success) {
        console.log(`Earned ${result.coinsAwarded} coins for set ${setNumber}!`);
    }
}
```

### When Session Ends
```javascript
function endSession(totalSets, durationSeconds) {
    // ... your existing end session code ...
    
    // Award coins for completing session
    const result = coins.awardSessionComplete(totalSets, 'steady-hand', durationSeconds);
    if (result.success) {
        console.log(`Earned ${result.coinsAwarded} coins for completing session!`);
    }
}
```

### Occasional Movement Quality Bonus
```javascript
function onGoodMovement() {
    // Call this when you detect controlled, quality movement
    const result = coins.awardSafeMovement();
    if (result.success) {
        console.log(`Bonus! Earned ${result.coinsAwarded} coins for controlled movement!`);
    }
}
```

## Step 4: Display Coin Balance (Optional)

Add to your HTML stats display:

```html
<div class="stat-box">
    <div class="stat-label">Coins Today</div>
    <div class="stat-value" id="coin-counter">0</div>
</div>
```

Update in your JavaScript:

```javascript
function updateCoinDisplay() {
    const potential = coins.getEarningPotential();
    const counter = document.getElementById('coin-counter');
    if (counter) {
        counter.textContent = potential.earned;
    }
}

// Update after each coin award
coins.awardSessionStart();
updateCoinDisplay();
```

## Complete Example: Steady Hand Integration

```javascript
// At top of your game script
const coins = window.CoinBridge;
let sessionActive = false;
let currentSet = 0;
const sessionStartTime = Date.now();

// When game starts
function startGame() {
    if (!sessionActive) {
        sessionActive = true;
        coins.awardSessionStart(); // +10 coins
        console.log('Session started - coins awarded!');
    }
    
    // ... rest of your start game logic
}

// After each level/round completion
function completeLevel() {
    currentSet++;
    coins.awardSetComplete(currentSet, 'steady-hand'); // +20 coins
    
    // ... rest of your level completion logic
}

// When detecting quality movement (optional)
function checkMovementQuality(movementData) {
    // Your existing quality detection logic
    if (movementIsControlled) {
        coins.awardSafeMovement(); // +15 coins (30% chance)
    }
}

// When session ends
function endGame() {
    if (sessionActive) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        coins.awardSessionComplete(currentSet, 'steady-hand', duration); // +30 coins
        
        sessionActive = false;
        console.log('Session complete - all coins awarded!');
    }
    
    // ... rest of your end game logic
}

// Handle page unload to save session data
window.addEventListener('beforeunload', () => {
    if (sessionActive) {
        endGame();
    }
});
```

## Notification System

The CoinBridge automatically shows notifications when coins are earned:
- Position: Top-right corner
- Duration: 3 seconds
- Auto-dismisses
- Doesn't interrupt gameplay

You don't need to implement any UI for this - it's handled automatically!

## Daily Cap Handling

The system automatically:
- Tracks daily earnings (resets at midnight)
- Caps exercise earnings at 200 coins/day
- Shows friendly message when cap reached
- Prevents over-earning

No special handling needed in your game code!

## Testing

Test your integration:

1. Start a game → Should see "+10 coins: You started—that's what matters"
2. Complete a set → Should see "+20 coins: Set complete"
3. End session → Should see "+30 coins: Session complete. Well done."
4. Check localStorage → Should see updated 'stancesense_coins' data
5. Go to main dashboard → Should see updated coin balance

## Minimal Integration

If you want the simplest possible integration:

```html
<!-- Add to HTML -->
<script src="../coin-bridge.js"></script>

<script>
// Add to your game JavaScript
const coins = window.CoinBridge;

// On game start
coins.awardSessionStart();

// On level/set complete
coins.awardSetComplete(1, 'your-game-name');

// On game end
coins.awardSessionComplete(3, 'your-game-name', 180);
</script>
```

That's it! The coin system will handle everything else.

## Troubleshooting

**Coins not showing up?**
- Check browser console for errors
- Verify coin-bridge.js is loaded
- Check localStorage for 'stancesense_coins' key

**Notifications not appearing?**
- Check z-index conflicts
- Verify no CSS override on fixed positioning
- Check console for JavaScript errors

**Daily cap hit too early?**
- Check if coinsEarnedToday is being reset at midnight
- Verify lastDailyReset timestamp in localStorage
- Clear localStorage and restart if corrupted

## Best Practices

1. **Award coins immediately** after user action (no delays)
2. **Don't over-award** - stick to the standard amounts
3. **Test daily cap** behavior in your game
4. **Handle errors gracefully** - check result.success
5. **Don't modify coin values** - use standard system

## Next Steps

After integration:
1. Test thoroughly with different scenarios
2. Verify coin persistence across page reloads
3. Check dashboard updates correctly
4. Test daily cap behavior
5. Ensure notifications don't interfere with gameplay

## Support

See complete documentation:
- `/public/games/reward-redemption-system/README.md` - Full system overview
- `/public/games/reward-redemption-system/COIN_EARNING_LOGIC.md` - Detailed earning rules
- `/public/games/coin-bridge.js` - Bridge implementation source code
