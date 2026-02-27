# Chain District — Replit Agent Guide

## Overview

Chain District is a premium crypto tycoon strategy game built with Expo (React Native). Players build and manage a crypto infrastructure empire — from mining rigs to cooling systems to trading bots — across a simulated market. The game runs on mobile (iOS/Android) with a companion Express backend server.

The app has five main tabs:
- **District** — isometric view of your infrastructure buildings
- **Market** — live simulated crypto prices and market regime info
- **Portfolio** — manage crypto holdings and trading bots
- **Research** — unlock upgrades across three tech trees
- **Settings** — prestige, stats, and game reset

The tone is strategic and professional, not flashy or meme-like.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK ~54 with Expo Router v6 (file-based routing)
- **Entry point**: `expo-router/entry` → `app/_layout.tsx` → `app/(tabs)/_layout.tsx`
- **UI style**: Dark theme only (`userInterfaceStyle: "dark"`), background color `#080B12`
- **Fonts**: DM Sans (400/500/600/700) loaded via `@expo-google-fonts/dm-sans`
- **Icons**: `@expo/vector-icons` (Ionicons, MaterialCommunityIcons) + SF Symbols on iOS via `expo-symbols`
- **Animations**: `react-native-reanimated` v4 + `react-native-gesture-handler`
- **Haptics**: `expo-haptics` used throughout for tactile feedback on button presses
- **SVG graphics**: `react-native-svg` used for the isometric district view and building interior illustrations
- **Safe areas**: `react-native-safe-area-context` with per-platform inset handling
- **Keyboard**: `react-native-keyboard-controller` with a compatibility wrapper for web (`KeyboardAwareScrollViewCompat`)
- **Tab navigation**: Uses `expo-router/unstable-native-tabs` with Liquid Glass effect on supported iOS devices, falls back to standard Expo `Tabs` on other platforms

### Game State Management

- **GameContext** (`contexts/GameContext.tsx`): Central game simulation state — buildings (mining rigs, power plants, cooling hubs, maintenance bays, security offices), crypto holdings (BTC, ETH, SOL, DOGE), bots (DCA, Grid, Trend, RiskGuard), research nodes, wear level, cash, insight points, prestige
- **MarketContext** (`contexts/MarketContext.tsx`): Simulated crypto market — runs a tick-based price engine with five market regimes (calm, trending, mania, crash, recovery), Markov-style regime transitions, geometric Brownian motion price updates for BTC, ETH, SOL, DOGE
- **Persistence**: Game state saved to device via `@react-native-async-storage/async-storage` under key `@chain_district_save` — no server-side save sync currently
- **Server state / API calls**: `@tanstack/react-query` with a custom `queryClient` that routes requests through an Express backend via `EXPO_PUBLIC_DOMAIN`

### Notifications / Toasts

- **GameToast** (`components/GameToast.tsx`): A React context + animated overlay system for in-game toasts (milestones, warnings, regime changes, achievements). Uses Reanimated sequences. Consumed via `useToast()` hook.

### Backend (Express)

- **Server**: Express 5 (`server/index.ts`) serves as API layer; routes registered in `server/routes.ts`
- **Current routes**: Minimal — placeholder only (`/api` prefix convention)
- **Storage**: `server/storage.ts` currently uses an in-memory `MemStorage` class implementing `IStorage` (get/create users). No DB writes yet.
- **CORS**: Dynamic allow-list based on `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` env vars; also allows localhost for Expo web dev

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle.config.ts`)
- **Schema** (`shared/schema.ts`): Single `users` table with `id` (UUID, auto-gen), `username`, `password`
- **Validation**: `drizzle-zod` + Zod for `insertUserSchema` / `InsertUser` type
- **Migrations**: Output to `./migrations/`, pushed with `npm run db:push`
- **Note**: The database is provisioned but only a basic users table exists. Game state is not yet persisted to the database — it uses AsyncStorage on device.

### Design System

All colors are centralized in `constants/colors.ts`:
- Dark backgrounds: `#080B12`, `#0F1420`, `#161C2E`, `#1D2540`
- Accent palette: blue (`#4A8FE7`), green (`#2DD4A0`), red (`#FF4F5E`), amber (`#F5A623`), purple (`#9B7FE8`)
- Text: primary `#E8EAF0`, secondary `#8B96B0`, muted `#4A5270`

### Build & Dev Scripts

- `npm run expo:dev` — starts Expo dev server on Replit with correct proxy URLs
- `npm run server:dev` — runs Express server with `tsx` (TypeScript runner)
- `npm run expo:static:build` — builds static Expo web bundle via `scripts/build.js`
- `npm run server:build` — bundles Express server with `esbuild`
- The `scripts/build.js` file orchestrates Metro bundler + static export for deployment

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| `expo` ~54 | Core mobile framework |
| `expo-router` ~6 | File-based navigation |
| `react-native-reanimated` ~4 | Smooth animations |
| `react-native-gesture-handler` | Swipe/touch gestures |
| `react-native-svg` | Isometric SVG district map and building art |
| `@tanstack/react-query` v5 | Server state / API data fetching |
| `drizzle-orm` + `pg` | PostgreSQL ORM + driver |
| `drizzle-zod` + `zod` | Schema validation |
| `@react-native-async-storage/async-storage` | Local game save persistence |
| `expo-haptics` | Haptic feedback on interactions |
| `expo-blur` | Blur effects (tab bar on iOS) |
| `expo-glass-effect` | Liquid Glass tab bar (iOS 26+) |
| `expo-linear-gradient` | Gradient UI elements |
| `expo-image` | Optimized image rendering |
| `expo-location` | Location (available, not currently used in game) |
| `express` v5 | Backend API server |
| `http-proxy-middleware` | Dev proxy for Expo ↔ server on Replit |
| `@expo-google-fonts/dm-sans` | DM Sans typeface |
| `@expo/vector-icons` | Icon library (Ionicons, MaterialCommunityIcons) |
| `react-native-keyboard-controller` | Keyboard-aware scroll views |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen management |
| `expo-web-browser` | In-app browser (OAuth flows etc.) |
| PostgreSQL (via Replit) | Database for users (game data currently on-device only) |