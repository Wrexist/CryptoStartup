# Chain District — Claude Code Instructions

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
| `contexts/GameContext.tsx` | **THE** central file (943 lines). Game loop, all state, all actions. Read first for any game logic. |
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

### Game Data (constants/)
| File | Contents |
|---|---|
| `constants/colors.ts` | ALL colors. Never hardcode — always `Colors.xxx`. |
| `constants/rigTiers.ts` | 4 tiers: Basic(10GH) > GPU(38) > ASIC(150) > Quantum(600) |
| `constants/contracts.ts` | 12 contract templates |
| `constants/events.ts` | 10 event templates with fireEffect + choices |
| `constants/achievements.ts` | 25 achievements with permanent bonuses |

### Backend (minimal, mostly unused)
`server/index.ts` (Express 5), `server/routes.ts` (empty), `server/storage.ts` (MemStorage only), `shared/schema.ts` (users table only)

## Game Mechanics Quick Reference

### Tick System
Both contexts run `setInterval` at **3000ms**. NEVER change this — everything is calibrated to it.

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
| 3 | Quantum Rig | 600 | 180 | 120 | $250K | 2 |

### Wear System
```
wearIncrease = wearRate × wearMult × (rigs / (maintenanceBays × 3 + 1))
wearRepair = maintenanceBays × (autoMaintenance ? 0.4 : 0.2)
uptime = max(0, 1 - wearLevel / 200)
```
wearRate: 0.1 base (0.075 with research). At wear 100 → 50% uptime loss.

### Bot Income (base per tick)
DCA: $120 (free) | Grid: $280 ($2.5K) | Trend: $520 ($6K) | RiskGuard: $180 ($12K)

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
npm run db:push       # Push Drizzle migrations
```

## Workflow
- Plan in `tasks/todo.md` before multi-step work
- Track lessons in `tasks/lessons.md` after any correction
- Verify changes work before marking complete
