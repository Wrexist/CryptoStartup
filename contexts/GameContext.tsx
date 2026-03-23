import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMarket } from './MarketContext';
import { RIG_TIERS, getRigUpgradeCost } from '@/constants/rigTiers';
import { GAME_EVENTS, GameEventTemplate, EventEffectType } from '@/constants/events';
import { CONTRACT_TEMPLATES, ContractTemplate, CONTRACTS_PER_SLOT } from '@/constants/contracts';
import { ACHIEVEMENTS, computeAchievementBonuses } from '@/constants/achievements';

const SAVE_KEY = '@chain_district_save_v2';

export interface BotState {
  active: boolean;
  level: number;
  unlocked: boolean;
}

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  requires?: string;
  effect: string;
}

export type ResearchBranch = 'infrastructure' | 'trading' | 'risk';

export interface ActiveContract {
  templateId: string;
  startedAt: number;
  expiresAt: number;
  progress: number;
  goal: number;
  completed: boolean;
  cashReward: number;
  insightReward: number;
  researchBaseline?: number;
  eventBaseline?: number;
}

export interface ActiveEffect {
  id: string;
  type: 'income_mult' | 'hash_mult' | 'wear_mult' | 'bot_disabled';
  value: number;
  expiresAt: number;
  label: string;
}

export interface GameEventInstance extends GameEventTemplate {
  instanceId: string;
}

export interface GameState {
  cash: number;
  insight: number;
  miningRigs: number;
  powerPlants: number;
  coolingHubs: number;
  maintenanceBays: number;
  securityOffices: number;
  wearLevel: number;
  btcHeld: number;
  ethHeld: number;
  solHeld: number;
  dogeHeld: number;
  bots: {
    dca: BotState;
    grid: BotState;
    trend: BotState;
    riskGuard: BotState;
  };
  researchUnlocked: string[];
  prestigeLevel: number;
  totalEarned: number;
  gameStartTime: number;
  lastSaveTime: number;
  // Hardware tiers
  rigTiers: number[];
  // Events
  eventCount: number;
  activeEffects: ActiveEffect[];
  // Contracts
  activeContracts: ActiveContract[];
  completedContractCount: number;
  contractBuildSpend: number;
  // Achievements
  achievements: string[];
  // Achievement tracking helpers
  totalTradeCount: number;
  maniaEarningsSession: number;
  zeroWearTicks: number;
  crashEarned: boolean;
  // Event history
  eventHistory: Array<{ eventId: string; title: string; choiceLabel: string; timestamp: number }>;
}

interface GameContextValue {
  game: GameState;
  powerCapacity: number;
  powerUsed: number;
  coolingCapacity: number;
  coolingUsed: number;
  hashRate: number;
  uptime: number;
  incomePerTick: number;
  netWorth: number;
  totalEarned: number;
  activeEffects: ActiveEffect[];
  pendingEvent: GameEventInstance | null;
  buyBuilding: (type: 'miningRig' | 'powerPlant' | 'coolingHub' | 'maintenanceBay' | 'securityOffice') => boolean;
  getBuildingCost: (type: string) => number;
  toggleBot: (bot: keyof GameState['bots']) => boolean;
  getBotActivationCost: (bot: keyof GameState['bots']) => number;
  unlockResearch: (nodeId: string, cost: number) => boolean;
  performPrestige: () => void;
  canPrestige: boolean;
  prestigeRequirement: number;
  researchNodes: Record<ResearchBranch, ResearchNode[]>;
  offlineEarnings: number;
  clearOfflineEarnings: () => void;
  upgradeRig: (slotIndex: number, toTier: number) => boolean;
  getRigUpgradeCostFn: (slotIndex: number, toTier: number) => number;
  resolveEvent: (instanceId: string, choiceIndex: number) => void;
  buyAsset: (symbol: 'BTC' | 'ETH' | 'SOL' | 'DOGE', cashAmount: number) => boolean;
  sellAsset: (symbol: 'BTC' | 'ETH' | 'SOL' | 'DOGE', coinAmount: number) => boolean;
  newAchievements: string[];
  clearNewAchievements: () => void;
  completedContractNames: string[];
  clearCompletedContractNames: () => void;
}

const BASE_COSTS: Record<string, number> = {
  miningRig: 800,
  powerPlant: 2000,
  coolingHub: 1500,
  maintenanceBay: 3000,
  securityOffice: 4000,
};

const COST_SCALING = 1.18;

const BOT_COSTS: Record<string, number> = {
  dca: 0,
  grid: 2500,
  trend: 6000,
  riskGuard: 8000,
};

const RESEARCH_NODES: Record<ResearchBranch, ResearchNode[]> = {
  infrastructure: [
    { id: 'inf_01', name: 'Efficient Wiring', description: 'Power usage reduced by 12%', cost: 50, unlocked: false, effect: 'power_efficiency_12' },
    { id: 'inf_02', name: 'Advanced Cooling', description: 'Cooling efficiency +20%', cost: 80, unlocked: false, requires: 'inf_01', effect: 'cooling_efficiency_20' },
    { id: 'inf_03', name: 'Wear Reduction', description: 'Wear rate decreased 25%', cost: 120, unlocked: false, requires: 'inf_01', effect: 'wear_rate_25' },
    { id: 'inf_04', name: 'Auto-Maintenance', description: 'Wear repairs 2x faster', cost: 200, unlocked: false, requires: 'inf_03', effect: 'auto_maintenance' },
    { id: 'inf_05', name: 'Hash Overclock', description: 'Mining rig output +30%', cost: 350, unlocked: false, requires: 'inf_02', effect: 'hash_overclock_30' },
    { id: 'inf_06', name: 'Industrial Grade', description: 'All infrastructure costs -15%', cost: 500, unlocked: false, requires: 'inf_04', effect: 'build_cost_15' },
  ],
  trading: [
    { id: 'trd_01', name: 'Market Signals', description: 'Bot performance +15%', cost: 60, unlocked: false, effect: 'bot_perf_15' },
    { id: 'trd_02', name: 'Volatility Analysis', description: 'Reduced bot failure risk', cost: 100, unlocked: false, requires: 'trd_01', effect: 'bot_stability' },
    { id: 'trd_03', name: 'Grid Optimization', description: 'Grid Bot earns 25% more', cost: 150, unlocked: false, requires: 'trd_01', effect: 'grid_boost_25' },
    { id: 'trd_04', name: 'Trend Recognition', description: 'Trend Bot accuracy +30%', cost: 200, unlocked: false, requires: 'trd_02', effect: 'trend_boost_30' },
    { id: 'trd_05', name: 'Liquidity Protocol', description: 'Lower asset conversion cost', cost: 300, unlocked: false, requires: 'trd_03', effect: 'liquidity' },
    { id: 'trd_06', name: 'Institutional Grade', description: 'All bots earn +40%', cost: 600, unlocked: false, requires: 'trd_04', effect: 'bot_perf_40' },
  ],
  risk: [
    { id: 'rsk_01', name: 'Incident Prediction', description: 'Early warning for failures', cost: 70, unlocked: false, effect: 'incident_prediction' },
    { id: 'rsk_02', name: 'Crash Hedge', description: 'Reduced loss during crash regime', cost: 120, unlocked: false, requires: 'rsk_01', effect: 'crash_hedge' },
    { id: 'rsk_03', name: 'Emergency Liquidity', description: 'Sell assets fast in crash', cost: 180, unlocked: false, requires: 'rsk_01', effect: 'emergency_liquidity' },
    { id: 'rsk_04', name: 'Security Hardening', description: 'Incidents reduced 35%', cost: 250, unlocked: false, requires: 'rsk_02', effect: 'security_35' },
    { id: 'rsk_05', name: 'Market Circuit Breaker', description: 'Auto-pause bots on crash', cost: 350, unlocked: false, requires: 'rsk_03', effect: 'circuit_breaker' },
    { id: 'rsk_06', name: 'Institutional Shield', description: 'Near-zero crash damage', cost: 700, unlocked: false, requires: 'rsk_04', effect: 'shield' },
  ],
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateContracts(game: GameState, count: number): ActiveContract[] {
  const now = Date.now();
  const available = CONTRACT_TEMPLATES.filter(t => {
    if (t.minRigs && game.miningRigs < t.minRigs) return false;
    if (t.minPrestige && game.prestigeLevel < t.minPrestige) return false;
    return true;
  });

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  return picked.map(t => ({
    templateId: t.id,
    startedAt: now,
    expiresAt: t.durationTicks > 0 ? now + t.durationTicks * 3000 * 1.5 : now + 600000,
    progress: 0,
    goal: t.target,
    completed: false,
    cashReward: t.cashReward,
    insightReward: t.insightReward,
    researchBaseline: game.researchUnlocked.length,
    eventBaseline: game.eventCount,
  }));
}

function defaultGame(): GameState {
  const base: GameState = {
    cash: 12000,
    insight: 0,
    miningRigs: 0,
    powerPlants: 2,
    coolingHubs: 2,
    maintenanceBays: 0,
    securityOffices: 0,
    wearLevel: 0,
    btcHeld: 0,
    ethHeld: 0,
    solHeld: 0,
    dogeHeld: 0,
    bots: {
      dca: { active: false, level: 1, unlocked: true },
      grid: { active: false, level: 1, unlocked: false },
      trend: { active: false, level: 1, unlocked: false },
      riskGuard: { active: false, level: 1, unlocked: false },
    },
    researchUnlocked: [],
    prestigeLevel: 0,
    totalEarned: 0,
    gameStartTime: Date.now(),
    lastSaveTime: Date.now(),
    rigTiers: [],
    eventCount: 0,
    activeEffects: [],
    activeContracts: [],
    completedContractCount: 0,
    contractBuildSpend: 0,
    achievements: [],
    totalTradeCount: 0,
    maniaEarningsSession: 0,
    zeroWearTicks: 0,
    crashEarned: false,
    eventHistory: [],
  };
  base.activeContracts = generateContracts(base, CONTRACTS_PER_SLOT);
  return base;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(defaultGame());
  const gameRef = useRef(game);
  gameRef.current = game;
  const { market } = useMarket();
  const marketRef = useRef(market);
  marketRef.current = market;

  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const [pendingEvent, setPendingEvent] = useState<GameEventInstance | null>(null);
  const pendingEventRef = useRef(pendingEvent);
  pendingEventRef.current = pendingEvent;

  const tickCountRef = useRef(0);
  const nextEventTickRef = useRef(randInt(60, 120));

  // Notification queues for UI consumption
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [completedContractNames, setCompletedContractNames] = useState<string[]>([]);
  const clearNewAchievements = useCallback(() => setNewAchievements([]), []);
  const clearCompletedContractNames = useCallback(() => setCompletedContractNames([]), []);
  const pendingAchievementNotifs = useRef<string[]>([]);
  const pendingContractNotifs = useRef<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then((raw: string | null) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as GameState;
          const merged: GameState = { ...defaultGame(), ...saved };
          // Ensure array fields exist
          if (!Array.isArray(merged.rigTiers)) merged.rigTiers = [];
          if (!Array.isArray(merged.activeContracts)) merged.activeContracts = generateContracts(merged, CONTRACTS_PER_SLOT);
          if (!Array.isArray(merged.achievements)) merged.achievements = [];
          if (!Array.isArray(merged.activeEffects)) merged.activeEffects = [];

          // Calculate offline earnings using rig tiers
          if (merged.lastSaveTime && merged.miningRigs > 0) {
            const elapsed = Math.min(Date.now() - merged.lastSaveTime, 4 * 60 * 60 * 1000);
            const elapsedTicks = elapsed / 3000;
            const { hashRate } = computeHashStats(merged);
            const btcPrice = 67400;
            const baseIncome = (hashRate / 1000000) * btcPrice * 3;
            const prestige = 1 + merged.prestigeLevel * 0.25;
            const earned = baseIncome * prestige * elapsedTicks * 0.5;
            if (earned > 0) {
              merged.cash += earned;
              merged.totalEarned += earned;
              setOfflineEarnings(earned);
            }
          }
          setGame(merged);
        } catch {}
      }
    });
  }, []);

  const saveGame = useCallback((state: GameState) => {
    const withTimestamp = { ...state, lastSaveTime: Date.now() };
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify(withTimestamp)).catch(() => {});
  }, []);

  // ─── Helper: compute hash/power/cooling from rig tiers ─────────────────────
  function computeHashStats(g: GameState) {
    let hashRate = 0, powerUsed = 0, coolingUsed = 0;
    for (let i = 0; i < g.miningRigs; i++) {
      const tier = g.rigTiers[i] ?? 0;
      const rigDef = RIG_TIERS[Math.min(tier, RIG_TIERS.length - 1)];
      hashRate += rigDef.hash;
      powerUsed += rigDef.power;
      coolingUsed += rigDef.cooling;
    }
    return { hashRate, powerUsed, coolingUsed };
  }

  const getDerivedStats = useCallback((g: GameState) => {
    const researchUnlocked = g.researchUnlocked;
    const hasBuildCostReduction = researchUnlocked.includes('inf_06');
    const hasOverclock = researchUnlocked.includes('inf_05');
    const hasPowerEfficiency = researchUnlocked.includes('inf_01');
    const hasCoolingEfficiency = researchUnlocked.includes('inf_02');
    const hasWearReduction = researchUnlocked.includes('inf_03');
    const hasCrashHedge = researchUnlocked.includes('rsk_02');
    const hasShield = researchUnlocked.includes('rsk_06');
    const hasBotPerfBase = researchUnlocked.includes('trd_01');
    const hasBotPerfAdv = researchUnlocked.includes('trd_06');

    // Achievement bonuses
    const achBonuses = computeAchievementBonuses(g.achievements);
    const incomeAchMult = 1 + achBonuses.incomePct / 100;
    const hashAchMult = 1 + achBonuses.hashPct / 100;
    const botAchMult = 1 + achBonuses.botIncomePct / 100;
    const crashAchBonus = 1 + achBonuses.crashIncomePct / 100;
    const maniaAchBonus = 1 + achBonuses.maniaIncomePct / 100;
    const insightAchMult = 1 + achBonuses.insightPct / 100;
    const wearAchBonus = achBonuses.wearPct / 100;

    const powerCapacity = g.powerPlants * 50 + 100;
    const coolingCapacity = g.coolingHubs * 40 + 100;

    // Compute raw hash stats from tiers
    const { hashRate: rawHash, powerUsed: rawPower, coolingUsed: rawCooling } = computeHashStats(g);
    const powerEff = hasPowerEfficiency ? 0.88 : 1.0;
    const coolingEff = hasCoolingEfficiency ? 0.8 : 1.0;
    const powerUsed = rawPower * powerEff;
    const coolingUsed = rawCooling * coolingEff;
    const powerEfficiency = Math.min(1, powerCapacity / Math.max(powerUsed, 1));
    const coolingEfficiency = Math.min(1, coolingCapacity / Math.max(coolingUsed, 1));

    const wearPenalty = Math.max(0, g.wearLevel / 200 - wearAchBonus);
    const uptime = Math.max(0, 1 - wearPenalty);
    const overclockMult = hasOverclock ? 1.3 : 1;
    let hashRate = rawHash * powerEfficiency * coolingEfficiency * uptime * overclockMult * hashAchMult;

    // Apply active hash effects
    const now = Date.now();
    const hashEffects = g.activeEffects.filter(e => e.type === 'hash_mult' && e.expiresAt > now);
    for (const eff of hashEffects) hashRate *= eff.value;

    const btcPrice = marketRef.current.assets.find(a => a.symbol === 'BTC')?.price ?? 67400;
    let baseIncome = (hashRate / 1000000) * btcPrice * 3;

    // Regime modifiers
    const regime = marketRef.current.regime;
    let regimeMult = 1;
    if (regime === 'crash') {
      if (hasShield) regimeMult = 0.95;
      else if (hasCrashHedge) regimeMult = 0.7 * crashAchBonus;
      else regimeMult = 0.5 * crashAchBonus;
    } else if (regime === 'mania') regimeMult = 1.8 * maniaAchBonus;
    else if (regime === 'trending') regimeMult = 1.3;
    else if (regime === 'recovery') regimeMult = 1.1;
    baseIncome *= regimeMult;

    // Apply active income effects
    const incomeEffects = g.activeEffects.filter(e => e.type === 'income_mult' && e.expiresAt > now);
    for (const eff of incomeEffects) baseIncome *= eff.value;

    // Bot income
    let botIncome = 0;
    const botMultiplier = hasBotPerfAdv ? 1.4 : hasBotPerfBase ? 1.15 : 1;
    const hasGridBoost = researchUnlocked.includes('trd_03');
    const hasTrendBoost = researchUnlocked.includes('trd_04');
    const botsDisabled = g.activeEffects.some(e => e.type === 'bot_disabled' && e.expiresAt > now);
    if (!botsDisabled) {
      if (g.bots.dca.active) botIncome += 120 * botMultiplier;
      if (g.bots.grid.active) botIncome += 380 * (hasGridBoost ? 1.25 : 1) * botMultiplier;
      if (g.bots.trend.active) botIncome += 720 * (hasTrendBoost ? 1.3 : 1) * botMultiplier;
      if (g.bots.riskGuard.active) botIncome += 350 * botMultiplier;
    }
    botIncome *= (1 + g.prestigeLevel * 0.15) * botAchMult;

    const prestige = 1 + g.prestigeLevel * 0.25;
    const incomePerTick = (baseIncome + botIncome) * prestige * incomeAchMult;
    const insightPerTick = (g.miningRigs * 0.05 + (g.bots.dca.active ? 0.5 : 0) + (g.bots.grid.active ? 1 : 0)) * insightAchMult;

    return {
      powerCapacity,
      coolingCapacity,
      powerUsed,
      coolingUsed,
      hashRate,
      uptime,
      incomePerTick,
      insightPerTick,
      hasBuildCostReduction,
      hasWearReduction,
      hasAutoMaintenance: researchUnlocked.includes('inf_04'),
      hasBotStability: researchUnlocked.includes('trd_02'),
      hasCB: researchUnlocked.includes('rsk_05'),
    };
  }, []);

  const computeNetWorth = useCallback((g: GameState) => {
    const assets = marketRef.current.assets;
    const btcPrice = assets.find(a => a.symbol === 'BTC')?.price ?? 67400;
    const ethPrice = assets.find(a => a.symbol === 'ETH')?.price ?? 3820;
    const solPrice = assets.find(a => a.symbol === 'SOL')?.price ?? 185;
    const dogePrice = assets.find(a => a.symbol === 'DOGE')?.price ?? 0.185;
    const holdings = g.btcHeld * btcPrice + g.ethHeld * ethPrice + g.solHeld * solPrice + g.dogeHeld * dogePrice;
    return g.cash + holdings;
  }, []);

  // ─── Achievement checker ────────────────────────────────────────────────────
  function checkAchievements(g: GameState, stats: ReturnType<typeof getDerivedStats>): string[] {
    const earned: string[] = [...g.achievements];
    const has = (id: string) => earned.includes(id);
    const give = (id: string) => { if (!has(id)) earned.push(id); };

    if (g.miningRigs >= 1) give('first_rig');
    if (g.miningRigs >= 5) give('five_rigs');
    if (g.miningRigs >= 9) give('full_district');
    const activeBotCount = Object.values(g.bots).filter(b => b.active).length;
    if (activeBotCount >= 1) give('first_bot');
    if (activeBotCount >= 4) give('all_bots');
    if (g.researchUnlocked.length >= 1) give('first_research');
    if (g.researchUnlocked.length >= 18) give('all_research');
    if (g.prestigeLevel >= 1) give('first_prestige');
    if (g.prestigeLevel >= 3) give('third_prestige');
    if (g.rigTiers.some(t => t >= 1)) give('first_gpu');
    if (g.rigTiers.some(t => t >= 2)) give('first_asic');
    if (g.rigTiers.some(t => t >= 3)) give('first_quantum');
    if (g.rigTiers.some(t => t >= 4)) give('first_fusion');
    if (g.totalEarned >= 1_000_000) give('million_earned');
    if (g.totalEarned >= 10_000_000) give('ten_million');
    if (g.totalEarned >= 100_000_000) give('hundred_million');
    if (g.crashEarned) give('survive_crash');
    if (g.maniaEarningsSession >= 10000) give('mania_peak');
    if (g.zeroWearTicks >= 20) give('wear_master');
    if (g.eventCount >= 10) give('event_hero');
    if (g.completedContractCount >= 10) give('contract_pro');
    if (g.completedContractCount >= 50) give('contract_legend');
    if (g.btcHeld >= 1) give('btc_whale');
    if (g.totalTradeCount >= 20) give('trader');
    if (g.powerPlants >= 7 && g.coolingHubs >= 7) give('max_infra');
    // Mid/Late-game achievements
    if (g.cash >= 50000) give('cash_hoarder');
    if (g.securityOffices >= 3) give('security_chief');
    if (g.securityOffices >= 5) give('fort_knox');
    if (g.btcHeld > 0 && g.ethHeld > 0 && g.solHeld > 0 && g.dogeHeld > 0) give('diversified');
    if (g.rigTiers.filter(t => t >= 2).length >= 3) give('silicon_valley');
    if (g.prestigeLevel >= 5) give('veteran');
    if (g.totalEarned >= 1_000_000_000) give('billionaire');
    if (g.zeroWearTicks >= 100) give('zen_master');
    if (earned.length >= ACHIEVEMENTS.length - 1) give('district_legend');

    return earned;
  }

  // ─── Tick loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      tickCountRef.current++;

      setGame(prev => {
        const stats = getDerivedStats(prev);
        const now = Date.now();
        const regime = marketRef.current.regime;

        // Clean expired effects
        const activeEffects = prev.activeEffects.filter(e => e.expiresAt > now);

        // Wear calculation
        const wearRateBase = stats.hasWearReduction ? 0.075 : 0.1;
        const wearEffects = activeEffects.filter(e => e.type === 'wear_mult');
        let wearMult = 1;
        for (const e of wearEffects) wearMult *= e.value;
        const wearIncrease = prev.miningRigs > 0 ? wearRateBase * wearMult * (prev.miningRigs / (prev.maintenanceBays * 3 + 1)) : 0;
        const wearRepair = prev.maintenanceBays * (stats.hasAutoMaintenance ? 0.4 : 0.2);
        const newWear = Math.max(0, Math.min(100, prev.wearLevel + wearIncrease - wearRepair));

        // Bot failure
        const botFailRisk = regime === 'crash' && !stats.hasBotStability ? 0.05 : 0;
        const botUpdates = { ...prev.bots };
        if (botFailRisk > 0) {
          (Object.keys(botUpdates) as Array<keyof typeof botUpdates>).forEach(k => {
            if (botUpdates[k].active && Math.random() < botFailRisk) {
              botUpdates[k] = { ...botUpdates[k], active: false };
            }
          });
        }
        if (stats.hasCB && regime === 'crash') {
          (Object.keys(botUpdates) as Array<keyof typeof botUpdates>).forEach(k => {
            botUpdates[k] = { ...botUpdates[k], active: false };
          });
        }

        const earnedCash = stats.incomePerTick;
        const earnedInsight = stats.insightPerTick;

        // Achievement tracking
        let maniaEarningsSession = prev.maniaEarningsSession;
        let zeroWearTicks = prev.zeroWearTicks;
        let crashEarned = prev.crashEarned;
        if (regime === 'mania') maniaEarningsSession += earnedCash;
        else maniaEarningsSession = 0;
        if (newWear === 0 && prev.miningRigs > 0) zeroWearTicks++;
        else zeroWearTicks = 0;
        if (regime === 'crash' && earnedCash > 0) crashEarned = true;

        // Contract progress
        const contracts = prev.activeContracts.map(c => {
          if (c.completed) return c;
          if (c.expiresAt < now) return { ...c, completed: false, progress: -1 }; // expired marker
          const tmpl = CONTRACT_TEMPLATES.find(t => t.id === c.templateId);
          if (!tmpl) return c;
          let progress = c.progress;
          const activeBotCount = Object.values(botUpdates).filter(b => b.active).length;
          switch (tmpl.type) {
            case 'hash':
              if (tmpl.hashThreshold) {
                // Sustained: track ticks at or above the GH/s threshold
                if (stats.hashRate >= tmpl.hashThreshold) progress++;
                else progress = Math.max(0, progress - 1);
              } else {
                // Instant: snapshot current hash rate
                progress = stats.hashRate;
              }
              break;
            case 'earnings': progress += earnedCash; break;
            case 'uptime': if (stats.uptime >= 0.9) progress++; break;
            case 'wear': if (newWear < 20) progress++; else progress = 0; break;
            case 'bots': if (activeBotCount >= 2) progress++; break;
            case 'spend': progress = prev.contractBuildSpend; break;
            case 'research': progress = prev.researchUnlocked.length - (c.researchBaseline ?? 0); break;
            case 'events': progress = prev.eventCount - (c.eventBaseline ?? 0); break;
            case 'regime':
              if (
                (tmpl.id === 'crash_survivor' && regime === 'crash') ||
                ((tmpl.id === 'mania_rider' || tmpl.id === 'mania_mogul') && regime === 'mania')
              ) progress += earnedCash;
              break;
          }
          const completed = progress >= c.goal;
          return { ...c, progress, completed };
        });

        // Handle completed / expired contracts
        let completedContractCount = prev.completedContractCount;
        let cashBonus = 0;
        let insightBonus = 0;
        let newContracts = contracts.map(c => {
          if (c.completed && !prev.activeContracts.find(p => p.templateId === c.templateId && p.completed)) {
            cashBonus += c.cashReward;
            insightBonus += c.insightReward;
            completedContractCount++;
          }
          return c;
        });

        // Replace completed/expired contracts
        const toRefresh = newContracts.filter(c => c.completed || c.progress === -1);
        if (toRefresh.length > 0) {
          const activeIds = newContracts.filter(c => !c.completed && c.progress !== -1).map(c => c.templateId);
          const fakeGame = { ...prev, activeContracts: [], researchUnlocked: prev.researchUnlocked };
          const fresh = generateContracts(fakeGame, toRefresh.length).filter(c => !activeIds.includes(c.templateId));
          let fi = 0;
          newContracts = newContracts.map(c => {
            if (c.completed || c.progress === -1) {
              return fresh[fi++] ?? newContracts[0];
            }
            return c;
          });
        }

        const newState: GameState = {
          ...prev,
          cash: prev.cash + earnedCash + cashBonus,
          insight: prev.insight + earnedInsight + insightBonus,
          wearLevel: newWear,
          totalEarned: prev.totalEarned + earnedCash,
          bots: botUpdates,
          activeEffects,
          activeContracts: newContracts,
          completedContractCount,
          maniaEarningsSession,
          zeroWearTicks,
          crashEarned,
        };

        const prevAchievements = prev.achievements;
        newState.achievements = checkAchievements(newState, stats);
        // Queue newly earned achievements for toast notifications
        const freshAch = newState.achievements.filter(a => !prevAchievements.includes(a));
        if (freshAch.length > 0) pendingAchievementNotifs.current.push(...freshAch);
        // Queue completed contracts for toast notifications
        if (cashBonus > 0 || insightBonus > 0) {
          const justCompleted = contracts.filter(c =>
            c.completed && !prev.activeContracts.find(p => p.templateId === c.templateId && p.completed)
          );
          for (const c of justCompleted) {
            const tmpl = CONTRACT_TEMPLATES.find(t => t.id === c.templateId);
            pendingContractNotifs.current.push(tmpl?.title ?? 'Contract');
          }
        }
        saveGame(newState);
        return newState;
      });

      // Flush notification queues
      if (pendingAchievementNotifs.current.length > 0) {
        setNewAchievements(prev => [...prev, ...pendingAchievementNotifs.current]);
        pendingAchievementNotifs.current = [];
      }
      if (pendingContractNotifs.current.length > 0) {
        setCompletedContractNames(prev => [...prev, ...pendingContractNotifs.current]);
        pendingContractNotifs.current = [];
      }

      // Event trigger (outside setGame so we can call setPendingEvent)
      if (tickCountRef.current >= nextEventTickRef.current && !pendingEventRef.current) {
        const g = gameRef.current;
        // Security offices reduce event chance (12% each, max 60%)
        const secChance = Math.min(0.6, g.securityOffices * 0.12);
        // rsk_04: Security Hardening reduces event chance by 35%
        const rsk04 = g.researchUnlocked.includes('rsk_04') ? 0.35 : 0;
        const blockChance = Math.min(0.85, secChance + rsk04);
        // rsk_01: Incident Prediction — 20% chance to prevent event
        const predicted = g.researchUnlocked.includes('rsk_01') && Math.random() < 0.2;

        if (Math.random() >= blockChance && !predicted) {
          const eligible = GAME_EVENTS.filter(e => e.minRigs <= g.miningRigs);
          if (eligible.length > 0) {
            const tmpl = eligible[randInt(0, eligible.length - 1)];
            const instance: GameEventInstance = { ...tmpl, instanceId: `${tmpl.id}_${Date.now()}` };
            if (tmpl.fireEffect) {
              // Security offices mitigate fireEffect severity (15% each, max 60%)
              const mitigation = Math.min(0.6, g.securityOffices * 0.15);
              const fe = tmpl.fireEffect;
              const mitValue = fe.type === 'wear_add' ? fe.value * (1 - mitigation) : fe.value;
              const mitDuration = fe.durationTicks && mitigation > 0
                ? Math.max(5, Math.round(fe.durationTicks * (1 - mitigation)))
                : fe.durationTicks;
              // Apply fire effect and save in one atomic update to avoid race condition
              setGame(prev => {
                let state = prev;
                // rsk_03: Emergency Liquidity — auto-sell 5% holdings during crash
                if (g.researchUnlocked.includes('rsk_03') && marketRef.current.regime === 'crash') {
                  const assets = marketRef.current.assets;
                  const btcP = assets.find(a => a.symbol === 'BTC')?.price ?? 67400;
                  const ethP = assets.find(a => a.symbol === 'ETH')?.price ?? 3820;
                  const liquidCash = prev.btcHeld * btcP * 0.05 + prev.ethHeld * ethP * 0.05;
                  if (liquidCash > 0) {
                    state = { ...state, btcHeld: state.btcHeld * 0.95, ethHeld: state.ethHeld * 0.95, cash: state.cash + liquidCash };
                  }
                }
                const next = applyEffect(state, fe.type, mitValue, mitDuration);
                saveGame(next);
                return next;
              });
            }
            setPendingEvent(instance);
          }
        }
        tickCountRef.current = 0;
        nextEventTickRef.current = randInt(60, 120);
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [getDerivedStats, saveGame]);

  // ─── Apply effect helper ────────────────────────────────────────────────────
  function applyEffect(prev: GameState, type: EventEffectType, value: number, durationTicks?: number): GameState {
    const now = Date.now();
    switch (type) {
      case 'wear_add':
        return { ...prev, wearLevel: Math.max(0, Math.min(100, prev.wearLevel + value)) };
      case 'insight_add':
        return { ...prev, insight: prev.insight + value };
      case 'cash_add':
        return { ...prev, cash: prev.cash + value };
      case 'hash_mult_temp':
      case 'income_mult_temp':
      case 'wear_mult_temp': {
        const effectType = type === 'hash_mult_temp' ? 'hash_mult' : type === 'income_mult_temp' ? 'income_mult' : 'wear_mult';
        if (durationTicks === 0) {
          // Remove existing effect of this type
          return { ...prev, activeEffects: prev.activeEffects.filter(e => e.type !== effectType) };
        }
        const expiresAt = now + (durationTicks ?? 20) * 3000;
        const newEffect: ActiveEffect = {
          id: `${effectType}_${now}`,
          type: effectType as ActiveEffect['type'],
          value,
          expiresAt,
          label: '',
        };
        return { ...prev, activeEffects: [...prev.activeEffects.filter(e => e.type !== effectType), newEffect] };
      }
      case 'bot_disable_temp': {
        if (durationTicks === 0) {
          return { ...prev, activeEffects: prev.activeEffects.filter(e => e.type !== 'bot_disabled') };
        }
        const expiresAt = now + (durationTicks ?? 40) * 3000;
        const newEffect: ActiveEffect = {
          id: `bot_disabled_${now}`,
          type: 'bot_disabled',
          value: 1,
          expiresAt,
          label: 'Bots suspended',
        };
        return { ...prev, activeEffects: [...prev.activeEffects.filter(e => e.type !== 'bot_disabled'), newEffect] };
      }
      default:
        return prev;
    }
  }

  // ─── resolveEvent ───────────────────────────────────────────────────────────
  const resolveEvent = useCallback((instanceId: string, choiceIndex: number) => {
    const event = pendingEventRef.current;
    if (!event || event.instanceId !== instanceId) return;
    const choice = event.choices[choiceIndex];
    if (!choice) return;

    const cost = choice.costCash ?? 0;
    if (cost > 0 && gameRef.current.cash < cost) return;

    setGame(prev => {
      if (choice.costCash && prev.cash < choice.costCash) return prev;
      let state = { ...prev, eventCount: prev.eventCount + 1 };
      // Log event to history (max 50 entries)
      const historyEntry = { eventId: event.id, title: event.title, choiceLabel: choice.label, timestamp: Date.now() };
      state.eventHistory = [...prev.eventHistory.slice(-49), historyEntry];
      if (choice.costCash) state.cash -= choice.costCash;
      if (choice.costInsight) state.insight -= choice.costInsight;

      // Special fire sale choices
      if (event.id === 'hw_fire_sale') {
        if (choiceIndex === 0 && state.miningRigs < 9) {
          state.miningRigs += 1;
          state.rigTiers = [...state.rigTiers];
          state.rigTiers[state.miningRigs - 1] = 0;
        } else if (choiceIndex === 1 && state.miningRigs < 9) {
          state.miningRigs += 1;
          state.rigTiers = [...state.rigTiers];
          state.rigTiers[state.miningRigs - 1] = 1;
        }
        saveGame(state);
        return state;
      }
      // Government seizure — refuse inspection loses last rig
      if (event.id === 'govt_seizure' && choiceIndex === 1 && state.miningRigs > 0) {
        state.miningRigs -= 1;
        state.rigTiers = state.rigTiers.slice(0, state.miningRigs);
        return state;
      }
      // Special flash crash emergency sell
      if (event.id === 'flash_crash' && choiceIndex === 1) {
        const assets = marketRef.current.assets;
        const btcPrice = assets.find(a => a.symbol === 'BTC')?.price ?? 67400;
        const ethPrice = assets.find(a => a.symbol === 'ETH')?.price ?? 3820;
        const liquidAmount = (state.btcHeld * btcPrice * 0.15 * 0.92) + (state.ethHeld * ethPrice * 0.15 * 0.92);
        state.btcHeld = state.btcHeld * 0.85;
        state.ethHeld = state.ethHeld * 0.85;
        state.cash += liquidAmount;
        saveGame(state);
        return state;
      }

      const next = applyEffect(state, choice.effect.type, choice.effect.value, choice.effect.durationTicks);
      saveGame(next);
      return next;
    });

    setPendingEvent(null);
  }, [saveGame]);

  // ─── getBuildingCost ────────────────────────────────────────────────────────
  const getBuildingCost = useCallback((type: string): number => {
    const base = BASE_COSTS[type] ?? 1000;
    const count =
      type === 'miningRig' ? game.miningRigs :
      type === 'powerPlant' ? game.powerPlants - 2 :
      type === 'coolingHub' ? game.coolingHubs - 2 :
      type === 'maintenanceBay' ? game.maintenanceBays :
      game.securityOffices;
    const discount = game.researchUnlocked.includes('inf_06') ? 0.85 : 1;
    return Math.floor(base * Math.pow(COST_SCALING, Math.max(0, count)) * discount);
  }, [game.miningRigs, game.powerPlants, game.coolingHubs, game.maintenanceBays, game.securityOffices, game.researchUnlocked]);

  // ─── buyBuilding ─────────────────────────────────────────────────────────────
  const buyBuilding = useCallback((type: 'miningRig' | 'powerPlant' | 'coolingHub' | 'maintenanceBay' | 'securityOffice'): boolean => {
    const cost = getBuildingCost(type);
    if (gameRef.current.cash < cost) return false;
    setGame(prev => {
      if (prev.cash < cost) return prev;
      const update: Partial<GameState> = {
        cash: prev.cash - cost,
        contractBuildSpend: prev.contractBuildSpend + cost,
      };
      if (type === 'miningRig') { update.miningRigs = prev.miningRigs + 1; }
      else if (type === 'powerPlant') update.powerPlants = prev.powerPlants + 1;
      else if (type === 'coolingHub') update.coolingHubs = prev.coolingHubs + 1;
      else if (type === 'maintenanceBay') update.maintenanceBays = prev.maintenanceBays + 1;
      else if (type === 'securityOffice') update.securityOffices = prev.securityOffices + 1;
      const next = { ...prev, ...update };
      saveGame(next);
      return next;
    });
    return true;
  }, [getBuildingCost, saveGame]);

  // ─── upgradeRig ──────────────────────────────────────────────────────────────
  const getRigUpgradeCostFn = useCallback((slotIndex: number, toTier: number): number => {
    const fromTier = gameRef.current.rigTiers[slotIndex] ?? 0;
    return getRigUpgradeCost(fromTier, toTier);
  }, []);

  const upgradeRig = useCallback((slotIndex: number, toTier: number): boolean => {
    const g = gameRef.current;
    if (slotIndex >= g.miningRigs) return false;
    if (toTier >= RIG_TIERS.length) return false;
    if (toTier <= (g.rigTiers[slotIndex] ?? 0)) return false;
    const tierDef = RIG_TIERS[toTier];
    if (tierDef.prestigeReq > g.prestigeLevel) return false;
    const cost = getRigUpgradeCost(g.rigTiers[slotIndex] ?? 0, toTier);
    if (g.cash < cost) return false;
    setGame(prev => {
      if (prev.cash < cost) return prev;
      const newTiers = [...prev.rigTiers];
      newTiers[slotIndex] = toTier;
      const next = {
        ...prev,
        cash: prev.cash - cost,
        rigTiers: newTiers,
        contractBuildSpend: prev.contractBuildSpend + cost,
      };
      saveGame(next);
      return next;
    });
    return true;
  }, [saveGame]);

  // ─── Bots ─────────────────────────────────────────────────────────────────────
  const getBotActivationCost = useCallback((bot: keyof GameState['bots']): number => BOT_COSTS[bot] ?? 0, []);

  const toggleBot = useCallback((bot: keyof GameState['bots']): boolean => {
    const g = gameRef.current;
    const botState = g.bots[bot];
    if (!botState.unlocked) {
      const cost = BOT_COSTS[bot] ?? 0;
      if (g.cash < cost) return false;
      setGame(prev => {
        if (prev.cash < cost) return prev;
        const next = {
          ...prev,
          cash: prev.cash - cost,
          bots: { ...prev.bots, [bot]: { ...prev.bots[bot], unlocked: true, active: true } },
        };
        saveGame(next);
        return next;
      });
      return true;
    }
    setGame(prev => {
      const next = { ...prev, bots: { ...prev.bots, [bot]: { ...prev.bots[bot], active: !prev.bots[bot].active } } };
      saveGame(next);
      return next;
    });
    return true;
  }, [saveGame]);

  // ─── Research ─────────────────────────────────────────────────────────────────
  const unlockResearch = useCallback((nodeId: string, cost: number): boolean => {
    if (gameRef.current.insight < cost) return false;
    if (gameRef.current.researchUnlocked.includes(nodeId)) return false;
    setGame(prev => {
      if (prev.insight < cost) return prev;
      const next = {
        ...prev,
        insight: prev.insight - cost,
        researchUnlocked: [...prev.researchUnlocked, nodeId],
      };
      saveGame(next);
      return next;
    });
    return true;
  }, [saveGame]);

  // ─── Manual trading ───────────────────────────────────────────────────────────
  const buyAsset = useCallback((symbol: 'BTC' | 'ETH' | 'SOL' | 'DOGE', cashAmount: number): boolean => {
    const g = gameRef.current;
    if (g.cash < cashAmount || cashAmount <= 0) return false;
    const assets = marketRef.current.assets;
    const price = assets.find(a => a.symbol === symbol)?.price ?? 0;
    if (price <= 0) return false;
    const coins = cashAmount / price;
    setGame(prev => {
      if (prev.cash < cashAmount) return prev;
      const holdKey = `${symbol.toLowerCase()}Held` as keyof GameState;
      const next = {
        ...prev,
        cash: prev.cash - cashAmount,
        [holdKey]: (prev[holdKey] as number) + coins,
        totalTradeCount: prev.totalTradeCount + 1,
      };
      saveGame(next);
      return next;
    });
    return true;
  }, [saveGame]);

  const sellAsset = useCallback((symbol: 'BTC' | 'ETH' | 'SOL' | 'DOGE', coinAmount: number): boolean => {
    const g = gameRef.current;
    const holdKey = `${symbol.toLowerCase()}Held` as keyof GameState;
    const held = g[holdKey] as number;
    if (held < coinAmount || coinAmount <= 0) return false;
    const assets = marketRef.current.assets;
    const price = assets.find(a => a.symbol === symbol)?.price ?? 0;
    const hasTradingBonus = g.achievements.includes('trader');
    const hasLiquidity = g.researchUnlocked.includes('trd_05');
    const feeRate = hasLiquidity ? 0.001 : hasTradingBonus ? 0.002 : 0.005;
    const cashGain = coinAmount * price * (1 - feeRate);
    setGame(prev => {
      const prevHeld = prev[holdKey] as number;
      if (prevHeld < coinAmount) return prev;
      const next = {
        ...prev,
        [holdKey]: prevHeld - coinAmount,
        cash: prev.cash + cashGain,
        totalEarned: prev.totalEarned + cashGain,
        totalTradeCount: prev.totalTradeCount + 1,
      };
      saveGame(next);
      return next;
    });
    return true;
  }, [saveGame]);

  // ─── Prestige ─────────────────────────────────────────────────────────────────
  const prestigeRequirement = 500000 * Math.pow(3, game.prestigeLevel);
  const canPrestige = game.totalEarned >= prestigeRequirement;

  const performPrestige = useCallback(() => {
    setGame(prev => {
      // Calculate requirement inside callback to avoid stale closure
      const req = 500000 * Math.pow(3, prev.prestigeLevel);
      if (prev.totalEarned < req) return prev;
      const next: GameState = {
        ...defaultGame(),
        prestigeLevel: prev.prestigeLevel + 1,
        gameStartTime: Date.now(),
        cash: 12000 * (1 + prev.prestigeLevel * 1.0),
        insight: 0,
        // Preserve cross-prestige progression
        totalEarned: prev.totalEarned,
        completedContractCount: prev.completedContractCount,
        achievements: prev.achievements,
        totalTradeCount: prev.totalTradeCount,
        eventCount: prev.eventCount,
        crashEarned: prev.crashEarned,
        eventHistory: prev.eventHistory,
      };
      next.activeContracts = generateContracts(next, CONTRACTS_PER_SLOT);
      saveGame(next);
      return next;
    });
  }, [saveGame]);

  // ─── Derived values (memoised to avoid redundant recalc on non-tick renders) ─
  const derived = useMemo(() => getDerivedStats(game), [game, getDerivedStats]);
  const netWorth = useMemo(() => computeNetWorth(game), [game, computeNetWorth]);

  const researchNodes = useMemo<Record<ResearchBranch, ResearchNode[]>>(() => {
    const mapBranch = (branch: ResearchBranch) =>
      RESEARCH_NODES[branch].map(node => ({
        ...node,
        unlocked: game.researchUnlocked.includes(node.id),
      }));
    return {
      infrastructure: mapBranch('infrastructure'),
      trading: mapBranch('trading'),
      risk: mapBranch('risk'),
    };
  }, [game.researchUnlocked]);

  const clearOfflineEarnings = useCallback(() => setOfflineEarnings(0), []);

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      ...derived,
      netWorth,
      totalEarned: game.totalEarned,
      activeEffects: game.activeEffects,
      pendingEvent,
      buyBuilding,
      getBuildingCost,
      toggleBot,
      getBotActivationCost,
      unlockResearch,
      performPrestige,
      canPrestige,
      prestigeRequirement,
      researchNodes,
      offlineEarnings,
      clearOfflineEarnings,
      upgradeRig,
      getRigUpgradeCostFn,
      resolveEvent,
      buyAsset,
      sellAsset,
      newAchievements,
      clearNewAchievements,
      completedContractNames,
      clearCompletedContractNames,
    }),
    [game, derived, netWorth, pendingEvent, buyBuilding, getBuildingCost, toggleBot, getBotActivationCost, unlockResearch, performPrestige, canPrestige, prestigeRequirement, researchNodes, offlineEarnings, clearOfflineEarnings, upgradeRig, getRigUpgradeCostFn, resolveEvent, buyAsset, sellAsset, newAchievements, clearNewAchievements, completedContractNames, clearCompletedContractNames]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
