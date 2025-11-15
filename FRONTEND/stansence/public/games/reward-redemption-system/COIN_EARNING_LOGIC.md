# Coin Earning Logic & Anti-Compulsion System

## Core Earning Philosophy

**Coins reward consistency, safe movement, and self-care—never performance, speed, or symptom mastery.**

### What We Measure
✅ **Showing up**: Starting a session earns coins  
✅ **Completing sets**: Finishing exercise sets (regardless of accuracy)  
✅ **Consistency**: Daily participation over time  
✅ **Rest compliance**: Taking recommended breaks  
✅ **Self-awareness**: Using adaptive difficulty appropriately  

### What We Don't Measure
❌ Tremor reduction  
❌ Movement speed  
❌ Accuracy scores  
❌ Time-to-complete  
❌ Comparison to others  
❌ "Perfect" performance  

---

## Coin Earning Structure

### 1. Session Participation (Base Rewards)

#### Session Start Bonus
**10 coins** - Awarded immediately upon starting any exercise session
- **Rationale**: Showing up is the hardest part; reward it instantly
- **No conditions**: User gets coins even if they stop after 1 minute
- **Message**: "You started—that's what matters. +10 coins"

#### Set Completion
**20 coins per set** - Awarded for completing any exercise set
- **Rationale**: Reinforces follow-through without demanding perfection
- **Conditions**: User completes the prescribed movements (form quality irrelevant)
- **Message**: "Set complete. +20 coins"

#### Session Completion Bonus
**30 coins** - Awarded for finishing the full recommended session
- **Rationale**: Celebrates sustained effort
- **Conditions**: User completes recommended number of sets for their current level
- **Message**: "Session complete. Well done. +30 coins"

**Example Session Breakdown**:
```
Session Start: +10 coins
Set 1 Complete: +20 coins
Set 2 Complete: +20 coins
Set 3 Complete: +20 coins
Session Complete Bonus: +30 coins
---
Total: 100 coins for 3-set session
```

### 2. Consistency Rewards (Long-term Behavior)

#### Daily Check-In
**5 coins** - Just for opening the app each day
- **Rationale**: Low-barrier engagement, no exercise required
- **Conditions**: Open app once per day (any time)
- **Cap**: 1 per day
- **Message**: "Welcome back. +5 coins"

#### Rest Day Acknowledgment
**15 coins** - For marking a planned rest day
- **Rationale**: Rewards listening to your body, not pushing through fatigue
- **Conditions**: User proactively selects "Rest Day" option instead of skipping
- **Message**: "Rest is part of training. +15 coins"

#### Weekly Streak Bonus
Awarded every 7 consecutive days with activity (exercise OR rest day marked)

| Streak Week | Bonus Coins | Rationale |
|-------------|-------------|-----------|
| Week 1 | +50 | Establishing routine |
| Week 2 | +75 | Building habit |
| Week 3 | +100 | Habit forming |
| Week 4+ | +125 | Sustained commitment |

- **Grace Period**: Missing 1 day doesn't break streak (symptom accommodation)
- **Message**: "7 days of showing up. +[amount] coins"

#### Monthly Milestone
**200 coins** - For completing 20+ active days in a calendar month
- **Rationale**: Celebrates sustained consistency without demanding perfection
- **Conditions**: 20 days with either exercise session OR marked rest day
- **Message**: "20 days of commitment this month. +200 coins"

### 3. Adaptive Effort Recognition

#### Appropriate Difficulty Selection
**10 coins** - When user selects difficulty that matches their current state
- **Rationale**: Rewards self-awareness and safe choices
- **Conditions**: System suggests difficulty based on recent performance; user accepts OR user self-selects and completes session
- **Message**: "Listening to your body today. +10 coins"

#### Post-Fatigue Return
**40 coins** - First session back after system-prompted rest period
- **Rationale**: Celebrates return without punishing needed break
- **Conditions**: User took recommended rest (1-3 days) after fatigue warning
- **Message**: "Welcome back, rested and ready. +40 coins"

#### Safe Movement Pattern Bonus
**15 coins** - Occasional random reward during sessions showing controlled movement
- **Rationale**: Reinforces quality over speed (without creating performance anxiety)
- **Conditions**: System detects smooth, controlled motion (not accuracy)
- **Frequency**: Max 2 per session, appears unpredictably
- **Message**: "Controlled movement noticed. +15 coins"

### 4. Surprise Wellness Bonuses (NOT Random Gambling)

#### Weekly Wellness Check-In Bonus
**25 coins** - For completing optional 1-minute wellness survey
- **Rationale**: Encourages self-monitoring and provides valuable data
- **Conditions**: User completes weekly "How are you feeling?" check-in
- **Frequency**: Once per week, Monday prompt
- **Message**: "Thank you for sharing your wellness data. +25 coins"

#### Milestone Celebration Bonus
**Variable (50-150 coins)** - Awarded at meaningful milestones
- **Rationale**: Creates memorable achievement moments
- **Conditions**: Triggered at 10, 25, 50, 100, 250 total sessions
- **Message**: "[X] sessions completed. You're building lasting change. +[amount] coins"

#### Community Contribution Bonus
**30 coins** - For participating in optional community features
- **Rationale**: Rewards social engagement without requiring it
- **Conditions**: Join support group, complete caregiver workshop, attend virtual event
- **Frequency**: Per event participation
- **Message**: "Thank you for connecting. +30 coins"

---

## Daily & Session Caps (Anti-Compulsion)

### Daily Coin Cap
**Maximum 200 coins per day from exercise activities**

#### Rationale
- Prevents obsessive grinding behavior
- Encourages quality over quantity
- Protects users from overexertion
- Makes daily planning predictable

#### Implementation
```javascript
if (user.coinsEarnedToday >= 200 && source === 'exercise') {
    showMessage("You've done excellent work today. Time to rest.");
    disableExerciseStart();
    return 0; // No additional coins
}
```

#### Cap Exceptions
- Daily check-in bonus (5 coins) - NOT counted toward cap
- Rest day acknowledgment (15 coins) - NOT counted toward cap
- Weekly/monthly milestones - NOT counted toward cap
- Community participation - NOT counted toward cap

### Session Frequency Limits

#### Minimum Rest Between Sessions
**2 hours** - Enforced cooldown between exercise sessions

```javascript
const timeSinceLastSession = now - user.lastSessionEndTime;
if (timeSinceLastSession < 2 * 60 * 60 * 1000) {
    const minutesRemaining = Math.ceil((2 * 60 - timeSinceLastSession / 60000));
    showMessage(`Your body needs rest. Next session available in ${minutesRemaining} minutes.`);
    disableExerciseStart();
}
```

#### Daily Session Recommendation
**1-2 sessions per day maximum**
- After 2nd session: "You've completed 2 sessions today. Consider resting."
- After 2nd session: Disable new session starts until next day

#### Weekly Exercise Cap
**Maximum 10 exercise sessions per week**
- After 10th session: "You've completed 10 sessions this week—outstanding! Take a rest day."
- Remaining days of week: Only rest day marking available

---

## Adaptive Coin Scaling

### Ability-Based Adjustment

The system adapts coin rewards based on user's individual baseline, ensuring everyone can earn meaningful rewards regardless of symptom severity.

#### User Profiles (Automatically Detected)
System analyzes first 7 days of activity to establish baseline:

**Profile A: Higher Capacity**
- Completes 4-5 sets per session comfortably
- Sessions 15-20 minutes
- Standard coin rates

**Profile B: Moderate Capacity**
- Completes 2-3 sets per session comfortably
- Sessions 10-15 minutes
- Standard coin rates

**Profile C: Limited Capacity**
- Completes 1-2 sets per session comfortably
- Sessions 5-10 minutes
- **Coins per set increased to 30** (vs 20)
- **Session completion bonus increased to 40** (vs 30)

#### Rationale
- Ensures earning potential is equitable
- Prevents discouragement from slower progress
- Adapts to disease progression over time
- Transparent to user (all messages show final coin amount)

#### Re-calibration
- System re-evaluates every 30 days
- If capacity increases: User notified with encouragement
- If capacity decreases: Adjusted support engaged automatically
- User can manually request adjustment anytime

---

## Symptom Fluctuation Accommodation

### "Off" Day Support
Parkinson's symptoms fluctuate significantly. The system detects and responds:

#### Detection Signals
- User selects "Having a tough day" option at session start
- Movement patterns show increased difficulty vs baseline
- User stops session earlier than usual
- User hasn't started session by usual time of day

#### Adaptive Responses

**Gentle Check-In**
```
"Noticed you're starting a bit later today. 
No pressure—any movement you can do is valuable."
```

**Reduced Set Suggestion**
```
"Would you like to try a shorter session today? 
1-2 sets would be excellent."
```

**Full Coin Credit for Partial Completion**
```
User starts 3-set session but stops after 1 set:
- Session start: +10 coins
- Set 1 complete: +20 coins
- Gentle completion bonus: +30 coins (full bonus despite stopping early)
- Total: 60 coins

Message: "You showed up on a tough day—that's what matters. +60 coins"
```

### Grace Period for Missed Days

**Streak Protection**
- Missing 1 day within a 7-day period: Streak maintained
- Missing 2-3 days: Streak maintained with note
  - Message: "Welcome back. We know some days are harder. Your streak continues."
- Missing 4+ consecutive days: Gentle reset
  - Message: "Welcome back. Let's start fresh today—no streak lost, just a new beginning."

**No Punishment**
- Coins never decay or expire
- No negative messages for absences
- No visible "days missed" counter
- Return is always celebrated, never questioned

---

## Fatigue Detection & Prevention

### Real-Time Fatigue Monitoring

#### Movement Quality Indicators
System tracks (without showing user):
- Increased movement variability
- Longer pauses between actions
- Declining precision (if game-specific)
- Time taken per set increasing

#### Fatigue Warning Triggers
If 2+ indicators appear during session:
```
PAUSE SESSION
Show Message: "Your body might be getting tired. 
Would you like to end here with full credit?"

Options:
[End Session (Recommended)] - Awards full session completion bonus
[Continue] - Allows 1 more set maximum, then forced end
```

### Mandatory Rest Periods

#### After Sustained High Activity
If user completes sessions on 7 consecutive days:
```
Day 8 morning:
"You've shown incredible consistency this week. 
Today is a recommended rest day—your body needs recovery."

Exercise sessions: DISABLED
Rest day marking: ENABLED (+15 coins)
Educational content: "Why rest matters for Parkinson's"
```

#### After Fatigue Warning
If user receives fatigue warning during session:
```
Next 24 hours:
Minimum rest period: 24 hours
Message: "Give your body time to recover. Next session available [tomorrow at time]."
```

---

## Psychological Safeguards

### No Loss Aversion Triggers
- Coins never expire or decay
- No "use it or lose it" pressure
- No limited-time coin bonuses
- No countdown timers on earning opportunities

### No Social Comparison
- User only sees own coin total
- No leaderboards or rankings
- No "other users earned X today" messages
- No visible friend coin totals

### No Artificial Scarcity
- All rewards always available
- No "only 3 left!" pressure
- No random reward drops
- No surprise coin deductions

### Transparent Communication
```javascript
// Example: Clear earning summary
"Today's Earnings:
├─ Session start: +10 coins
├─ 3 sets completed: +60 coins
├─ Session completion: +30 coins
├─ Weekly streak: +50 coins
└─ Total earned today: 150 coins

Daily cap: 200 coins (50 remaining)
Total balance: 1,247 coins"
```

---

## Special Circumstances

### First Week Experience
New users receive educational onboarding rewards:

**Day 1**: "Welcome bonus" - 50 coins (auto-credited)
**Day 2**: "Second day" - 25 bonus coins if they return
**Day 3**: "Building momentum" - 25 bonus coins
**Total**: 100 bonus coins in first 3 days

Rationale: Helps new users explore reward store quickly, building engagement

### Return After Extended Absence

**User returns after 30+ days away**:
```
"Welcome back! We're glad you're here.
Here's 75 coins to restart your journey—no questions asked."

Message tone: Warm, never judgmental
Focus: "Starting fresh" not "you were gone"
```

### Medication Change Accommodation

If user marks "Medication adjustment in progress" in settings:
- Daily cap removed for 14 days (symptom instability period)
- All sessions earn 1.5x coins (compensates for difficulty)
- Fatigue warnings more sensitive
- Message: "We know medication changes are tough. You're doing great."

### Post-Hospitalization Support

If user marks "Recently hospitalized" or extended medical leave:
- Return session: 100 bonus coins
- First week back: No daily caps
- Gradual reintroduction to full earning structure
- Physical therapist consultation reward offered (free/low-cost)

---

## Earning Summary Example

**Typical High-Engagement Day**:
```
Morning:
├─ Daily check-in: +5 coins (not counted toward cap)
├─ Session start: +10 coins
├─ Set 1: +20 coins
├─ Set 2: +20 coins
├─ Set 3: +20 coins
├─ Safe movement bonus: +15 coins (random)
├─ Session complete: +30 coins
└─ Subtotal: 115 coins

Evening:
├─ Session start: +10 coins
├─ Set 1: +20 coins
├─ Set 2: +20 coins
├─ Session complete: +30 coins
└─ Subtotal: 80 coins

Daily Total: 195 coins (exercise)
Bonus: +5 coins (check-in, uncapped)
Grand Total: 200 coins

Weekly milestone achieved: +75 coins (bonus, uncapped)
Final Day Total: 280 coins
```

**Typical Moderate-Engagement Day**:
```
├─ Daily check-in: +5 coins
├─ Session start: +10 coins
├─ Set 1: +20 coins
├─ Set 2: +20 coins
├─ Session complete: +30 coins
└─ Total: 85 coins
```

**Tough Day (Reduced Capacity)**:
```
├─ Daily check-in: +5 coins
├─ Session start: +10 coins
├─ Set 1: +20 coins
├─ Early end with full credit: +30 coins
└─ Total: 65 coins

Message: "You showed up when it was hard. That's strength."
```

**Rest Day**:
```
├─ Daily check-in: +5 coins
├─ Rest day marked: +15 coins
└─ Total: 20 coins

Message: "Rest is productive. Your body is recovering."
```

---

## Developer Implementation Notes

### Coin Awarding Function
```javascript
function awardCoins(amount, source, message, bypassCap = false) {
    // Check daily cap
    if (!bypassCap && user.coinsEarnedToday >= DAILY_CAP && source === 'exercise') {
        showCapReachedMessage();
        return 0;
    }
    
    // Award coins
    user.totalCoins += amount;
    user.coinsEarnedToday += amount;
    user.lifetimeCoinsEarned += amount;
    
    // Track source for analytics
    logCoinEarning(amount, source, timestamp);
    
    // Show user feedback
    showCoinNotification(amount, message);
    
    // Save to backend
    syncCoinsToDatabase();
    
    return amount;
}
```

### Daily Cap Reset
```javascript
// Reset daily counter at midnight user's local time
function checkAndResetDailyProgress() {
    const now = new Date();
    const lastReset = new Date(user.lastDailyReset);
    
    if (now.toDateString() !== lastReset.toDateString()) {
        user.coinsEarnedToday = 0;
        user.sessionsToday = 0;
        user.lastDailyReset = now.toISOString();
        syncToDatabase();
    }
}
```

### Earning History (For User Transparency)
```javascript
// Users can view detailed earning history
function getEarningHistory(days = 7) {
    return {
        daily: user.coinHistory.slice(-days),
        sources: aggregateBySource(user.coinHistory),
        trends: calculateTrends(user.coinHistory),
        projectedMonthly: projectMonthlyEarnings()
    };
}
```

---

## Coin Earning Philosophy Summary

### Core Principles
1. **Effort over outcome**: Showing up matters more than performing perfectly
2. **Safety first**: Rest is rewarded, overexertion is prevented
3. **Equity**: Everyone can earn meaningful rewards regardless of symptom severity
4. **Transparency**: Users always know how coins are earned
5. **Autonomy**: Users control their engagement level
6. **Dignity**: No infantilizing celebrations or pressuring tactics

### What Success Looks Like
✅ Users feel motivated without feeling pressured  
✅ Bad symptom days don't prevent meaningful earning  
✅ System feels fair and transparent  
✅ Coins retain perceived value (not inflated/devalued)  
✅ Earning structure supports therapeutic goals  
✅ Users trust the system isn't manipulating them  

### What We Avoid
❌ Exploitative engagement tactics  
❌ Comparison-based competition  
❌ Punishment for absence  
❌ Pressure to over-exercise  
❌ Complex earning formulas  
❌ Artificial scarcity or FOMO  

---

**The coin system exists to support wellness, not extract engagement. Every design decision must pass this test: "Would I want my parent with Parkinson's to experience this?"**
