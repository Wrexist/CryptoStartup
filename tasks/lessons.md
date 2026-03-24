# Lessons Learned

> **This file is maintained by Claude.** After completing any task, Claude should update this file with discoveries, gotchas, and patterns learned. This prevents repeating mistakes and builds project knowledge over time.

Review this at the start of each session.

## Architecture Gotchas

### 2026-03-24 — Game constants belong in constants/gameConstants.ts
- **What happened**: GameContext.tsx had 50+ hardcoded magic numbers (tick intervals, multipliers, fees, thresholds). All extracted to `constants/gameConstants.ts`.
- **Pattern to watch for**: Any new game formula values added inline to GameContext.
- **Rule going forward**: Always define numeric constants in `gameConstants.ts` and import them. Never hardcode game balance numbers inline.

### 2026-03-24 — Event resolveEvent must always call saveGame
- **What happened**: `govt_seizure` event handler modified state (removed a rig) but didn't call `saveGame()`, so the change was lost on reload.
- **Pattern to watch for**: Any new event handler branch in `resolveEvent()`.
- **Rule going forward**: Every `return state` path in `resolveEvent()` must call `saveGame(state)` first.

### 2026-03-24 — Initial state includes pre-built buildings
- **What happened**: Players start with 2 Power Plants + 2 Cooling Hubs already built. The `buyBuilding` cost calculation offsets for these initial counts.
- **Pattern to watch for**: Any new building cost logic or initial state changes.
- **Rule going forward**: Always check `defaultGame()` for initial building counts when modifying cost formulas.

### 2026-03-24 — Research effects are hardcoded in getDerivedStats()
- **What happened**: Research node effects aren't looked up dynamically — they're hardcoded string checks like `researchUnlocked.includes('inf_01')` inside `getDerivedStats()`.
- **Pattern to watch for**: Adding new research nodes. The node definition alone won't do anything.
- **Rule going forward**: After adding a research node, always add matching effect handling in `getDerivedStats()`.

## Type System Notes

### 2026-03-24 — GameState has no standalone type file
- **Detail**: `GameState` interface is defined inline in `contexts/GameContext.tsx`, not in a shared types directory. `BotState = {active: boolean, level: number, unlocked: boolean}`.
- **Rule going forward**: If GameState shape changes, update the "GameState Shape" section in CLAUDE.md and check save key migration.

### 2026-03-24 — Hardcoded colors must use Colors constants
- **What happened**: achievements.ts, contracts.ts, events.ts, rigTiers.ts, and several UI files had hardcoded hex color strings duplicating values from `Colors`. All replaced with `Colors.*` references.
- **Pattern to watch for**: Any new color hex value in data constants or styles.
- **Rule going forward**: Always use `Colors.*` from `constants/colors.ts`. If a new color is needed, add it to Colors first (e.g., `accentCoral` was added for Fusion Core).

## Common Mistakes

### 2026-03-24 — CLAUDE.md numbers go stale
- **What happened**: Rig tiers table documented 4 tiers (code has 5), bot income values were wrong (3/4 outdated), achievement count said 25 (actually 36), Quantum Rig cost said $250K (actually $200K), RiskGuard cost said $12K (actually $8K).
- **Pattern to watch for**: Any game balance tuning that changes numbers in constants/ or GameContext.
- **Rule going forward**: After changing game balance numbers, grep CLAUDE.md for the old values and update them.

## Platform Differences

### 2026-03-24 — Toast animations degrade on web
- **Detail**: `GameToast.tsx` uses Reanimated v4 layout animations. These don't work on web but gracefully degrade (no crash, just no animation).
- **Rule going forward**: Always test toast-heavy flows on web to ensure they don't break, even if animations are absent.

### 2026-03-24 — Bot income has separate prestige multiplier
- **Detail**: Bot income uses `(1 + prestigeLevel × 0.15)`, NOT the main 0.25 prestige multiplier. They are separate paths in the income formula.
- **Pattern to watch for**: Any prestige balance changes — base income and bot income scale differently.

## Performance Notes
<!-- Rendering, tick loop, memory, bundle size discoveries -->

## Entries

*(Seeded with initial discoveries on 2026-03-24. New entries should be added above under the appropriate section.)*
