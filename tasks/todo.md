# Chain District — Task Tracker

## Current Sprint

- [ ] *(No active tasks)*

## Bugs

- [ ] **Save key mismatch**: `settings.tsx` reset handler clears `@chain_district_save` but GameContext saves to `@chain_district_save_v2` — reset button doesn't actually clear the game
- [ ] Verify all `fmt()` variants produce consistent output (some screens may show different precision)

## Backlog / Features

- [ ] Manual buy/sell trading UI on Portfolio tab (`buyAsset`/`sellAsset` exist in GameContext but no UI calls them)
- [ ] Achievement unlock toast notifications when earned
- [ ] Contract completion celebration UI
- [ ] Event history / log screen
- [ ] Offline earnings summary modal (currently just a toast)
- [ ] Sound effects system

## Technical Debt

- [ ] Extract shared `fmt()` / `fmtHash()` into `utils/format.ts` (duplicated across 4+ screens)
- [ ] Extract `REGIME_COLORS` map into constants (duplicated in index.tsx and market.tsx)
- [ ] Add testing setup (Jest + React Native Testing Library)
- [ ] Type building type strings more strictly (uses string literals inconsistently)
- [ ] Server routes are empty placeholders — decide if backend is needed or remove

## Game Balance

- [ ] Review income curve — players may stall between prestige 1 and 2
- [ ] Evaluate Quantum Rig ($250K) reachability at prestige 2
- [ ] Consider 5th rig tier for prestige 3+
- [ ] Bot income may be too low relative to mining in mid/late game
- [ ] Crash regime multiplier (0.4x) may be too punishing without research

## Polish

- [ ] Loading/skeleton states for initial app load
- [ ] Smooth animated transitions on regime changes
- [ ] Pull-to-refresh gesture on Market tab
- [ ] Building interior SVGs could animate (spinning fans, blinking LEDs)

## Completed

*(Move items here when done, with date and brief note.)*

## Review

*(After completing a task, note test results or verification here.)*
