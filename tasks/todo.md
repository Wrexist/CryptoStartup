# Chain District — Task Tracker

## Current Sprint

- [ ] *(No active tasks)*

## Bugs

- [ ] Verify all `fmt()` variants produce consistent output (some screens may show different precision)

## Backlog / Features

- [ ] Manual buy/sell trading UI on Portfolio tab (`buyAsset`/`sellAsset` exist in GameContext but no UI calls them)
- [ ] Achievement unlock toast notifications when earned
- [ ] Contract completion celebration UI
- [ ] Event history / log screen
- [ ] Offline earnings summary modal (currently just a toast)
- [ ] Sound effects system
- [ ] Rig upgrade UI (upgradeRig/getRigUpgradeCostFn exist but no screen uses them)

## Technical Debt

- [ ] Add testing setup (Jest + React Native Testing Library)
- [ ] Type building type strings more strictly (uses string literals inconsistently)
- [ ] Server routes are empty placeholders — decide if backend is needed or remove
- [ ] Fix pre-existing TS7031 implicit-any in `_layout.tsx` and `query-client.ts`

## Game Balance

- [ ] Review income curve — players may stall between prestige 1 and 2
- [ ] Evaluate Quantum Rig ($250K) reachability at prestige 2
- [ ] Consider 5th rig tier for prestige 3+
- [ ] Bot income may be too low relative to mining in mid/late game
- [ ] Crash regime multiplier (0.4x) may be too punishing without research
- [ ] "Bull Runner" contract target may be unreachable early game

## Polish

- [ ] Loading/skeleton states for initial app load
- [ ] Smooth animated transitions on regime changes
- [ ] Pull-to-refresh gesture on Market tab
- [ ] Building interior SVGs could animate (spinning fans, blinking LEDs)
- [ ] Market screen is view-only — consider showing player holdings

## Completed

- [x] **Save key mismatch** — `settings.tsx` reset now clears `@chain_district_save_v2` (2025-02-28)
- [x] **totalEarned reset on prestige** — Preserved lifetime stats across prestige (2025-02-28)
- [x] **Event resolution not saved** — Added `saveGame()` to all `resolveEvent` paths (2025-02-28)
- [x] **Fire effect race condition** — Atomic save inside fire effect `setGame` (2025-02-28)
- [x] **Hash contracts complete instantly** — Added `hashThreshold` for sustained tracking (2025-02-28)
- [x] **Achievement description mismatch** — `max_infra` now says "7" to match code (2025-02-28)
- [x] **Extract fmt() to shared utility** — `lib/format.ts` replaces all local copies (2025-02-28)
- [x] **No feedback on failed purchases** — Toast with cost info on insufficient funds (2025-02-28)
- [x] **Memoize derived stats** — `useMemo` on `getDerivedStats` + `computeNetWorth` at render (2025-02-28)
- [x] **Expose totalEarned in context** — Added to `GameContextValue` interface + value (2025-02-28)
- [x] **Building cost -2 offset** — Confirmed intentional: flat pricing for first few infrastructure buildings (2025-02-28)

## Review

- TypeScript: All changes compile clean. Only pre-existing errors remain (missing node_modules, implicit-any in _layout.tsx/server).
- All 4 critical bugs (prestige reset, event save, fire race, wrong save key) fixed and verified.
- Shared `lib/format.ts` replaces 6 duplicate functions across 5 files.
