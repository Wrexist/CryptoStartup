/**
 * Game balance constants extracted from GameContext.tsx.
 * Centralises magic numbers so they're easy to tune and audit.
 */

// ─── Tick System ────────────────────────────────────────────────────────────
export const TICK_INTERVAL_MS = 3000;

// ─── Starting State ─────────────────────────────────────────────────────────
export const STARTING_CASH = 12000;

// ─── Building Costs ─────────────────────────────────────────────────────────
export const BASE_COSTS: Record<string, number> = {
  miningRig: 800,
  powerPlant: 2000,
  coolingHub: 1500,
  maintenanceBay: 3000,
  securityOffice: 4000,
};

export const COST_SCALING = 1.18;
export const BUILD_COST_DISCOUNT = 0.85; // inf_06 research discount

// ─── Power & Cooling ────────────────────────────────────────────────────────
export const POWER_PER_PLANT = 50;
export const POWER_BASE = 100;
export const COOLING_PER_HUB = 40;
export const COOLING_BASE = 100;
export const POWER_EFFICIENCY_BONUS = 0.88;  // inf_01 research
export const COOLING_EFFICIENCY_BONUS = 0.8; // inf_02 research

// ─── Hash & Mining ──────────────────────────────────────────────────────────
export const HASH_OVERCLOCK_MULT = 1.3;      // inf_05 research
export const HASH_TO_CASH_DIVISOR = 1_000_000;
export const BTC_PRICE_MULT = 3;             // base income multiplier

// ─── Wear System ────────────────────────────────────────────────────────────
export const WEAR_RATE_BASE = 0.1;
export const WEAR_RATE_REDUCED = 0.075;       // inf_03 research
export const WEAR_PENALTY_DIVISOR = 200;
export const MAINTENANCE_BAY_MULT = 3;
export const WEAR_REPAIR_AUTO = 0.4;          // inf_04 research
export const WEAR_REPAIR_BASE = 0.2;

// ─── Regime Multipliers ─────────────────────────────────────────────────────
export const REGIME_MULT = {
  calm: 1.0,
  trending: 1.3,
  mania: 1.8,
  crash_shield: 0.95,   // rsk_06
  crash_hedge: 0.7,     // rsk_02
  crash_base: 0.5,
  recovery: 1.1,
} as const;

// ─── Bot Income ─────────────────────────────────────────────────────────────
export const BOT_COSTS: Record<string, number> = {
  dca: 0,
  grid: 2500,
  trend: 6000,
  riskGuard: 8000,
};

export const BOT_INCOME = {
  dca: 120,
  grid: 380,
  trend: 720,
  riskGuard: 350,
} as const;

export const BOT_PERF_BASE = 1.15;            // trd_01 research
export const BOT_PERF_ADVANCED = 1.4;         // trd_06 research
export const GRID_BOOST_MULT = 1.25;          // trd_03 research
export const TREND_BOOST_MULT = 1.3;          // trd_04 research
export const BOT_FAILURE_CRASH_RATE = 0.05;

// ─── Prestige ───────────────────────────────────────────────────────────────
export const PRESTIGE_BASE_REQUIREMENT = 500_000;
export const PRESTIGE_EXPONENT = 3;
export const PRESTIGE_INCOME_MULT = 0.25;     // per level, base income
export const PRESTIGE_BOT_MULT = 0.15;        // per level, bot income

// ─── Insight ────────────────────────────────────────────────────────────────
export const INSIGHT_PER_RIG = 0.05;
export const INSIGHT_DCA_BONUS = 0.5;
export const INSIGHT_GRID_BONUS = 1;

// ─── Trading Fees ───────────────────────────────────────────────────────────
export const TRADE_FEE_BASE = 0.005;           // 0.5%
export const TRADE_FEE_TRADER = 0.002;         // trader achievement: 0.2%
export const TRADE_FEE_LIQUIDITY = 0.001;      // trd_05 research: 0.1%

// ─── Events ─────────────────────────────────────────────────────────────────
export const EVENT_TICK_MIN = 60;
export const EVENT_TICK_MAX = 120;
export const SECURITY_EVENT_PREVENTION = 0.12; // per security office
export const SECURITY_MITIGATION_MAX = 0.6;
export const SECURITY_FIRE_MITIGATION = 0.15;  // per security office
export const INCIDENT_PREDICTION_CHANCE = 0.2; // rsk_01
export const SECURITY_HARDENING_REDUCTION = 0.35; // rsk_04
export const EMERGENCY_LIQUIDITY_SELL = 0.05;  // rsk_03: 5% of holdings

// ─── Offline Earnings ───────────────────────────────────────────────────────
export const OFFLINE_CAP_MS = 4 * 60 * 60 * 1000; // 4 hours
export const OFFLINE_RATE = 0.5;                    // 50% efficiency

// ─── Default Fallback Prices ────────────────────────────────────────────────
export const DEFAULT_PRICES = {
  BTC: 67400,
  ETH: 3820,
  SOL: 185,
  DOGE: 0.185,
} as const;

// ─── Event History ──────────────────────────────────────────────────────────
export const EVENT_HISTORY_MAX = 50;

// ─── Max Building Slots ─────────────────────────────────────────────────────
export const MAX_MINING_RIGS = 9;
