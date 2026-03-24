# Chain District — Claude Code Instructions

## MANDATORY: Git & Shipping Workflow

**These are NON-NEGOTIABLE rules. Every Claude session MUST follow them.**

### When the user asks you to commit, push, ship, or create a PR:
1. Run `npm run preflight` — validates lint + typecheck + test. Fix any failures before proceeding.
2. Stage specific changed files with `git add <files>` (avoid blind `git add -A` — the `ship` script does this safely after preflight).
3. Commit with a clear message: `git commit -m "descriptive message"`.
4. Push: `git push -u origin <branch-name>` — retry up to 4x with exponential backoff on network failure.
5. **Output the PR link** to the user: `https://github.com/Wrexist/CryptoStartup/pull/new/<branch-name>`

**Or use the one-liner:** `npm run ship -- "commit message"` — does ALL of the above automatically.

### When the user asks you to start a new feature/branch:
```bash
npm run branch -- <branch-name>
```
This fetches latest `origin/main` and creates a clean branch. NEVER branch from detached HEAD.

### What NOT to do:
- **NEVER** push without running preflight first.
- **NEVER** skip giving the user the PR creation link after pushing.

### Workflow Commands
| Command | What it does |
|---------|-------------|
| `npm run preflight` | Lint + typecheck + test (local CI mirror) |
| `npm run ship -- "msg"` | Preflight + stage + commit + push with retry |
| `npm run branch -- name` | Create feature branch from latest origin/main |
| `npm run typecheck` | Standalone TypeScript check |
| `npm run test` | Run Jest test suite |
| `npm run test:watch` | Jest in watch mode |

### CI/CD (GitHub Actions)
- **`pr-checks.yml`** — Automated PR validation (lint + typecheck + test + build)
- **`eas-ios.yml`** — iOS EAS build + optional TestFlight submit (manual dispatch)
- **`eas-android.yml`** — Android EAS build + optional Play Store submit (manual dispatch)
- **`release.yml`** — Version bump on tag push (v*)

---

## What This Is
Crypto tycoon strategy game. Expo (React Native) mobile/web. Players build mining infrastructure, trade crypto, research upgrades, handle events, and prestige. Dark theme, strategic tone — not flashy or meme-like.

## Mental Model
The game is a **tick-driven idle simulator** with 4 interconnected loops:
1. **Build loop**: Cash → buildings → hash rate → more cash (core engine)
2. **Market loop**: Regime cycle (calm→trending→mania→crash→recovery) modulates all income ±
3. **Research/Achievement loop**: Insight → permanent multipliers that compound across prestiges
4. **Prestige loop**: Reset buildings for +25%/level permanent bonus, unlocking higher tiers

All 4 loops feed each other. Changes to one system ripple through the others — always trace the impact chain before modifying numbers.

## Stack
- Expo SDK 54, React Native 0.81.5, React 19, TypeScript strict
- expo-router v6 (file-based routing in `app/(tabs)/`)
- react-native-reanimated v4, gesture-handler, react-native-svg
- State: React Context (GameContext + MarketContext) + AsyncStorage
- Font: DM Sans (400/500/600/700), Icons: Ionicons + MaterialCommunityIcons
- Path alias: `@/*` maps to project root, `@shared/*` to `shared/`

## File Map

### Core Engine
| File | What it does |
|---|---|
| `contexts/GameContext.tsx` | **THE** central file (~1K lines). Game loop, all state, all actions. Read first for any game logic. |
| `contexts/MarketContext.tsx` | Price simulation. 5 regimes, GBM price model, 3s tick. |

### Screens (expo-router tabs)
| File | Screen |
|---|---|
| `app/_layout.tsx` | Root layout. Provider order: ErrorBoundary > QueryClient > GestureHandler > Keyboard > Market > Game > Toast > Router |
| `app/(tabs)/_layout.tsx` | Tab bar. Liquid Glass on iOS 26+, classic elsewhere. |
| `app/(tabs)/index.tsx` | District — isometric view, build panel, resource bars |
| `app/(tabs)/market.tsx` | Market — regime card, asset prices, sparklines |
| `app/(tabs)/portfolio.tsx` | Portfolio — holdings, trading bots, rig upgrades, prestige |
| `app/(tabs)/research.tsx` | Research — 3 branches, 18 nodes, insight currency |
| `app/(tabs)/settings.tsx` | Settings — stats, reset |

### Components
| File | What it does |
|---|---|
| `components/IsometricDistrict.tsx` | SVG-based isometric 3D district renderer |
| `components/BuildingDetailSheet.tsx` | Modal bottom sheet with building details + SVG interiors |
| `components/EventModal.tsx` | Random event popup with choice buttons |
| `components/GameToast.tsx` | Toast system (context + Reanimated). Use `useToast()`. |
| `components/AchievementsGallery.tsx` | Achievement grid with progress & bonus display |
| `components/OfflineEarningsModal.tsx` | Welcome-back modal for offline earnings |
| `components/ErrorBoundary.tsx` + `ErrorFallback.tsx` | Error handling UI with restart + dev stack trace |

### Utilities (lib/)
| File | What it does |
|---|---|
| `lib/format.ts` | `fmt()`, `fmtHash()`, `fmtPrice()`, `fmtCoin()`, `fmtTime()`, `REGIME_COLORS` |
| `lib/query-client.ts` | TanStack Query setup (configured but not actively used) |

### Game Data (constants/)
| File | Contents |
|---|---|
| `constants/colors.ts` | ALL colors. Never hardcode — always `Colors.xxx`. |
| `constants/rigTiers.ts` | 5 tiers: Basic(10GH) > GPU(38) > ASIC(150) > Quantum(600) > Fusion(2000) |
| `constants/contracts.ts` | 12 contract templates |
| `constants/events.ts` | 10 event templates with fireEffect + choices |
| `constants/achievements.ts` | 36 achievements with permanent bonuses |

### Backend (minimal, mostly unused)
`server/index.ts` (Express 5), `server/routes.ts` (empty), `server/storage.ts` (MemStorage only), `shared/schema.ts` (users table only)

## GameState Shape (quick reference)
```
Cash: cash, insight | Buildings: miningRigs(0-9), powerPlants(start:2), coolingHubs(start:2), maintenanceBays, securityOffices
Hardware: wearLevel(0-100), rigTiers:number[] | Assets: btcHeld, ethHeld, solHeld, dogeHeld
Bots: bots.{dca,grid,trend,riskGuard} each {active, level, unlocked}
Progression: researchUnlocked:string[], prestigeLevel, totalEarned
Time: gameStartTime, lastSaveTime | Events: activeEffects[], activeContracts[], eventCount, eventHistory[]
Achievements: achievements:string[] | Tracking: totalTradeCount, maniaEarningsSession, zeroWearTicks, crashEarned
```

## Context API

### GameContext (`useGame()`)
- **State**: `game`, `activeEffects`, `pendingEvent`, `offlineEarnings`, `newAchievements`, `completedContractNames`
- **Derived**: `powerCapacity`, `powerUsed`, `coolingCapacity`, `coolingUsed`, `hashRate`, `uptime`, `incomePerTick`, `netWorth`, `totalEarned`
- **Actions**: `buyBuilding(type)`, `getBuildingCost(type)`, `toggleBot(bot)`, `getBotActivationCost(bot)`, `unlockResearch(nodeId, cost)`, `buyAsset(symbol, cashAmt)`, `sellAsset(symbol, coinAmt)`, `performPrestige()`, `upgradeRig(slot, toTier)`, `getRigUpgradeCostFn(slot, toTier)`, `resolveEvent(id, choiceIdx)`, `clearOfflineEarnings()`, `clearNewAchievements()`, `clearCompletedContractNames()`
- **Flags**: `canPrestige`, `prestigeRequirement`

### MarketContext (`useMarket()`)
- **State**: `market.{regime, regimeLabel, assets:AssetPrice[], tick}`
- **Helpers**: `getBtcPrice()`

## Formatting Utilities (`lib/format.ts`)
`fmt(n)` → `"$1.50M"` | `fmtHash(h)` → `"1.00 TH/s"` | `fmtPrice(symbol, price)` → `"$65,000"`
`fmtCoin(n, symbol)` → `"0.500000 BTC"` | `fmtTime(ms)` → `"16m"` or `"1h 2m"`
`REGIME_COLORS`: `Record<regime, color>` — maps regime names to `Colors.*`

## Game Mechanics Quick Reference

### Tick System
Both contexts run `setInterval` at **3000ms**. NEVER change this — everything is calibrated to it.

### Tick Loop Order (GameContext)
1. `getDerivedStats()` — hash, power, uptime, income, insight
2. Wear update — increase by rate, decrease by maintenance
3. Bot crash check — 5% fail rate in crash regime (auto-disable with `rsk_05`)
4. Income calculation — base mining + bots → cash
5. Contract progress — 8 types: hash/earnings/uptime/wear/bots/spend/research/events
6. Contract completion — rewards cash/insight
7. Achievement check — all 36 definitions scanned
8. Contract generation — spawn new if slots available
9. Event trigger — fires outside `setGame` (60-120 tick interval)

### Income Formula (per tick)
```
hashRate = sum(rigTier[i].hash) × powerEff × coolingEff × uptime × overclockMult × hashAchMult
baseIncome = (hashRate / 1,000,000) × btcPrice × 3 × regimeMult × incomeEffects
botIncome = sum(activeBotIncomes) × botMult × botAchMult
total = (baseIncome + botIncome) × (1 + prestigeLevel × 0.25) × incomeAchMult
```

### Key Numbers
| Constant | Value |
|---|---|
| Tick interval | 3000ms |
| Cost scaling | 1.18× per building |
| Starting cash | $12,000 |
| Max mining rigs | 9 |
| Prestige formula | $500K × 3^level |
| Prestige bonus | +25% per level |
| Offline cap | 4 hours, 50% rate |
| Event interval | 60-120 ticks random |
| Save key | `@chain_district_save_v2` |

### Market Regimes
| Regime | Income × | Vol | Drift | Duration |
|---|---|---|---|---|
| calm | 1.0 | 0.008 | +0.0002 | 15-25 ticks |
| trending | 1.3 | 0.015 | +0.003 | 10-18 |
| mania | 1.8 | 0.03 | +0.008 | 5-10 |
| crash | 0.4 | 0.025 | -0.012 | 5-12 |
| recovery | 1.1 | 0.018 | +0.005 | 8-15 |

### Rig Tiers
| Tier | Name | Hash | Power | Cooling | Cost | Prestige |
|---|---|---|---|---|---|---|
| 0 | Basic Rig | 10 | 10 | 8 | $800 | 0 |
| 1 | GPU Array | 38 | 25 | 20 | $6K | 0 |
| 2 | ASIC Blade | 150 | 70 | 50 | $32K | 0 |
| 3 | Quantum Rig | 600 | 180 | 120 | $200K | 2 |
| 4 | Fusion Core | 2000 | 400 | 280 | $1.2M | 4 |

### Wear System
```
wearIncrease = wearRate × wearMult × (rigs / (maintenanceBays × 3 + 1))
wearRepair = maintenanceBays × (autoMaintenance ? 0.4 : 0.2)
uptime = max(0, 1 - wearLevel / 200)
```
wearRate: 0.1 base (0.075 with research). At wear 100 → 50% uptime loss.

### Bot Income (base per tick)
DCA: $120 (free) | Grid: $380 ($2.5K) | Trend: $720 ($6K) | RiskGuard: $350 ($8K)

## UI Conventions

### Colors — always `Colors.xxx` from `@/constants/colors`
- Backgrounds: `background`, `surface`, `surfaceElevated`, `surfaceHigh`
- Accents: `accent` (blue), `accentGreen`, `accentRed`, `accentAmber`, `accentPurple`
- Dim variants: `accentGreenDim` etc. for subtle backgrounds
- Text: `textPrimary`, `textSecondary`, `textMuted`
- Alpha hex: `color + '22'` for tinted bg, `+ '44'`/`'55'` for borders

### Typography
- `DMSans_400Regular` — body | `DMSans_500Medium` — labels | `DMSans_600SemiBold` — titles, buttons | `DMSans_700Bold` — headings, big numbers
- Section headers: UPPERCASE, fontSize 10, letterSpacing 2, `DMSans_600SemiBold`, `Colors.textMuted`

### Component Patterns
- **Cards**: `backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border`
- **Buttons**: `borderRadius: 12-14, paddingVertical: 14-16, borderWidth: 1`, disabled state uses `surfaceHigh`/`border`
- **Haptics**: Always gate — `if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
- **Animations**: `useNativeDriver: Platform.OS !== 'web'`. Press scale: 0.95-0.97 → 1.0
- **Safe area**: `const topInset = Platform.OS === 'web' ? 67 : insets.top`

## How to Add Things

### New Building Type
1. Add count field to `GameState` in `GameContext.tsx`
2. Add to `BASE_COSTS`, `buyBuilding`, `getBuildingCost`, `getBuildingCount`
3. Add to `defaultGame()` initial state
4. Add to `BUILDING_CONFIG_ORDER` in `app/(tabs)/index.tsx`
5. Add to `BUILDING_CONFIG` in `BuildingDetailSheet.tsx` + create SVG interior
6. Add to `IsometricDistrict.tsx` grid layout

### New Achievement
1. Add `AchievementDefinition` to `ACHIEVEMENTS` in `constants/achievements.ts`
2. Add check in `checkAchievements()` in `GameContext.tsx`
3. Bonus system auto-picks up existing bonus types (income_pct, hash_pct, etc.)

### New Contract Template
1. Add to `CONTRACT_TEMPLATES` in `constants/contracts.ts`
2. If new `type`, add progress tracking in GameContext tick loop switch statement

### New Event
1. Add to `GAME_EVENTS` in `constants/events.ts`
2. If special behavior needed, add handling in `resolveEvent()` in GameContext
3. Standard events with just effects need no GameContext changes

### New Research Node
1. Add to `RESEARCH_NODES` in GameContext (correct branch)
2. Add effect handling in `getDerivedStats()` where research bonuses apply
3. Keep `requires` chain correct

### New Screen/Tab
1. Create `app/(tabs)/newscreen.tsx`
2. Add tab config in `app/(tabs)/_layout.tsx` (both NativeTabLayout and ClassicTabLayout)
3. Follow pattern: ScrollView, topInset, UPPERCASE section headers

### New Test
1. Create `__tests__/` directory adjacent to the file being tested
2. Name: `filename.test.ts` (or `.test.tsx` for components)
3. Uses `jest-expo` preset — path aliases (`@/`, `@shared/`) work automatically
4. Run `npm run test` to verify

## Ripple Effects — If You Change X, Also Check Y
| Changed | Also update/verify |
|---------|-------------------|
| Income formula / multipliers | `__tests__/balance.test.ts`, Bot Income section, Prestige bonus calc |
| `RIG_TIERS` (costs/hash) | `__tests__/balance.test.ts`, `BuildingDetailSheet.tsx` (upgrade UI), `IsometricDistrict.tsx` |
| `GameState` shape | `defaultGame()`, save/load handler (migration), save key version |
| Achievement definitions | `checkAchievements()` in GameContext, `AchievementsGallery.tsx` |
| Research nodes | `getDerivedStats()` effects, `research.tsx` UI |
| Market regimes | `MarketContext.tsx` REGIMES, `market.tsx` REGIME_INFO display |
| `BOT_COSTS` or bot income | `portfolio.tsx` bot cards, `__tests__/balance.test.ts` |
| Building types | 6-step checklist in "How to Add Things > New Building Type" |
| Provider order (`_layout.tsx`) | **NEVER change** — GameContext depends on MarketContext |
| Constants in CLAUDE.md | Verify against source — numbers go stale (see `tasks/lessons.md`) |

## Critical Rules

### DO NOT
- Change the 3000ms tick interval
- Modify provider nesting order in `app/_layout.tsx` (GameContext depends on MarketContext)
- Use `useState` for derived game values — use `useMemo`/`useCallback`
- Hardcode colors — always `Colors.xxx`
- Use `useNativeDriver: true` without platform check
- Forget `Platform.OS !== 'web'` before Haptics calls
- Add async operations inside `setGame()` updater functions

### State Update Pattern
All GameContext actions follow this ref-then-setter pattern (critical for correctness):
```tsx
const doSomething = useCallback(() => {
  const g = gameRef.current;           // 1. Read LIVE state from ref (not stale closure)
  if (!canDoSomething(g)) return;      // 2. Validate against current state
  setGame(prev => {                    // 3. Functional update for React batching
    const next = { ...prev, /* changes */ };
    saveGame(next);                    // 4. Persist inside updater
    return next;
  });
}, []);                                // 5. Empty deps — ref access means no stale closures
```
Never read from `game` state variable inside actions — always use `gameRef.current`. This is why the pattern exists.

### Save Key Migration
Current: `@chain_district_save_v2`. If GameState shape changes, either add migration logic in the load handler (with `{ ...defaultGame(), ...saved }` merge) or bump the version.

## Dev Commands
```bash
npm run start         # Expo start (local)
npm run expo:dev      # Expo dev (Replit)
npm run server:dev    # Express backend
npm run lint          # ESLint check
npm run lint:fix      # ESLint autofix
npm run typecheck     # TypeScript type-check (standalone)
npm run test          # Run Jest test suite
npm run test:watch    # Jest in watch mode
npm run preflight     # Lint + typecheck + test (local CI check)
npm run ship -- "msg" # Preflight + commit + push (one command)
npm run branch -- name # Create feature branch from latest origin/main
npm run db:push       # Push Drizzle migrations
```

## Workflow
- Plan in `tasks/todo.md` before multi-step work
- Track lessons in `tasks/lessons.md` after any correction
- Verify changes work before marking complete
