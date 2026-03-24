# Lessons Learned

> **This file is maintained by Claude.** After completing any task, Claude should update this file with discoveries, gotchas, and patterns learned. This prevents repeating mistakes and builds project knowledge over time.

Review this at the start of each session.

## Architecture Gotchas

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

## Common Mistakes

### 2026-03-24 — CLAUDE.md numbers go stale
- **What happened**: Rig tiers table documented 4 tiers (code has 5), bot income values were wrong (3/4 outdated), achievement count said 25 (actually 36), Quantum Rig cost said $250K (actually $200K), RiskGuard cost said $12K (actually $8K).
- **Pattern to watch for**: Any game balance tuning that changes numbers in constants/ or GameContext.
- **Rule going forward**: After changing game balance numbers, grep CLAUDE.md for the old values and update them.

## Platform Differences

### 2026-03-24 — Toast animations degrade on web
- **Detail**: `GameToast.tsx` uses Reanimated v4 layout animations. These don't work on web but gracefully degrade (no crash, just no animation).
- **Rule going forward**: Always test toast-heavy flows on web to ensure they don't break, even if animations are absent.

## Performance Notes
<!-- Rendering, tick loop, memory, bundle size discoveries -->

## Entries

*(Seeded with initial discoveries on 2026-03-24. New entries should be added above under the appropriate section.)*
