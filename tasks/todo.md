# Chain District — Task Tracker

## Current Sprint

- [ ] *(No active tasks)*

## Bugs

- [ ] Verify all `fmt()` variants produce consistent output (some screens may show different precision)

## Backlog / Features

- [ ] Sound effects system

## Technical Debt

- [ ] Type building type strings more strictly (uses string literals inconsistently)
- [ ] Server routes are empty placeholders — decide if backend is needed or remove
- [ ] Fix pre-existing TS7031 implicit-any in `_layout.tsx` and `query-client.ts`
- [ ] SVG colors in `BuildingDetailSheet.tsx` and `IsometricDistrict.tsx` are still hardcoded (60+ hex values in SVG gradients/strokes)

## Game Balance

- [ ] "Bull Runner" contract target may be unreachable early game

## Polish

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
- [x] **Game balance tuning** — Buffed bot income (Grid/Trend/RiskGuard), prestige reset cash, softened crash to 0.5x, reduced Quantum cost to $200K (2026-03-23)
- [x] **Achievement unlock toasts** — New achievements trigger toast notifications via GameContext queue (2026-03-23)
- [x] **Contract completion toasts** — Completed contracts show toast with name (2026-03-23)
- [x] **Offline earnings modal** — Replaced toast with proper modal showing earnings breakdown (2026-03-23)
- [x] **Loading screen** — Branded loading screen with pulse animation replaces blank screen during font load (2026-03-23)
- [x] **Event history log** — Events stored in GameState.eventHistory, displayed in Settings screen (2026-03-23)
- [x] **Enhanced stats** — Added contracts completed, active bots, events handled, trades to Settings (2026-03-23)
- [x] **Jest setup** — jest-expo with format and balance unit tests (26 passing) (2026-03-23)
- [x] **Extract game constants** — 50+ magic numbers from GameContext extracted to `constants/gameConstants.ts` (2026-03-24)
- [x] **Fix govt_seizure save bug** — Missing `saveGame()` call after rig confiscation event (2026-03-24)
- [x] **Fix hardcoded colors** — Replaced hex color literals in achievements, contracts, events, rigTiers, _layout, market, index, EventModal, +not-found with `Colors.*` references (2026-03-24)
- [x] **Add accentCoral to Colors** — New `#FF6B6B` color for Fusion Core tier (2026-03-24)
- [x] **Fix trade fee preview** — market.tsx sell preview now uses same decimal fee constants as GameContext (2026-03-24)
- [x] **Fix index-based React keys** — portfolio.tsx contract list now uses `templateId_startedAt` instead of array index (2026-03-24)

## Review

- TypeScript: All changes compile clean. Only pre-existing errors remain (missing node_modules, implicit-any in _layout.tsx/server).
- All 4 critical bugs (prestige reset, event save, fire race, wrong save key) fixed and verified.
- Shared `lib/format.ts` replaces 6 duplicate functions across 5 files.
