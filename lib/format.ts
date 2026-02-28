import Colors from '@/constants/colors';

/** Format cash/dollar amounts with B/M/K suffixes */
export function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** Format hash rate with TH/s or GH/s suffix */
export function fmtHash(h: number): string {
  if (h >= 1000) return `${(h / 1000).toFixed(2)} TH/s`;
  return `${h.toFixed(2)} GH/s`;
}

/** Format crypto asset price with appropriate decimals */
export function fmtPrice(symbol: string, price: number): string {
  if (symbol === 'DOGE') return `$${price.toFixed(4)}`;
  if (symbol === 'SOL') return `$${price.toFixed(2)}`;
  if (symbol === 'ETH') return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** Format coin holdings with symbol */
export function fmtCoin(n: number, symbol: string): string {
  if (n === 0) return `0 ${symbol}`;
  if (n < 0.0001) return `${n.toExponential(2)} ${symbol}`;
  return `${n.toFixed(6)} ${symbol}`;
}

/** Format elapsed time from a timestamp */
export function fmtTime(ms: number): string {
  const totalSeconds = Math.floor((Date.now() - ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Market regime color mapping */
export const REGIME_COLORS: Record<string, string> = {
  calm: Colors.accentGreen,
  trending: Colors.accent,
  mania: Colors.accentAmber,
  crash: Colors.accentRed,
  recovery: Colors.accentPurple,
};
