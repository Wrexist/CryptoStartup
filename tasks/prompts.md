# Chain District — Reusable Prompts (Optimized for Claude Opus)

Copy-paste these into Claude Code sessions. Each prompt is self-contained — CLAUDE.md provides the project context automatically.

---

## 1. GAME AUDIT — Full Health Check

```
You are a senior game developer and QA lead performing a comprehensive audit of Chain District. Your job is to find everything that's broken, unbalanced, or hurting the player experience — then rank it by severity so I know what to fix first.

Read every file in the codebase. For each of these dimensions, investigate thoroughly:

**Balance**: Simulate a new player's progression from $12K cash through prestige 2. At each stage, calculate actual income per minute, time-to-next-purchase, and identify any point where the player stalls for more than 5 minutes with nothing meaningful to do. Check if any strategy trivially dominates all others.

**Bugs**: Trace the tick loop in GameContext.tsx line by line. Check for: stale closures reading `game` instead of `gameRef.current`, effects that expire at wrong times, contracts that can't complete, achievements with impossible conditions, state that survives a prestige when it shouldn't (or vice versa). Check the save/load cycle — can data be lost?

**Dead code**: Identify functions defined but never called, state fields set but never read, imports unused, UI referencing data that doesn't exist. Be precise — show the definition and confirm zero call sites.

**UX gaps**: For each screen, note where the player lacks information to make a decision, where actions have no feedback, and where the UI doesn't communicate what just happened.

**Performance**: The game ticks every 3 seconds with React Context. Identify any component that re-renders unnecessarily on each tick. Check useMemo dependency arrays. Flag any O(n) or worse computation running every tick.

**Output format**: A single prioritized table:
| # | Severity | Category | File:Line | Issue | Recommended Fix |
Start with critical (crashes, data loss, game-breaking exploits), then important (bad UX, balance problems), then polish.
```

---

## 2. FEATURE BRAINSTORM — New Content Ideas

```
You are a mobile game designer who specializes in idle/tycoon games. You've just been handed the Chain District codebase and told "make it more engaging without rewriting the architecture."

First, read the complete codebase to understand every existing system, progression path, and player interaction. Map out the current engagement loop and where it goes flat.

Then brainstorm features, organized by implementation effort:

**Quick Wins (under 50 lines of code each)**
New content using existing data structures — achievements, contracts, events, research nodes that slot directly into the current system. UI additions that surface existing data in more useful ways. Quality-of-life improvements that reduce friction.

**Medium Features (100-300 lines each)**
New mechanics that extend existing systems — new building types, new bot strategies, new market dynamics. Screen additions or major UI overhauls. Systems that add meaningful decisions.

**Ambitious Features (500+ lines)**
Entirely new dimensions — multiplayer, cloud saves, procedural generation, meta-progression. Features that fundamentally expand what the game is.

For each idea, provide:
- **What**: One sentence description
- **Why**: Which player motivation does it serve? (Progression? Mastery? Collection? Competition? Expression?)
- **Where**: Exact files and systems it plugs into
- **Hook**: How it creates a reason to keep playing or come back tomorrow
- **Effort**: Realistic line count estimate

Rank ideas within each tier by engagement-per-line-of-code. The best feature is the one that makes the most players play one more session, with the least implementation effort.
```

---

## 3. ECONOMY BALANCE — Math Deep-Dive

```
You are a game economist analyzing Chain District's mathematical model. Your goal is to find every place where the numbers create a bad player experience — grinding walls, trivialized content, broken multiplier stacking, or unclear optimal strategies.

Read GameContext.tsx, MarketContext.tsx, and every file in constants/ to extract the complete economic model. Then:

**Step 1 — Map the formulas**: Write out every income source, every cost curve, every multiplier, and every bonus. Include the exact code references. This is your source of truth.

**Step 2 — Simulate progression**: Build a timeline from game start through prestige 3. For each phase, calculate:
- Active income per minute (mining + all bots)
- Passive income per minute (offline earnings rate)
- Cost of next meaningful purchase
- Minutes of play to afford it
- Net worth at that point
Present this as a table with columns: Phase | Income/min | Next Goal | Cost | Time to Goal | Cumulative Playtime

**Step 3 — Find the problems**:
- Where does time-to-goal exceed 10 minutes with no intermediate purchases? (dead zone)
- Where is time-to-goal under 30 seconds for multiple purchases in a row? (trivial zone)
- At what point do bots become irrelevant vs mining? (or vice versa)
- Does the Quantum Rig ($250K, prestige 2 required) arrive at a time when the player can actually afford it?
- How do achievement + research + prestige multipliers stack at endgame? Does income explode or plateau?

**Step 4 — Prescribe fixes**: For each problem, give an exact number change with reasoning:
- "Change X from Y to Z because [explanation with math]"
- Show the before/after progression timeline for your recommended changes
- Ensure fixes don't create new problems elsewhere in the system

Be quantitative. Show your math. No hand-waving.
```

---

## 4. UI/UX POLISH — Visual & Interaction Audit

```
You are a senior mobile UI/UX designer reviewing Chain District. The goal: make the game feel premium and polished with surgical, targeted changes — not a redesign.

Read every screen (app/(tabs)/*.tsx) and every component (components/*.tsx). For each, evaluate against these criteria:

**Information Architecture**: Is the most critical data (income, cash, regime) the most visually prominent? Can a player glance at any screen for 2 seconds and know what matters?

**Feedback Completeness**: Trace every user action (buy building, toggle bot, unlock research, prestige, resolve event, trade). Does each one have: visual confirmation, haptic feedback (on native), state change animation, and error feedback if the action fails?

**Empty & Edge States**: What does each screen show when: 0 rigs, 0 cash, no active contracts, no achievements, no research unlocked? Are there zero-state prompts guiding the player, or just blank space?

**Animation Quality**: Audit every animated element. Are press scales consistent (0.95-0.97)? Do numbers animate when they change or just snap? Do progress bars fill smoothly? Are regime change transitions visible?

**Visual Consistency**: Check every component against CLAUDE.md conventions. Same card styles, same spacing, same font weights, same color usage. Flag any deviation.

**Output format**: For each finding:
| Screen/Component | Issue | Impact (visual/functional/UX) | Fix (specific code change, not "improve this") |

Prioritize by: changes that affect every session > changes that affect specific moments > pure polish. Focus on the 10 changes that would make the biggest difference to how the game feels.
```

---

## 5. NEW FEATURE — Guided Implementation

```
I want to add: [DESCRIBE YOUR FEATURE HERE]

Follow this exact process:

**Phase 1 — Understand**
- Read CLAUDE.md completely for architecture context and conventions
- Read every file that touches the systems this feature will interact with
- Check tasks/todo.md for related existing items
- Identify the exact data structures, functions, and UI patterns you'll extend

**Phase 2 — Plan**
- List every file that needs changes, in order
- For each file, describe the specific modification (not "update GameContext" but "add `newField: number` to GameState, add handler in tick loop at line X, add action function following the ref-then-setter pattern")
- Identify any edge cases or interactions with existing systems
- Flag any design decisions where there are multiple valid approaches — explain the trade-offs and recommend one

**Phase 3 — Implement**
- Write the code, following every convention in CLAUDE.md:
  - Colors via `Colors.xxx`, never hardcoded
  - DM Sans font weights for typography
  - Haptics gated behind `Platform.OS !== 'web'`
  - State updates via `gameRef.current` read → `setGame` functional update → `saveGame` inside updater
  - Animations with `useNativeDriver: Platform.OS !== 'web'`
- Match the style of surrounding code exactly — if a file uses `StyleSheet.create`, you do too

**Phase 4 — Verify**
- Trace through the feature mentally: what happens on first tick? After 10 ticks? On prestige? On save/load?
- Check for: stale closures, missing platform guards, hardcoded colors, broken save compatibility
- Update tasks/todo.md to mark related items complete

**Phase 5 — Explain**
- Summarize what you built and why each design choice was made
- Note any trade-offs or follow-up improvements
```

---

## 6. BUG HUNT — Systematic Defect Search

```
You are a QA engineer with deep React Native and game development expertise. Your mission: find every bug in Chain District before players do.

Read the entire codebase systematically. For each category below, don't just check — actively try to break it:

**State Integrity**
- Can GameContext and AsyncStorage desync? What if `saveGame()` throws? What if the app crashes mid-save?
- On load, does `{ ...defaultGame(), ...saved }` handle every shape migration correctly? What if a saved state has extra fields from a future version?
- Does `gameRef.current` always match the latest `game` state? Trace every `setGame` call — is `gameRef` updated in the same render cycle?

**Tick Loop Correctness**
- Do effects expire at exactly the right tick, or can they overshoot by one tick?
- If two events fire in the same tick, do their effects stack correctly?
- Does contract progress increment correctly for every contract type? Trace each `case` in the switch.
- Can achievements trigger multiple times? What prevents double-granting?

**Edge Cases**
- 0 cash + auto-buy active: does anything go negative?
- 9 rigs + buy rig: is the limit enforced in both UI and logic?
- Prestige during active event: is the event cleared? Or does it reference stale state?
- Trade asset during crash regime: is the regime multiplier applied to trade price?
- All bots active + crash regime + security breach event: do all income modifiers compose correctly?

**Platform Parity**
- Every `Haptics` call: is it gated with `Platform.OS !== 'web'`?
- Every `useNativeDriver`: is it `Platform.OS !== 'web'`?
- Liquid Glass tab bar: does the fallback path work on Android/web?
- Keyboard handling: does `KeyboardAwareScrollViewCompat` work on all platforms?

**Memory & Performance**
- Are all `setInterval` calls cleaned up in useEffect return?
- Do any arrays grow without bounds (effect history, price history, event log)?
- Are there event listener registrations without corresponding removals?

**Output format** for each bug:
```
### [SEVERITY: crash/data-loss/logic/visual/minor] — Title
**Where**: file:line
**What**: Description of the bug
**Repro**: How to trigger it (or conditions under which it occurs)
**Root cause**: Why it happens
**Fix**: Exact code change (old → new)
```

Prioritize: data loss > crashes > logic errors > visual glitches > minor issues.
```

---

## 7. PERFORMANCE OPTIMIZATION

```
You are a React Native performance engineer. Chain District runs a game loop that updates React Context state every 3 seconds, which triggers re-renders across the entire component tree. Your job is to make it fast.

Read the complete codebase, then analyze:

**Re-render Cascade**
Starting from GameContext's `setGame()` call every tick:
1. Which components consume `useGame()`? List every one.
2. For each consumer, does it use ALL of the context value, or just a subset?
3. Which of those components render expensive subtrees (SVG, long lists, heavy calculations)?
4. Draw the re-render cascade: tick → setGame → Context update → [list every component that re-renders]

**Memoization Audit**
For every `useMemo` and `useCallback` in the codebase:
1. Are the dependency arrays correct? (Missing deps = stale data. Extra deps = wasted re-computation.)
2. Is the memoized computation expensive enough to justify memoization?
3. Are there expensive computations that AREN'T memoized but should be?

**SVG Rendering**
IsometricDistrict.tsx renders complex SVG:
1. Does it re-render on every tick or only when buildings change?
2. If it re-renders on every tick, what's the minimal change needed to prevent that?
3. Are individual building SVGs memoized?

**Context Architecture**
Should GameContext be split? Analyze which consumers need which slices of state:
- Income display needs: cash, incomePerTick, regime
- Building panel needs: building counts, costs, cash
- IsometricDistrict needs: building counts only
- Market screen needs: market state only (already separate)
Would splitting reduce re-renders meaningfully? Quantify.

**Output format**: A prioritized list of optimizations:
| Priority | Impact | Change | File(s) | Effort |
High-impact, low-effort changes first. Include the specific code changes for the top 5.
```

---

## 8. NEW CONTENT BATCH — Expand Game Systems

```
You are a game content designer adding depth to Chain District. Your job: make the game feel richer by adding content that plugs directly into existing systems with zero architectural changes.

Read every file in constants/ to understand the exact data format for each content type. Then create:

**5 New Achievements** (in constants/achievements.ts format)
Design these to reward diverse playstyles, not just "reach bigger number":
- One for a clever strategy most players won't discover immediately
- One for surviving a difficult situation (crash regime, multiple events)
- One for a long-term commitment (cumulative, not single-session)
- One for mastering a specific subsystem (bots, research, contracts)
- One "secret" achievement with a surprising trigger condition
Each must have a meaningful but balanced bonus. Check that the bonus type exists in `computeAchievementBonuses()`.

**3 New Events** (in constants/events.ts format)
Design these to create memorable moments with genuine risk/reward tension:
- One that forces a trade-off between short-term loss and long-term gain
- One that creates an opportunity only well-prepared players can exploit
- One that interacts with the market regime system in an interesting way
Each needs: fireEffect, 2-3 choices with distinct consequences, appropriate duration.

**3 New Contracts** (in constants/contracts.ts format)
Design these to push players toward strategies they might not try on their own:
- One that rewards operating during unfavorable conditions
- One that requires coordination across multiple systems
- One with a tight deadline that creates exciting pressure
Ensure each contract's `type` has progress tracking in the GameContext tick loop, or use an existing type.

**2 New Research Nodes**
- One for the Infrastructure branch that opens a new strategic dimension
- One for the Trading branch that makes bots more interesting to manage
Each must specify: id, name, description, cost, branch, requires (prerequisite node), and the mechanical effect.

For ALL content: write the exact TypeScript code to add. Ensure IDs don't conflict with existing entries. Verify that every referenced bonus type, effect type, and contract type is handled in GameContext.tsx.
```

---

## 9. CODE QUALITY — Refactor & Clean Up

```
You are doing a code review of Chain District with the goal of reducing duplication, improving type safety, and making the codebase easier to extend — without changing any behavior.

Read the complete codebase, then identify and fix:

**DRY Violations**
Find every instance of duplicated logic. Known duplications to start with:
- `fmt()` / `fmtHash()` number formatting — duplicated across 4+ screen files
- `REGIME_COLORS` mapping — duplicated between screens
- Building cost calculation patterns
For each: extract to a shared location, update all import sites, verify the extracted version handles all variants.

**Type Safety Gaps**
Find places where TypeScript isn't catching potential bugs:
- Building types as loose strings vs. a union type or enum
- Achievement/event/contract IDs as untyped strings
- Any `as any` casts or type assertions that could be eliminated
- Optional fields accessed without null checks
For each: define the stricter type and show the ripple of changes needed.

**File Organization**
GameContext.tsx is 943 lines. Evaluate whether splitting would help:
- Could game actions (buyBuilding, toggleBot, etc.) be a separate file?
- Could derived stats computation (getDerivedStats, computeHashStats) be extracted?
- Could achievement/contract/event logic be in their own modules?
For each potential split: show the exact boundary, the import/export interface, and whether it actually reduces complexity or just moves it.

**Dead Code**
Identify with certainty:
- Functions defined but never called (not just unused — verify across all files)
- State fields set but never read in any component
- Imports that aren't used
- Commented-out blocks that can be deleted

**Rules**: Every refactor must be behavior-preserving. Show before/after for each change. Don't over-engineer — if something works fine as-is and the duplication is only 2 instances, leave it alone.
```

---

## 10. RETENTION & PROGRESSION — Game Design Review

```
You are a game design consultant specializing in mobile idle/tycoon games. You've been hired to evaluate Chain District's player retention and recommend improvements. You've played thousands of hours of Cookie Clicker, Adventure Capitalist, Idle Miner Tycoon, and similar games.

Read the complete codebase — every screen, every mechanic, every number. Then analyze:

**Session Flow Analysis**
Walk through a typical 5-minute session, a 30-minute session, and the first-time experience. At each moment: what is the player doing? What decisions are they making? What are they waiting for? Where do they stop and why?

**Progression Curve**
Map every "unlock moment" on a timeline (first rig, first bot, first research, first achievement, first prestige, etc.). Are they spaced to maintain excitement, or do they cluster and leave dead zones? Compare to best-in-class idle games where unlocks come every 2-5 minutes in early game.

**Decision Depth Audit**
For each player decision point (buy building, choose research, activate bot, resolve event, trade crypto, prestige):
- How many meaningfully different choices exist?
- Is there one clearly optimal choice? (Bad — player is just executing, not deciding)
- Does the optimal choice depend on context like regime, wear level, or prestige level? (Good — player must think)

**Return Triggers**
What in the current game creates a reason to open the app tomorrow? (Offline earnings is passive — it's not a trigger, it's a reward.) Identify what's missing compared to successful mobile games:
- Daily challenges or rotating contracts?
- Limited-time market events?
- Streak bonuses?
- Notification-worthy milestones?

**Prestige Satisfaction**
Analyze the prestige loop: does +25% per level feel good enough to justify losing everything? How long does it take to "catch up" to where you were? Is the answer obvious or does the player agonize? (Agonizing is good — it means the decision has weight.)

**Output**: For each recommendation, provide:
- **The problem** it solves (with evidence from the codebase)
- **The implementation** as a specific, detailed design (not "add daily rewards" but the exact contract template, reward amounts, and reset timing)
- **The files** that would need to change
- **Why it works** — reference proven patterns from successful idle games
- **What to watch out for** — potential downsides or balance risks

Limit to your top 7 recommendations, ranked by expected retention impact per implementation effort.
```

---

## Usage Guide

**Maintenance cycle**: Start with `1` (audit) or `6` (bug hunt) → fix the top findings with `5` → run `3` to verify balance

**Content cycle**: Run `2` (brainstorm) → pick the best ideas → implement with `5` → add content with `8` → verify with `3`

**Polish cycle**: Run `4` (UI/UX) → implement top fixes with `5` → run `7` (performance) for optimization

**Strategic planning**: Run `10` (retention) for game design direction → use `2` to generate specific feature ideas → implement with `5`
