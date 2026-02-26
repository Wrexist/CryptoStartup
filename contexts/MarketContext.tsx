import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from 'react';

export type MarketRegime = 'calm' | 'trending' | 'mania' | 'crash' | 'recovery';

export interface AssetPrice {
  symbol: 'BTC' | 'ETH' | 'SOL' | 'DOGE';
  price: number;
  change24h: number;
  history: number[];
}

interface MarketState {
  regime: MarketRegime;
  regimeLabel: string;
  assets: AssetPrice[];
  tick: number;
}

interface MarketContextValue {
  market: MarketState;
  getBtcPrice: () => number;
}

const BASE_PRICES = { BTC: 67400, ETH: 3820, SOL: 185, DOGE: 0.185 };

const REGIME_PARAMS: Record<MarketRegime, { volatility: number; drift: number; label: string; duration: [number, number] }> = {
  calm: { volatility: 0.008, drift: 0.0002, label: 'Calm', duration: [15, 25] },
  trending: { volatility: 0.015, drift: 0.003, label: 'Trending Up', duration: [10, 18] },
  mania: { volatility: 0.03, drift: 0.008, label: 'Mania', duration: [5, 10] },
  crash: { volatility: 0.025, drift: -0.012, label: 'Market Crash', duration: [5, 12] },
  recovery: { volatility: 0.018, drift: 0.005, label: 'Recovery', duration: [8, 15] },
};

const REGIME_TRANSITIONS: Record<MarketRegime, MarketRegime[]> = {
  calm: ['calm', 'calm', 'trending', 'crash'],
  trending: ['trending', 'calm', 'mania'],
  mania: ['crash', 'recovery', 'calm'],
  crash: ['crash', 'recovery', 'recovery'],
  recovery: ['calm', 'calm', 'trending'],
};

function nextPrice(current: number, params: { volatility: number; drift: number }): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const change = params.drift + params.volatility * z;
  return Math.max(current * (1 + change), current * 0.01);
}

function pickRegime(current: MarketRegime): MarketRegime {
  const pool = REGIME_TRANSITIONS[current];
  return pool[Math.floor(Math.random() * pool.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const HISTORY_LEN = 30;

function initAssets(): AssetPrice[] {
  return [
    { symbol: 'BTC', price: BASE_PRICES.BTC, change24h: 0, history: Array(HISTORY_LEN).fill(BASE_PRICES.BTC) },
    { symbol: 'ETH', price: BASE_PRICES.ETH, change24h: 0, history: Array(HISTORY_LEN).fill(BASE_PRICES.ETH) },
    { symbol: 'SOL', price: BASE_PRICES.SOL, change24h: 0, history: Array(HISTORY_LEN).fill(BASE_PRICES.SOL) },
    { symbol: 'DOGE', price: BASE_PRICES.DOGE, change24h: 0, history: Array(HISTORY_LEN).fill(BASE_PRICES.DOGE) },
  ];
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [regime, setRegime] = useState<MarketRegime>('calm');
  const [assets, setAssets] = useState<AssetPrice[]>(initAssets);
  const [tick, setTick] = useState(0);

  const regimeTicksRef = useRef(0);
  const regimeDurationRef = useRef(randInt(15, 25));
  const regimeRef = useRef<MarketRegime>('calm');

  useEffect(() => {
    const interval = setInterval(() => {
      regimeTicksRef.current += 1;

      if (regimeTicksRef.current >= regimeDurationRef.current) {
        const next = pickRegime(regimeRef.current);
        regimeRef.current = next;
        setRegime(next);
        const params = REGIME_PARAMS[next];
        regimeDurationRef.current = randInt(params.duration[0], params.duration[1]);
        regimeTicksRef.current = 0;
      }

      const params = REGIME_PARAMS[regimeRef.current];

      setAssets(prev =>
        prev.map(asset => {
          const newPrice = nextPrice(asset.price, params);
          const newHistory = [...asset.history.slice(1), newPrice];
          const oldest = newHistory[0];
          const change24h = ((newPrice - oldest) / oldest) * 100;
          return { ...asset, price: newPrice, history: newHistory, change24h };
        })
      );

      setTick(t => t + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getBtcPrice = () => assets.find(a => a.symbol === 'BTC')?.price ?? BASE_PRICES.BTC;

  const value = useMemo<MarketContextValue>(
    () => ({
      market: {
        regime,
        regimeLabel: REGIME_PARAMS[regime].label,
        assets,
        tick,
      },
      getBtcPrice,
    }),
    [regime, assets, tick]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be inside MarketProvider');
  return ctx;
}
