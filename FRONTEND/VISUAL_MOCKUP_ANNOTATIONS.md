# 🎨 StanceSense Dashboard - Visual Mockup with Accessibility Annotations

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                         🌙 THEME TOGGLE    ║
║  ┌──────────────────────┐                                              [60×60px]          ║
║  │ 📊 StanceSense       │                                              Alt+T              ║
║  │ ━━━━━━━━━━━━━━━━━━  │ ← Logo: 32px icon + 22px text                                  ║
║  │                      │    High contrast, always visible                               ║
║  │ ┌─────────────────┐  │                                                                ║
║  │ │ 📈 Dashboard    │  │ ← Active: Blue bg (#60a5fa)                                   ║
║  │ │ [60px height]   │  │    3px border, 18px text                                       ║
║  │ │ [24px icon]     │  │    Alt+D hint visible                                          ║
║  │ └─────────────────┘  │                                                                ║
║  │                      │                                                                ║
║  │ ┌─────────────────┐  │ ← Hover: Slide right 4px                                      ║
║  │ │ 👤 Patient Pro  │  │    Background highlight                                        ║
║  │ │                 │  │    Focus: 3px yellow outline                                   ║
║  │ └─────────────────┘  │                                                                ║
║  │                      │                                                                ║
║  │ ┌─────────────────┐  │                                                                ║
║  │ │ ⚙️ Settings     │  │                                                                ║
║  │ └─────────────────┘  │                                                                ║
║  │                      │                                                                ║
║  └──────────────────────┘                                                                ║
║     240px sidebar                                                                        ║
║     Fixed position                                                                       ║
║     3px border-right                                                                     ║
║                                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────────────────────┐ ║
║  │                          MAIN CONTENT AREA                                         │ ║
║  │  Margin-left: 240px (accounts for sidebar)                                         │ ║
║  │  Max-width: 1600px (centered on large screens)                                     │ ║
║  │  Padding: 20px all sides                                                           │ ║
║  │                                                                                     │ ║
║  │  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐       │ ║
║  │  │  💊 LOG DOSE        Alt+D        │  │  📝 LOG SYMPTOM      Alt+S       │       │ ║
║  │  │                                  │  │                                  │       │ ║
║  │  │  [80px height]                   │  │  [80px height]                   │       │ ║
║  │  │  [24px font, 700 weight]         │  │  [24px font, 700 weight]         │       │ ║
║  │  │  [32px emoji icon]               │  │  [32px emoji icon]               │       │ ║
║  │  │  Green #10b981 bg                │  │  Blue #60a5fa bg                 │       │ ║
║  │  │  4px yellow border                │  │  4px yellow border                │       │ ║
║  │  │  6-8px box shadow                 │  │  6-8px box shadow                 │       │ ║
║  │  │                                  │  │                                  │       │ ║
║  │  │  Hover: Lift -3px                │  │  Hover: Lift -3px                │       │ ║
║  │  │  Active: Scale 0.98              │  │  Active: Scale 0.98              │       │ ║
║  │  │  Focus: 4px yellow outline       │  │  Focus: 4px yellow outline       │       │ ║
║  │  └──────────────────────────────────┘  └──────────────────────────────────┘       │ ║
║  │                                                                                     │ ║
║  │  ╔═══════════════════════════════════════════════════════════════════════════╗    │ ║
║  │  ║                    THREE-COLUMN GRID LAYOUT                               ║    │ ║
║  │  ╠═══════════════╦══════════════════════════════════════╦════════════════════╣    │ ║
║  │  ║ LEFT COLUMN   ║        CENTER COLUMN                ║   RIGHT COLUMN     ║    │ ║
║  │  ║               ║                                      ║                    ║    │ ║
║  │  ║ ┌───────────┐ ║ ┌──────────────────────────────────┐ ║ ┌────────────────┐ ║    │ ║
║  │  ║ │ ✓ Feeling │ ║ │ 📊 Your Symptom Trends           │ ║ │ 📈 Progress    │ ║    │ ║
║  │  ║ │   Good    │ ║ │    (Last 24 Hours)               │ ║ │    This Week   │ ║    │ ║
║  │  ║ │ [50px    │ ║ │                                  │ ║ │                │ ║    │ ║
║  │  ║ │  icon]   │ ║ │    5│            •                │ ║ │ 💊 92%         │ ║    │ ║
║  │  ║ │ [24px    │ ║ │     │      ╱───╲ ╱╲               │ ║ │  On-time       │ ║    │ ║
║  │  ║ │  value]  │ ║ │    4│   ╱◉      ◉  ╲   ╱──╲       │ ║ │  Doses         │ ║    │ ║
║  │  ║ └───────────┘ ║ │     │ ╱            ╲╱    ╲       │ ║ │                │ ║    │ ║
║  │  ║               ║ │    3│╱─────────────────────╲──    │ ║ │ [Progress bar] │ ║    │ ║
║  │  ║ ┌───────────┐ ║ │     │                            │ ║ │ [12px height]  │ ║    │ ║
║  │  ║ │ 🕐 Next   │ ║ │    2│                            │ ║ └────────────────┘ ║    │ ║
║  │  ║ │ Dose at   │ ║ │     │                            │ ║                    ║    │ ║
║  │  ║ │ 2:00 PM   │ ║ │    1│                            │ ║ ┌────────────────┐ ║    │ ║
║  │  ║ │ [18px    │ ║ │     │                            │ ║ │ 🎯 14 Days     │ ║    │ ║
║  │  ║ │  label]  │ ║ │    0└──────────────────────────  │ ║ │    Activity    │ ║    │ ║
║  │  ║ │ [24px    │ ║ │     12AM 4AM 8AM 12PM 4PM 8PM   │ ║ │    Streak      │ ║    │ ║
║  │  ║ │  value]  │ ║ │                                  │ ║ └────────────────┘ ║    │ ║
║  │  ║ └───────────┘ ║ │ [400px height chart]             │ ║                    ║    │ ║
║  │  ║               ║ │ [6px line thickness]             │ ║ ┌────────────────┐ ║    │ ║
║  │  ║ ┌───────────┐ ║ │ [10px medication dots]           │ ║ │ 🛡️ 7 Days     │ ║    │ ║
║  │  ║ │ 43%       │ ║ │ [16px axis labels]               │ ║ │   No Falls     │ ║    │ ║
║  │  ║ │ Parkin-   │ ║ │                                  │ ║ │                │ ║    │ ║
║  │  ║ │ son's     │ ║ │ [•] Your Symptoms (Blue)         │ ║ │ Stay Safe! ✓   │ ║    │ ║
║  │  ║ │ Progress  │ ║ │ [•] Medication (Yellow)          │ ║ └────────────────┘ ║    │ ║
║  │  ║ │ [64px    │ ║ │ [18px legend with icons]         │ ║                    ║    │ ║
║  │  ║ │  value]  │ ║ │                                  │ ║                    ║    │ ║
║  │  ║ │ [900     │ ║ │ ┌────────────────────────────┐   │ ║                    ║    │ ║
║  │  ║ │  weight] │ ║ │ │ 📋 Summary:                │   │ ║                    ║    │ ║
║  │  ║ └───────────┘ ║ │ │ Your symptoms were stable  │   │ ║                    ║    │ ║
║  │  ║               ║ │ │ today. Peak levels at 6AM  │   │ ║                    ║    │ ║
║  │  ║ ┌───────────┐ ║ │ │ and 4PM. You're doing well!│   │ ║                    ║    │ ║
║  │  ║ │ 54%       │ ║ │ └────────────────────────────┘   │ ║                    ║    │ ║
║  │  ║ │ Muscle    │ ║ │ [18px text, yellow highlights]   │ ║                    ║    │ ║
║  │  ║ │ Rigidity  │ ║ │ [Left border: 4px yellow]        │ ║                    ║    │ ║
║  │  ║ │           │ ║ └──────────────────────────────────┘ ║                    ║    │ ║
║  │  ║ │ Morning:  │ ║                                      ║                    ║    │ ║
║  │  ║ │  3.2/5    │ ║ ┌──────────────────────────────────┐ ║                    ║    │ ║
║  │  ║ │ Afternoon:│ ║ │ Muscle Rigidity Score            │ ║                    ║    │ ║
║  │  ║ │  2.1/5    │ ║ │                                  │ ║                    ║    │ ║
║  │  ║ │ Evening:  │ ║ │     54% Severity                 │ ║                    ║    │ ║
║  │  ║ │  2.8/5    │ ║ │     [64px, 900 weight]           │ ║                    ║    │ ║
║  │  ║ │ [36px    │ ║ │                                  │ ║                    ║    │ ║
║  │  ║ │  values] │ ║ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ║                    ║    │ ║
║  │  ║ └───────────┘ ║ │                                  │ ║                    ║    │ ║
║  │  ║               ║ │ Morning    Afternoon    Evening  │ ║                    ║    │ ║
║  │  ║ ┌───────────┐ ║ │  3.2/5       2.1/5       2.8/5  │ ║                    ║    │ ║
║  │  ║ │ 📝 Notes  │ ║ │ [18px labels, 36px values]       │ ║                    ║    │ ║
║  │  ║ │           │ ║ └──────────────────────────────────┘ ║                    ║    │ ║
║  │  ║ │ Track     │ ║                                      ║                    ║    │ ║
║  │  ║ │ daily obs │ ║                                      ║                    ║    │ ║
║  │  ║ │           │ ║                                      ║                    ║    │ ║
║  │  ║ │ ┌───────┐ │ ║                                      ║                    ║    │ ║
║  │  ║ │ │ Entry │ │ ║                                      ║                    ║    │ ║
║  │  ║ │ │ [14px]│ │ ║                                      ║                    ║    │ ║
║  │  ║ │ └───────┘ │ ║                                      ║                    ║    │ ║
║  │  ║ │           │ ║                                      ║                    ║    │ ║
║  │  ║ │ ┌───────┐ │ ║                                      ║                    ║    │ ║
║  │  ║ │ │Type   │🎤│ ║                                      ║                    ║    │ ║
║  │  ║ │ │here...│ │ │ ║                                      ║                    ║    │ ║
║  │  ║ │ └───────┘ │ ║                                      ║                    ║    │ ║
║  │  ║ │ [60px min]│ ║                                      ║                    ║    │ ║
║  │  ║ │ [Voice:  │ ║                                      ║                    ║    │ ║
║  │  ║ │  40×40px]│ ║                                      ║                    ║    │ ║
║  │  ║ └───────────┘ ║                                      ║                    ║    │ ║
║  │  ╚═══════════════╩══════════════════════════════════════╩════════════════════╝    │ ║
║  │      1fr              2fr                                    1fr                   │ ║
║  │   (Flexible)      (2× wider)                            (Flexible)                │ ║
║  └────────────────────────────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

ACCESSIBILITY ANNOTATIONS:
═══════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🎨 VISUAL ACCESSIBILITY                                                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ High-Contrast Colors:      Dark bg #0a0c10, Text #ffffff (21:1 ratio)              │
│  ✓ Alternative Light Mode:    Cream bg #f5f5f0, Text #1a1a1a (14:1 ratio)             │
│  ✓ Semantic Color Coding:     Green=Good, Blue=Info, Yellow=Important, Red=Alert      │
│  ✓ Large Typography:           Base 18px, Headers 24px+, Values 36-64px               │
│  ✓ Open Sans Font:            Optimized for screen readability                        │
│  ✓ Thick Borders:             3-4px for clear visual separation                       │
│  ✓ Deep Shadows:              6-8px for depth perception                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  📊 GRAPH READABILITY                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Line Thickness:            6px (100% thicker than before)                           │
│  ✓ Data Point Size:           10px medication dots, 9px fall events                    │
│  ✓ Axis Labels:               16px font (45% larger than before)                       │
│  ✓ Grid Opacity:              15% (3× more visible than before)                        │
│  ✓ High-Contrast Colors:      Blue #60a5fa (symptom), Yellow #fbbf24 (medication)     │
│  ✓ Textual Summary:           Plain-language explanation below chart                   │
│  ✓ Legend with Icons:         18px text + visual dots + borders                        │
│  ✓ Chart Height:              400px (desktop) for comfortable viewing                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🖱️ MOTOR ACCESSIBILITY                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Button Height:             80px (82% larger than 44px WCAG minimum)                 │
│  ✓ Menu Item Height:          60px (36% larger than minimum)                           │
│  ✓ Touch Target Spacing:      24px gaps between all clickable elements                 │
│  ✓ Theme Toggle Size:         60×60px circle (always accessible)                       │
│  ✓ Voice Button:              40×40px (within textarea, bottom-right)                  │
│  ✓ Hover Feedback:            Lift effect (-3px translateY)                            │
│  ✓ Active Feedback:           Scale down (0.98) for press sensation                    │
│  ✓ Focus Indicators:          4px yellow outline on all interactive elements           │
│  ✓ Border Thickness:          3-4px for easy targeting                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🧠 COGNITIVE ACCESSIBILITY                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Plain Language:            "Feeling Good" vs "Status: Normal"                       │
│  ✓ Conversational Time:       "In 2 hours (2:00 PM)" vs "14:00"                        │
│  ✓ Positive Messaging:        "You're doing well!" vs clinical reports                 │
│  ✓ Icons Everywhere:          💊📝✓🎤☀️🌙 for visual recognition                         │
│  ✓ Chart Summaries:           "Your symptoms were stable today..."                     │
│  ✓ Status Badges:             Color-coded with icons (✓ Taken, 🕐 Due, etc.)          │
│  ✓ Clear Hierarchy:           Headers 24px, values 36-64px, body 18px                  │
│  ✓ Consistent Layout:         Same structure across all sections                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ⌨️ KEYBOARD ACCESSIBILITY                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Alt+D:                     Quick dose logging from anywhere                         │
│  ✓ Alt+S:                     Open symptom entry with focus                            │
│  ✓ Alt+T:                     Toggle light/dark theme instantly                        │
│  ✓ Tab Navigation:            Logical order through all interactive elements           │
│  ✓ Enter/Space:               Activate buttons and controls                            │
│  ✓ Escape:                    Close dialogs and cancel actions                         │
│  ✓ Focus Management:          4px yellow outline, high contrast                        │
│  ✓ Skip Links:                Navigate to main content quickly                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🎤 VOICE ACCESSIBILITY                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Voice Input Button:        40×40px microphone icon in textarea                      │
│  ✓ Recording Indicator:       Red background + pulse animation                         │
│  ✓ Real-time Transcription:   Text appears as you speak                                │
│  ✓ Error Handling:            Clear permission requests                                │
│  ✓ Keyboard Activation:       Focus + Space to start/stop recording                    │
│  ✓ Visual Feedback:           🎤 → ⏹️ icon swap while recording                        │
│  ✓ Auto-save:                 Transcription saved on completion                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🌗 THEME SYSTEM                                                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Dark Mode (Default):      Deep black bg, pure white text (21:1 contrast)           │
│  ✓ Light Mode:               Off-white bg, charcoal text (14:1 contrast)              │
│  ✓ Toggle Button:            60×60px circle, top-right, always visible                │
│  ✓ Icon Feedback:            🌙 (dark) ⇄ ☀️ (light) instant swap                      │
│  ✓ Keyboard Shortcut:        Alt+T from anywhere on page                              │
│  ✓ CSS Variables:            Instant theme switching, no page reload                  │
│  ✓ Persistence:              Preference saved to localStorage                         │
│  ✓ Tooltip:                  "Switch to light/dark mode (Alt+T)"                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  📱 RESPONSIVE DESIGN                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Desktop (1400px+):         Full 3-column layout, 240px sidebar                      │
│  ✓ Tablet (992px):            Icon-only sidebar (70px), 1-column grid                  │
│  ✓ Mobile (768px):            Stacked layout, 60px sidebar, full-width buttons         │
│  ✓ Small Mobile (576px):      Minimal spacing, 50px sidebar, compact cards             │
│  ✓ Chart Scaling:             400px → 320px → 280px → 180px (graceful)                │
│  ✓ Font Scaling:              Proportional reduction, never below 14px                 │
│  ✓ Touch Targets:             Maintain 60px+ on all screen sizes                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════

WCAG 2.1 LEVEL AAA COMPLIANCE SUMMARY
═════════════════════════════════════

✅ 1.4.3  Contrast (Minimum):           7:1 for normal text (exceeds 4.5:1)
✅ 1.4.6  Contrast (Enhanced):          21:1 in dark mode (exceeds 7:1)
✅ 1.4.11 Non-text Contrast:            All UI components 4.5:1+ contrast
✅ 1.4.12 Text Spacing:                 Adequate line-height (1.6) and spacing
✅ 2.1.1  Keyboard:                     All functions keyboard accessible
✅ 2.1.2  No Keyboard Trap:             Can escape all elements with Tab
✅ 2.4.7  Focus Visible:                4px yellow outline on all elements
✅ 2.5.5  Target Size:                  60px+ (exceeds 44px minimum)
✅ 3.1.1  Language of Page:             HTML lang attribute set
✅ 3.2.3  Consistent Navigation:        Same layout throughout
✅ 3.3.1  Error Identification:         Clear error messages
✅ 3.3.2  Labels or Instructions:       All inputs properly labeled
✅ 4.1.2  Name, Role, Value:            ARIA labels on all interactive elements

═══════════════════════════════════════════════════════════════════════════════════════════

DESIGN PRINCIPLES APPLIED
═════════════════════════

1. **Clarity First**              Every element serves a purpose
2. **Consistency Always**         Same patterns throughout
3. **Feedback Everywhere**        User always knows what's happening
4. **Simplicity Rules**           Remove cognitive load
5. **Accessibility Baked In**     Not an afterthought, but core design
6. **Performance Matters**        Fast load, smooth interactions
7. **User Empowerment**           Confident, independent use

═══════════════════════════════════════════════════════════════════════════════════════════

Last Updated: October 2025
Version: 2.0.0 (Accessibility Overhaul)
Team: StanceSense Development & UX
Contact: accessibility@stancesense.com
```
