# Redemption Flow & User Experience Design

## Design Principles for Parkinson's-Friendly Redemption

### Motor Considerations
- **Large touch targets**: Minimum 80x80px (100x100px preferred)
- **Generous spacing**: 20px minimum between interactive elements
- **Tremor accommodation**: 500ms touch delay before action confirmation
- **No precise gestures**: No sliders, drag-and-drop, or swipe actions
- **Simple taps only**: Single tap primary action, double-tap disabled

### Cognitive Considerations
- **One decision per screen**: Never multiple simultaneous choices
- **Clear visual hierarchy**: 3 levels maximum (category → item → confirmation)
- **Minimal text**: Headlines 18-24px, body 16-18px, no walls of text
- **Obvious "back" option**: Always visible, always top-left
- **Progress indicators**: Show "Step 1 of 3" for multi-step processes

### Visual Accessibility
- **High contrast**: WCAG AAA (7:1 minimum)
- **Color + shape + text**: Never rely on color alone
- **Reduced motion**: Gentle fades only (200-300ms), no sudden animations
- **Focus indicators**: 4px solid border on focused elements
- **Large icons**: 64x64px minimum for category icons

---

## Screen Flow Architecture

```
[Dashboard] 
    ↓
[Reward Store Home]
    ↓
[Category View]
    ↓
[Item Detail]
    ↓
[Confirmation Dialog]
    ↓
[Success Feedback]
    ↓
[Return to Store] or [Exit to Dashboard]
```

---

## Screen 1: Dashboard (Entry Point)

### Location
Main app dashboard, persistent navigation

### Layout
```
╔════════════════════════════════════════╗
║  [☰ Menu]     StanceSense     [👤]    ║
╠════════════════════════════════════════╣
║                                        ║
║    Good afternoon, [Name]              ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  Your Wellness Coins            │   ║
║  │  ╭──────────────────────────╮   │   ║
║  │  │     1,247 coins           │   │   ║
║  │  ╰──────────────────────────╯   │   ║
║  │  [View Reward Store →]          │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  Today's Activity               │   ║
║  │  • 2 sets completed             │   ║
║  │  • 85 coins earned today        │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  [Start Exercise Session]              ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Coin Display Card**
- Background: Subtle gradient (`rgba(16, 185, 129, 0.1)`)
- Border: 2px solid `#10b981`
- Coin amount: 36px bold, `#10b981`
- Button: Full-width, 56px height, rounded corners (12px)
- Button text: "View Reward Store" with arrow (→)
- Button color: `#10b981` with hover effect (darken 10%)

**Interaction**
- Tap coin card OR button → Navigate to Reward Store Home
- No animations on tap, instant navigation with gentle fade

---

## Screen 2: Reward Store Home

### Purpose
Orient user to available categories, show balance, provide quick access

### Layout
```
╔════════════════════════════════════════╗
║  [← Back]    Reward Store              ║
╠════════════════════════════════════════╣
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  Your Balance                   │   ║
║  │  1,247 coins                    │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  Choose a category                     ║
║                                        ║
║  ┌─────────────┐  ┌─────────────┐    ║
║  │   🏥       │  │   🛒       │    ║
║  │  Health &   │  │  Daily      │    ║
║  │  Wellness   │  │  Ease       │    ║
║  │  15 rewards │  │  12 rewards │    ║
║  └─────────────┘  └─────────────┘    ║
║                                        ║
║  ┌─────────────┐  ┌─────────────┐    ║
║  │   🧘       │  │   📚       │    ║
║  │  Relax &    │  │  Learn &    │    ║
║  │  Restore    │  │  Explore    │    ║
║  │  18 rewards │  │  13 rewards │    ║
║  └─────────────┘  └─────────────┘    ║
║                                        ║
║  ┌─────────────┐                      ║
║  │   🎨       │  [More →]           ║
║  │  Your       │                      ║
║  │  Space      │                      ║
║  │  15 items   │                      ║
║  └─────────────┘                      ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Balance Display**
- Position: Top, always visible
- Size: 24px regular weight
- Color: `#10b981`
- Background: `rgba(16, 185, 129, 0.05)`
- Padding: 16px
- Border-radius: 12px

**Category Cards**
- Size: ~160x140px
- Grid: 2 columns, 24px gap
- Icon: 64x64px, centered
- Title: 18px bold, 2 lines max
- Subtitle: 14px regular, muted color
- Border: 2px solid category color at 20% opacity
- Background: Category color at 5% opacity
- Hover/Focus: Border opacity 100%, gentle scale (1.02x)
- Tap: Instant navigation with category color fade

**"More" Button**
- Shows if >5 categories (unlock progression)
- Same size/style as category cards
- Arrow indicates more content

**Accessibility**
- Tab order: Top to bottom, left to right
- Focus indicator: 4px solid border in category color
- Screen reader: "Category: Health & Wellness, 15 rewards available"

---

## Screen 3: Category View

### Purpose
Show all rewards in selected category, filterable by affordability

### Layout
```
╔════════════════════════════════════════╗
║  [← Back]    Health & Wellness    🏥   ║
╠════════════════════════════════════════╣
║                                        ║
║  Balance: 1,247 coins                  ║
║                                        ║
║  ┌─ Filter ──────────────────────┐    ║
║  │ ⚪ All rewards                 │    ║
║  │ 🟢 I can afford now (8)        │    ║
║  └────────────────────────────────┘    ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  💪 Physical Therapy Credit    │   ║
║  │  $25 co-pay assistance         │   ║
║  │  ───────────────────────────   │   ║
║  │  500 coins     [View Details]  │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  💆 Massage Therapy (30 min)   │   ║
║  │  Reduces muscle rigidity       │   ║
║  │  ───────────────────────────   │   ║
║  │  600 coins     [View Details]  │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  🍎 Nutritionist Consult       │   ║
║  │  30-min virtual session        │   ║
║  │  ───────────────────────────   │   ║
║  │  400 coins ✓   [View Details]  │   ║
║  └────────────────────────────────┘   ║
║     ↑ You can afford this             ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Header**
- Category icon + name (24px bold)
- Category color accent (subtle)
- Balance always visible (18px)

**Filter Toggle**
- Single toggle, large touch target (full width, 56px height)
- Active state clearly indicated with checkmark/color
- Counts shown "(8 affordable)"
- Instant filter, no loading state needed

**Reward Cards**
- Full width, 120px minimum height
- Icon (40x40px) + Title (18px bold)
- Short description (14px, 1-2 lines)
- Price (20px bold, category color)
- Affordability indicator: ✓ checkmark if user has enough coins
- Button: "View Details" (not "Buy Now" - reduces pressure)

**Affordability Visual**
- Affordable: Green checkmark ✓ next to price
- Not affordable: Price shown in muted gray (no red/warning color)
- Message: "Save [X] more coins" in small, gentle text

**Scrolling**
- Vertical scroll only
- Smooth scroll behavior
- "Back to top" button appears after 2 scroll screens

---

## Screen 4: Item Detail

### Purpose
Provide complete information before commitment decision

### Layout
```
╔════════════════════════════════════════╗
║  [← Back]    Reward Details            ║
╠════════════════════════════════════════╣
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │         💆                      │   ║
║  │  Massage Therapy Session        │   ║
║  │  30 minutes                     │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  Cost: 600 coins                       ║
║  Your balance: 1,247 coins             ║
║  After redemption: 647 coins           ║
║                                        ║
║  ─────────────────────────────────     ║
║                                        ║
║  What you'll receive                   ║
║  • Digital voucher via email           ║
║  • $40 credit toward massage           ║
║  • Book with partner providers         ║
║                                        ║
║  Why this supports wellness            ║
║  Therapeutic massage reduces muscle    ║
║  rigidity, improves circulation, and   ║
║  supports relaxation.                  ║
║                                        ║
║  Valid for: 120 days                   ║
║  Partner: Zeel, Soothe                 ║
║                                        ║
║  ─────────────────────────────────     ║
║                                        ║
║  [Redeem This Reward]                  ║
║                                        ║
║  [Save for Later] [← Back to Store]    ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Hero Section**
- Large icon (96x96px)
- Title (24px bold)
- Subtitle (16px regular)
- Category color accent background

**Cost Breakdown**
- Current balance
- Cost amount (bold, category color)
- Calculated remaining balance
- All three lines clearly visible
- NO red/warning colors if user can't afford

**Information Sections**
- Clear headings (16px bold)
- Bullet points for lists
- Short paragraphs (14-16px)
- Generous line height (1.6)
- Maximum 3-4 lines per section

**Primary Action Button**
- Full width, 64px height
- Large text (18px bold)
- Category color background
- Text: "Redeem This Reward" (confident, clear)
- Disabled if insufficient coins (grayed out, not removed)
- Disabled message: "Save [X] more coins to redeem"

**Secondary Actions**
- "Save for Later" - Adds to wishlist, gentle gray button
- "Back to Store" - Clear text link, not a button
- Both below primary action, less prominent

**Accessibility**
- All text selectable (for assistive tech)
- Logical tab order
- Focus trap when modal opens (if applicable)

---

## Screen 5: Confirmation Dialog

### Purpose
Final check before coin deduction, prevents accidental taps

### Layout
```
╔════════════════════════════════════════╗
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  Confirm Your Redemption        │   ║
║  │                                 │   ║
║  │  You're about to redeem:        │   ║
║  │                                 │   ║
║  │  💆 Massage Therapy (30 min)    │   ║
║  │                                 │   ║
║  │  Cost: 600 coins                │   ║
║  │  Your balance: 1,247 coins      │   ║
║  │  New balance: 647 coins         │   ║
║  │                                 │   ║
║  │  ─────────────────────────      │   ║
║  │                                 │   ║
║  │  You'll receive:                │   ║
║  │  • Email with voucher code      │   ║
║  │  • Booking instructions         │   ║
║  │  • Valid for 120 days           │   ║
║  │                                 │   ║
║  │  ─────────────────────────      │   ║
║  │                                 │   ║
║  │  [Confirm Redemption]           │   ║
║  │                                 │   ║
║  │  [Go Back]                      │   ║
║  │                                 │   ║
║  └────────────────────────────────┘   ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Modal Overlay**
- Semi-transparent black background (rgba(0,0,0,0.7))
- Centers modal in viewport
- Clicking outside closes modal (same as "Go Back")
- Gentle fade-in animation (300ms)

**Modal Content**
- White/light background
- Max width: 480px
- Padding: 32px
- Border-radius: 16px
- Box shadow: Prominent but not harsh

**Information Display**
- Repeat key details (item, cost, balance change)
- "What you'll receive" summary (3-4 bullets max)
- Clear visual separator between sections

**Action Buttons**
- "Confirm Redemption": Large (56px height), category color, bold
- "Go Back": Secondary style (gray outline), same height
- Vertical stack, 16px gap
- Both full width of modal

**Language Tone**
- Confident: "Confirm Redemption" (not "Are you sure?")
- Clear: Direct statements, no questions
- Supportive: Emphasizes what user gains

---

## Screen 6: Success Feedback

### Purpose
Confirm redemption, provide next steps, celebrate appropriately

### Layout
```
╔════════════════════════════════════════╗
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │           ✓                     │   ║
║  │    Reward Redeemed              │   ║
║  │                                 │   ║
║  │  Massage Therapy (30 min)       │   ║
║  │  successfully redeemed          │   ║
║  │                                 │   ║
║  │  ─────────────────────────      │   ║
║  │                                 │   ║
║  │  Next steps                     │   ║
║  │  1. Check your email            │   ║
║  │  2. Find your voucher code      │   ║
║  │  3. Book via partner app        │   ║
║  │                                 │   ║
║  │  Your voucher code:             │   ║
║  │  ┌──────────────────────┐       │   ║
║  │  │  MASSAGE-X7K9-2M4P   │       │   ║
║  │  └──────────────────────┘       │   ║
║  │  [Copy Code]                    │   ║
║  │                                 │   ║
║  │  ─────────────────────────      │   ║
║  │                                 │   ║
║  │  New balance: 647 coins         │   ║
║  │                                 │   ║
║  │  ─────────────────────────      │   ║
║  │                                 │   ║
║  │  [View My Rewards]              │   ║
║  │  [Back to Store]                │   ║
║  │  [Go to Dashboard]              │   ║
║  │                                 │   ║
║  └────────────────────────────────┘   ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Success Indicator**
- Large checkmark icon (72x72px, green)
- "Reward Redeemed" heading (28px bold)
- Specific item name (20px regular)
- Gentle pulse animation on checkmark (optional, can be disabled)

**Next Steps**
- Numbered list (clear sequence)
- Large text (16px minimum)
- Specific actionable instructions
- No vague "check your email later"

**Voucher Code Display**
- If applicable (some rewards are automatic)
- Large, monospace font (20px)
- High-contrast background
- "Copy Code" button (copies to clipboard)
- Success toast on copy: "Code copied"

**Balance Update**
- Show new balance clearly
- NOT framed as "loss" - neutral presentation
- Optional: "You still have [X] coins to use"

**Navigation Options**
- "View My Rewards" - Goes to active rewards list
- "Back to Store" - Return to shopping
- "Go to Dashboard" - Exit reward flow
- Vertical stack, clear hierarchy

**Auto-dismiss Option**
- After 10 seconds, show subtle prompt: "Returning to store..."
- User can stay on page indefinitely if preferred

---

## Screen 7: My Active Rewards

### Purpose
Track redeemed rewards, access codes, check expiration dates

### Layout
```
╔════════════════════════════════════════╗
║  [← Back]    My Rewards                ║
╠════════════════════════════════════════╣
║                                        ║
║  Balance: 647 coins                    ║
║                                        ║
║  ┌─ Active Rewards ──────────────┐    ║
║  │                                │    ║
║  │  💆 Massage Therapy            │    ║
║  │  Redeemed: Nov 15, 2025        │    ║
║  │  Valid until: Mar 15, 2026     │    ║
║  │  Code: MASSAGE-X7K9-2M4P       │    ║
║  │  [View Details] [Copy Code]    │    ║
║  │                                │    ║
║  └────────────────────────────────┘    ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  🎨 Ocean Breeze Theme          │   ║
║  │  Unlocked: Nov 10, 2025         │   ║
║  │  Status: Active                 │   ║
║  │  [Change Theme]                 │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌─ Expired ──────────────────────┐   ║
║  │  (1 reward expired)             │   ║
║  │  [View]                         │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  [Browse More Rewards]                 ║
║                                        ║
╚════════════════════════════════════════╝
```

### Elements

**Active Rewards List**
- Cards similar to store view
- Redemption date shown
- Expiration prominently displayed
- Status: "Active" or "Expiring soon" (30 days warning)
- Action buttons: "View Details", "Copy Code", etc.

**Expiration Warning**
- If <30 days remaining: Gentle yellow border
- If <7 days: More prominent orange border
- Message: "Use by [date]" (not "Expires" - more positive)

**Expired Section**
- Collapsed by default
- Shows count: "(3 expired rewards)"
- Expandable to view history
- Helpful for tracking what was used

**Empty State**
```
┌────────────────────────────────┐
│  No active rewards yet          │
│                                 │
│  Start redeeming coins for      │
│  rewards that support your      │
│  wellness journey.              │
│                                 │
│  [Browse Reward Store]          │
└────────────────────────────────┘
```

---

## Interaction Patterns

### Touch Interactions

**Single Tap**
- Primary action for all interactions
- 500ms delay before processing (tremor accommodation)
- Visual feedback: Gentle highlight/scale
- Haptic feedback: Light tap (if device supports)

**Long Press**
- NOT USED - too difficult for tremor
- All functions accessible via single tap

**Swipe**
- NOT USED - except for scrolling
- No swipe-to-delete or hidden menus

### Loading States

**During Redemption**
```
┌────────────────────────────────┐
│  Processing your redemption...  │
│  ⟳ [Spinner - slow rotation]    │
│                                 │
│  This may take a moment         │
└────────────────────────────────┘
```

- Simple spinner (not percentage)
- Calming message
- Cannot be dismissed (prevents double-redemption)
- Timeout after 30 seconds with error recovery

### Error Handling

**Insufficient Coins** (Should rarely appear due to UI preventing it)
```
┌────────────────────────────────┐
│  Almost there!                  │
│                                 │
│  You have 400 coins.            │
│  This reward costs 600 coins.   │
│                                 │
│  Earn 200 more coins:           │
│  • Complete 2 more sessions, or │
│  • Check in daily this week     │
│                                 │
│  [Browse Other Rewards]         │
│  [Back to Store]                │
└────────────────────────────────┘
```

**Network Error**
```
┌────────────────────────────────┐
│  Connection issue               │
│                                 │
│  We couldn't process your       │
│  redemption right now.          │
│                                 │
│  Your coins are safe. Please    │
│  check your connection and      │
│  try again.                     │
│                                 │
│  [Try Again]                    │
│  [Back to Store]                │
└────────────────────────────────┘
```

**Already Redeemed** (Duplicate attempt)
```
┌────────────────────────────────┐
│  Already redeemed               │
│                                 │
│  You redeemed this reward       │
│  a moment ago.                  │
│                                 │
│  [View My Rewards]              │
│  [Back to Store]                │
└────────────────────────────────┘
```

**Partner Service Unavailable**
```
┌────────────────────────────────┐
│  Temporarily unavailable        │
│                                 │
│  This reward's partner service  │
│  is temporarily unavailable.    │
│                                 │
│  Your coins remain safe.        │
│  Please try again later or      │
│  choose a different reward.     │
│                                 │
│  [Browse Other Rewards]         │
│  [Back]                         │
└────────────────────────────────┘
```

### Success Feedback

**Audio** (Optional, user-controllable)
- Soft chime (major chord, 0.8 seconds)
- Volume: 50% of system volume
- Can be disabled in settings
- Never sudden or jarring

**Visual**
- Gentle green checkmark fade-in
- No confetti or excessive animation
- Consistent with therapeutic tone

**Haptic** (If supported)
- Single gentle pulse
- Same pattern as exercise completion
- Familiar and predictable

---

## Accessibility Features

### Screen Reader Support

**Category Card**
```html
<button 
  role="button"
  aria-label="Health and Wellness category, 15 rewards available, navigate to view rewards"
  tabindex="0"
>
```

**Reward Card**
```html
<article 
  role="article"
  aria-label="Massage Therapy 30 minutes, costs 600 coins, you can afford this, view details button"
>
```

**Balance Display**
```html
<div 
  role="status"
  aria-live="polite"
  aria-label="Your current balance is 1,247 wellness coins"
>
```

### Keyboard Navigation

**Tab Order**
1. Back button
2. Balance/header info
3. Category/item cards (left-to-right, top-to-bottom)
4. Action buttons
5. Footer navigation

**Shortcuts** (Optional)
- `B`: Back
- `H`: Home/Dashboard
- `S`: Search (if implemented)
- `Esc`: Close modals

### High Contrast Mode

**Automatic Detection**
```css
@media (prefers-contrast: high) {
  .reward-card {
    border: 3px solid #000;
    background: #fff;
  }
  .button-primary {
    background: #000;
    color: #fff;
    border: 2px solid #000;
  }
}
```

### Reduced Motion

**User Preference**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Mobile vs Tablet vs Desktop

### Mobile (Primary Target)
- Single column layouts
- Full-width cards
- Bottom navigation (thumb-friendly)
- Minimum 80px touch targets

### Tablet
- 2-column layouts where appropriate
- Larger preview images
- Side-by-side detail view option
- Minimum 80px touch targets (same as mobile)

### Desktop
- 3-column category grid
- Persistent sidebar navigation
- Hover states (but not required for functionality)
- Minimum 60px click targets
- Support for keyboard shortcuts

---

## Performance Considerations

### Fast Loading
- Images lazy-loaded
- Coins balance cached locally
- Store content pre-fetched on app launch
- Offline mode: View previously loaded categories

### Offline Behavior
```
┌────────────────────────────────┐
│  You're offline                 │
│                                 │
│  You can browse rewards, but    │
│  redemption requires connection.│
│                                 │
│  Your balance: 1,247 coins      │
│  (Last updated: 2 hours ago)    │
│                                 │
│  [View Available Rewards]       │
└────────────────────────────────┘
```

### Data Usage
- Minimize image sizes (< 50KB per icon)
- Cache aggressively
- Compress API responses
- Only fetch reward details on demand

---

## Testing Checklist

### Functional Testing
- [ ] Can navigate entire flow with single taps
- [ ] All touch targets ≥80px
- [ ] Tremor simulation: 500ms hold registers correctly
- [ ] Coins deducted only once per redemption
- [ ] Balance updates in real-time
- [ ] Error states handle gracefully
- [ ] Back button always works correctly
- [ ] No accidental double-redemptions possible

### Accessibility Testing
- [ ] Screen reader announces all content correctly
- [ ] Tab order logical and complete
- [ ] Focus indicators visible (4px border)
- [ ] High contrast mode works
- [ ] Reduced motion respected
- [ ] All text readable at 200% zoom
- [ ] No color-only information

### User Testing (With PD Patients)
- [ ] Can complete redemption unassisted
- [ ] No confusion about steps
- [ ] No frustration with touch targets
- [ ] Language feels respectful
- [ ] Sufficient time to read information
- [ ] Confirmation prevents accidents
- [ ] Success feedback satisfying but not overwhelming

---

**Design philosophy: Every screen should feel calm, clear, and respectful. Users should never feel rushed, confused, or infantilized. The redemption process should feel like a dignified exchange, not a game or gambling mechanic.**
