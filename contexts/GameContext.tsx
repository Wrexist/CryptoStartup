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

const SAVE_KEY = '@chain_district_save';

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
  riskGuard: 12000,
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

function defaultGame(): GameState {
  return {
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
  };
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

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as GameState;
          const merged = { ...defaultGame(), ...saved };

          // Calculate offline earnings (up to 4 hours)
          if (merged.lastSaveTime && merged.miningRigs > 0) {
            const lastSave = merged.lastSaveTime;
            const elapsed = Math.min(Date.now() - lastSave, 4 * 60 * 60 * 1000);
            const elapsedTicks = elapsed / 3000;
            const powerCap = merged.powerPlants * 50 + 100;
            const coolingCap = merged.coolingHubs * 40 + 100;
            const powerUsed = merged.miningRigs * 10;
            const coolingUsed = merged.miningRigs * 8;
            const powerEff = Math.min(1, powerCap / Math.max(powerUsed, 1));
            const coolingEff = Math.min(1, coolingCap / Math.max(coolingUsed, 1));
            const wearPenalty = merged.wearLevel / 200;
            const uptime = Math.max(0, 1 - wearPenalty);
            const hashRate = merged.miningRigs * 10 * powerEff * coolingEff * uptime;
            const baseIncome = (hashRate / 1000000) * 67400 * 3;
            const prestige = 1 + merged.prestigeLevel * 0.25;
            const earned = baseIncome * prestige * elapsedTicks * 0.5; // 50% efficiency offline

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

  const getDerivedStats = useCallback((g: GameState) => {
    const researchUnlocked = g.researchUnlocked;
    const hasBuildCostReduction = researchUnlocked.includes('inf_06');
    const hasOverclock = researchUnlocked.includes('inf_05');
    const hasPowerEfficiency = researchUnlocked.includes('inf_01');
    const hasCoolingEfficiency = researchUnlocked.includes('inf_02');
    const hasWearReduction = researchUnlocked.includes('inf_03');
    const hasCrashHedge = researchUnlocked.includes('rsk_02');
    const hasBotPerfBase = researchUnlocked.includes('trd_01');
    const hasBotPerfAdv = researchUnlocked.includes('trd_06');

    const powerCapacity = g.powerPlants * 50 + 100;
    const coolingCapacity = g.coolingHubs * 40 + 100;
    const powerUsed = g.miningRigs * (hasPowerEfficiency ? 8.8 : 10);
    const coolingUsed = g.miningRigs * (hasCoolingEfficiency ? 6.4 : 8);

    const powerEfficiency = Math.min(1, powerCapacity / Math.max(powerUsed, 1));
    const coolingEfficiency = Math.min(1, coolingCapacity / Math.max(coolingUsed, 1));
    const wearPenalty = g.wearLevel / 200;
    const uptime = Math.max(0, 1 - wearPenalty);
    const rigBoost = hasOverclock ? 1.3 : 1;
    const hashRate = g.miningRigs * 10 * powerEfficiency * coolingEfficiency * uptime * rigBoost;

    const btcPrice = marketRef.current.assets.find(a => a.symbol === 'BTC')?.price ?? 67400;
    let baseIncome = (hashRate / 1000000) * btcPrice * 3;

    const regime = marketRef.current.regime;
    if (regime === 'crash' && !hasCrashHedge) baseIncome *= 0.4;
    else if (regime === 'crash' && hasCrashHedge) baseIncome *= 0.7;
    else if (regime === 'mania') baseIncome *= 1.8;
    else if (regime === 'trending') baseIncome *= 1.3;
    else if (regime === 'recovery') baseIncome *= 1.1;

    let botIncome = 0;
    const botMultiplier = hasBotPerfAdv ? 1.4 : hasBotPerfBase ? 1.15 : 1;
    const hasGridBoost = researchUnlocked.includes('trd_03');
    const hasTrendBoost = researchUnlocked.includes('trd_04');
    if (g.bots.dca.active) botIncome += 120 * botMultiplier;
    if (g.bots.grid.active) botIncome += 280 * (hasGridBoost ? 1.25 : 1) * botMultiplier;
    if (g.bots.trend.active) botIncome += 520 * (hasTrendBoost ? 1.3 : 1) * botMultiplier;
    if (g.bots.riskGuard.active) botIncome += 180 * botMultiplier;

    const incomePerTick = baseIncome + botIncome;
    const insightPerTick = g.miningRigs * 0.05 + (g.bots.dca.active ? 0.5 : 0) + (g.bots.grid.active ? 1 : 0);

    const prestige = 1 + g.prestigeLevel * 0.25;

    return {
      powerCapacity,
      coolingCapacity,
      powerUsed,
      coolingUsed,
      hashRate,
      uptime,
      incomePerTick: incomePerTick * prestige,
      insightPerTick,
      hasBuildCostReduction,
      hasWearReduction,
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

  useEffect(() => {
    const interval = setInterval(() => {
      setGame(prev => {
        const stats = getDerivedStats(prev);
        const hasWearReduction = stats.hasWearReduction;
        const hasAutoMaintenance = prev.researchUnlocked.includes('inf_04');
        const wearRate = hasWearReduction ? 0.075 : 0.1;
        const wearIncrease = prev.miningRigs > 0 ? wearRate * (prev.miningRigs / (prev.maintenanceBays * 3 + 1)) : 0;
        const wearRepair = prev.maintenanceBays * (hasAutoMaintenance ? 0.4 : 0.2);
        const newWear = Math.max(0, Math.min(100, prev.wearLevel + wearIncrease - wearRepair));

        const hasBotStability = prev.researchUnlocked.includes('trd_02');
        const regime = marketRef.current.regime;
        const botFailRisk = regime === 'crash' && !hasBotStability ? 0.05 : 0;

        const earnedCash = stats.incomePerTick;
        const earnedInsight = stats.insightPerTick;

        const botUpdates = { ...prev.bots };
        if (botFailRisk > 0) {
          Object.keys(botUpdates).forEach(k => {
            const key = k as keyof typeof botUpdates;
            if (botUpdates[key].active && Math.random() < botFailRisk) {
              botUpdates[key] = { ...botUpdates[key], active: false };
            }
          });
        }

        const hasCB = prev.researchUnlocked.includes('rsk_05');
        if (hasCB && regime === 'crash') {
          Object.keys(botUpdates).forEach(k => {
            const key = k as keyof typeof botUpdates;
            botUpdates[key] = { ...botUpdates[key], active: false };
          });
        }

        const newState: GameState = {
          ...prev,
          cash: prev.cash + earnedCash,
          insight: prev.insight + earnedInsight,
          wearLevel: newWear,
          totalEarned: prev.totalEarned + earnedCash,
          bots: botUpdates,
        };

        saveGame(newState);
        return newState;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [getDerivedStats, saveGame]);

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

  const buyBuilding = useCallback((type: 'miningRig' | 'powerPlant' | 'coolingHub' | 'maintenanceBay' | 'securityOffice'): boolean => {
    const cost = getBuildingCost(type);
    if (gameRef.current.cash < cost) return false;
    setGame(prev => {
      if (prev.cash < cost) return prev;
      const update: Partial<GameState> = { cash: prev.cash - cost };
      if (type === 'miningRig') update.miningRigs = prev.miningRigs + 1;
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

  const getBotActivationCost = useCallback((bot: keyof GameState['bots']): number => {
    return BOT_COSTS[bot] ?? 0;
  }, []);

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
          bots: {
            ...prev.bots,
            [bot]: { ...prev.bots[bot], unlocked: true, active: true },
          },
        };
        saveGame(next);
        return next;
      });
      return true;
    }
    setGame(prev => {
      const next = {
        ...prev,
        bots: {
          ...prev.bots,
          [bot]: { ...prev.bots[bot], active: !prev.bots[bot].active },
        },
      };
      saveGame(next);
      return next;
    });
    return true;
  }, [saveGame]);

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

  const prestigeRequirement = 500000 * Math.pow(3, game.prestigeLevel);
  const canPrestige = game.totalEarned >= prestigeRequirement;

  const performPrestige = useCallback(() => {
    setGame(prev => {
      if (prev.totalEarned < prestigeRequirement) return prev;
      const next: GameState = {
        ...defaultGame(),
        prestigeLevel: prev.prestigeLevel + 1,
        gameStartTime: Date.now(),
        cash: 12000 * (1 + prev.prestigeLevel * 0.5),
        insight: 0,
      };
      saveGame(next);
      return next;
    });
  }, [prestigeRequirement, saveGame]);

  const derived = getDerivedStats(game);
  const netWorth = computeNetWorth(game);

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
    }),
    [game, derived, netWorth, buyBuilding, getBuildingCost, toggleBot, getBotActivationCost, unlockResearch, performPrestige, canPrestige, prestigeRequirement, researchNodes, offlineEarnings, clearOfflineEarnings]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
