import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useMarket, AssetPrice, MarketRegime } from '@/contexts/MarketContext';
import { useGame } from '@/contexts/GameContext';
import Colors from '@/constants/colors';

const REGIME_INFO: Record<MarketRegime, { color: string; icon: string; desc: string; miningEffect: string; botEffect: string }> = {
  calm: {
    color: Colors.accentGreen,
    icon: 'remove-circle-outline',
    desc: 'Low volatility, steady conditions. Stable mining profitability.',
    miningEffect: 'Normal output',
    botEffect: 'Normal performance',
  },
  trending: {
    color: Colors.accent,
    icon: 'trending-up',
    desc: 'Prices rising steadily. Mining profitability increased.',
    miningEffect: '+30% income',
    botEffect: '+15% performance',
  },
  mania: {
    color: Colors.accentAmber,
    icon: 'flame',
    desc: 'Extreme price surges. High volatility, high reward.',
    miningEffect: '+80% income',
    botEffect: 'High risk/reward',
  },
  crash: {
    color: Colors.accentRed,
    icon: 'alert-circle',
    desc: 'Market collapse. Mining profitability severely reduced.',
    miningEffect: '-60% income',
    botEffect: 'Failure risk high',
  },
  recovery: {
    color: Colors.accentPurple,
    icon: 'arrow-up-circle',
    desc: 'Prices bouncing back. Moderate upside.',
    miningEffect: '+10% income',
    botEffect: 'Stable',
  },
};

function Sparkline({ history, color }: { history: number[]; color: string }) {
  const width = 80;
  const height = 36;
  if (history.length < 2) return null;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = Math.max(max - min, 0.0001);
  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  });
  const polyPoints = points.join(' ');
  const areaPoints = `0,${height} ${polyPoints} ${width},${height}`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`grad_${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Polygon points={areaPoints} fill={`url(#grad_${color})`} />
      <Polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function fmtPrice(symbol: string, price: number): string {
  if (symbol === 'DOGE') return `$${price.toFixed(4)}`;
  if (symbol === 'SOL') return `$${price.toFixed(2)}`;
  if (symbol === 'ETH') return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const ASSET_COLORS: Record<string, string> = {
  BTC: Colors.accentAmber,
  ETH: Colors.accent,
  SOL: Colors.accentPurple,
  DOGE: Colors.accentGreen,
};

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  DOGE: 'Dogecoin',
};

type TradeSymbol = 'BTC' | 'ETH' | 'SOL' | 'DOGE';

function AssetCard({ asset, onPress }: { asset: AssetPrice; onPress: () => void }) {
  const color = ASSET_COLORS[asset.symbol] ?? Colors.accent;
  const isPositive = asset.change24h >= 0;
  const changeColor = isPositive ? Colors.accentGreen : Colors.accentRed;

  return (
    <Pressable style={styles.assetCard} onPress={onPress}>
      <View style={styles.assetLeft}>
        <View style={[styles.assetIconWrap, { backgroundColor: color + '22' }]}>
          <Text style={[styles.assetIconText, { color }]}>{asset.symbol[0]}</Text>
        </View>
        <View>
          <Text style={styles.assetSymbol}>{asset.symbol}</Text>
          <Text style={styles.assetName}>{ASSET_NAMES[asset.symbol] ?? asset.symbol}</Text>
        </View>
      </View>

      <View style={styles.assetCenter}>
        <Sparkline history={asset.history} color={changeColor} />
      </View>

      <View style={styles.assetRight}>
        <Text style={styles.assetPrice}>{fmtPrice(asset.symbol, asset.price)}</Text>
        <View style={[styles.changeBadge, { backgroundColor: changeColor + '22' }]}>
          <Ionicons name={isPositive ? 'arrow-up' : 'arrow-down'} size={10} color={changeColor} />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(asset.change24h).toFixed(2)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Trade Modal ────────────────────────────────────────────────────────────
function TradeModal({
  symbol,
  onClose,
}: {
  symbol: TradeSymbol;
  onClose: () => void;
}) {
  const { game, buyAsset, sellAsset } = useGame();
  const { market } = useMarket();
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [pct, setPct] = useState(0);

  const asset = market.assets.find(a => a.symbol === symbol);
  const price = asset?.price ?? 0;
  const color = ASSET_COLORS[symbol] ?? Colors.accent;
  const holdKey = `${symbol.toLowerCase()}Held` as keyof typeof game;
  const held = (game[holdKey] as number) ?? 0;

  const hasTradingBonus = game.achievements.includes('trader');
  const hasLiquidity = game.researchUnlocked.includes('trd_05');
  const feeRate = hasLiquidity ? 0.1 : hasTradingBonus ? 0.2 : 0.5;

  const cashAmount = pct > 0 ? game.cash * (pct / 100) : 0;
  const sellCoins = pct > 0 ? held * (pct / 100) : 0;
  const buyCoins = price > 0 ? cashAmount / price : 0;
  const sellCash = sellCoins * price * (1 - feeRate / 100);

  const handleTrade = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === 'buy' && cashAmount > 0) {
      buyAsset(symbol, cashAmount);
    } else if (mode === 'sell' && sellCoins > 0) {
      sellAsset(symbol, sellCoins);
    }
    setPct(0);
    onClose();
  }, [mode, cashAmount, sellCoins, symbol, buyAsset, sellAsset, onClose]);

  const PRESETS = [25, 50, 75, 100];

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.assetIconWrap, { backgroundColor: color + '22' }]}>
              <Text style={[styles.assetIconText, { color }]}>{symbol[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{ASSET_NAMES[symbol]}</Text>
              <Text style={styles.modalPrice}>{fmtPrice(symbol, price)}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Holdings row */}
          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>You hold:</Text>
            <Text style={styles.holdingsValue}>
              {held > 0 ? `${held < 0.001 ? held.toExponential(2) : held.toFixed(held >= 1 ? 4 : 6)} ${symbol}` : `None`}
            </Text>
          </View>

          {/* Buy/Sell toggle */}
          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeBtn, mode === 'buy' && { backgroundColor: Colors.accentGreen + '22', borderColor: Colors.accentGreen + '55' }]}
              onPress={() => { setMode('buy'); setPct(0); }}
            >
              <Text style={[styles.modeBtnText, mode === 'buy' && { color: Colors.accentGreen }]}>Buy</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'sell' && { backgroundColor: Colors.accentRed + '22', borderColor: Colors.accentRed + '55' }]}
              onPress={() => { setMode('sell'); setPct(0); }}
            >
              <Text style={[styles.modeBtnText, mode === 'sell' && { color: Colors.accentRed }]}>Sell</Text>
            </Pressable>
          </View>

          {/* Amount source */}
          <Text style={styles.amountLabel}>
            {mode === 'buy' ? `Available: ${fmt(game.cash)}` : `Holdings: ${held.toFixed(held >= 1 ? 4 : 6)} ${symbol}`}
          </Text>

          {/* Preset buttons */}
          <View style={styles.presetRow}>
            {PRESETS.map(p => (
              <Pressable
                key={p}
                style={[styles.presetBtn, pct === p && { backgroundColor: color + '22', borderColor: color + '55' }]}
                onPress={() => setPct(p)}
              >
                <Text style={[styles.presetText, pct === p && { color }]}>
                  {p === 100 ? 'MAX' : `${p}%`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Trade preview */}
          {pct > 0 && (
            <View style={styles.previewCard}>
              {mode === 'buy' ? (
                <>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Spend</Text>
                    <Text style={styles.previewValue}>{fmt(cashAmount)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Receive</Text>
                    <Text style={[styles.previewValue, { color: Colors.accentGreen }]}>
                      {buyCoins < 0.001 ? buyCoins.toExponential(2) : buyCoins.toFixed(buyCoins >= 1 ? 4 : 6)} {symbol}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Sell</Text>
                    <Text style={styles.previewValue}>
                      {sellCoins < 0.001 ? sellCoins.toExponential(2) : sellCoins.toFixed(sellCoins >= 1 ? 4 : 6)} {symbol}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Receive</Text>
                    <Text style={[styles.previewValue, { color: Colors.accentGreen }]}>{fmt(sellCash)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Fee</Text>
                    <Text style={[styles.previewValue, { color: Colors.textMuted }]}>{feeRate}%</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Confirm */}
          <Pressable
            style={[
              styles.confirmBtn,
              {
                backgroundColor: pct > 0
                  ? (mode === 'buy' ? Colors.accentGreen : Colors.accentRed)
                  : Colors.surfaceHigh,
              },
            ]}
            onPress={handleTrade}
            disabled={pct === 0 || (mode === 'sell' && held <= 0)}
          >
            <Text style={[styles.confirmText, pct === 0 && { color: Colors.textMuted }]}>
              {pct > 0
                ? (mode === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`)
                : 'Select amount'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const { market } = useMarket();
  const [tradeSymbol, setTradeSymbol] = useState<TradeSymbol | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const regime = market.regime;
  const info = REGIME_INFO[regime];

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop: topInset }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerLabel}>MARKET INTEL</Text>
          <Text style={styles.headerTitle}>Live Prices</Text>
        </View>

        <View style={[styles.regimeCard, { borderColor: info.color + '44', backgroundColor: info.color + '0D' }]}>
          <View style={styles.regimeCardHeader}>
            <Ionicons name={info.icon as any} size={20} color={info.color} />
            <Text style={[styles.regimeCardLabel, { color: info.color }]}>
              REGIME: {market.regimeLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.regimeDesc}>{info.desc}</Text>
          <View style={styles.regimeEffects}>
            <View style={styles.effectPill}>
              <Ionicons name="flash" size={11} color={Colors.accentAmber} />
              <Text style={styles.effectText}>{info.miningEffect}</Text>
            </View>
            <View style={styles.effectPill}>
              <Ionicons name="hardware-chip-outline" size={11} color={Colors.accent} />
              <Text style={styles.effectText}>{info.botEffect}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>ASSET PRICES</Text>
            <Text style={styles.tapHint}>Tap to trade</Text>
          </View>
          <View style={styles.assetList}>
            {market.assets.map(asset => (
              <AssetCard
                key={asset.symbol}
                asset={asset}
                onPress={() => setTradeSymbol(asset.symbol as TradeSymbol)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGIME GUIDE</Text>
          <View style={styles.regimeGuide}>
            {(Object.entries(REGIME_INFO) as [MarketRegime, typeof info][]).map(([r, i]) => (
              <View key={r} style={[styles.regimeGuideRow, r === regime && { backgroundColor: i.color + '12' }]}>
                <View style={[styles.regimeDot, { backgroundColor: i.color }]} />
                <View style={styles.regimeGuideContent}>
                  <Text style={[styles.regimeGuideName, { color: r === regime ? i.color : Colors.textSecondary }]}>{i.desc.split('.')[0]}</Text>
                  <Text style={styles.regimeGuideEffect}>{i.miningEffect} mining · {i.botEffect} bots</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {tradeSymbol && (
        <TradeModal symbol={tradeSymbol} onClose={() => setTradeSymbol(null)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  headerLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  regimeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  regimeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  regimeCardLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  regimeDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  regimeEffects: {
    flexDirection: 'row',
    gap: 8,
  },
  effectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  effectText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  tapHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  assetList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  assetIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIconText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  assetSymbol: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  assetName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  assetCenter: {
    marginHorizontal: 8,
  },
  assetRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  assetPrice: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  changeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  regimeGuide: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  regimeGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  regimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  regimeGuideContent: {
    flex: 1,
  },
  regimeGuideName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    marginBottom: 1,
  },
  regimeGuideEffect: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  // ─── Trade Modal ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  modalPrice: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  holdingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  holdingsLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  holdingsValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textMuted,
  },
  amountLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  previewCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  previewValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
