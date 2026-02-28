import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { useMarket, AssetPrice, MarketRegime } from '@/contexts/MarketContext';
import Colors from '@/constants/colors';
import { fmtPrice } from '@/lib/format';

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

const ASSET_COLORS: Record<string, string> = {
  BTC: Colors.accentAmber,
  ETH: Colors.accent,
  SOL: Colors.accentPurple,
  DOGE: Colors.accentGreen,
};

function AssetCard({ asset }: { asset: AssetPrice }) {
  const color = ASSET_COLORS[asset.symbol] ?? Colors.accent;
  const isPositive = asset.change24h >= 0;
  const changeColor = isPositive ? Colors.accentGreen : Colors.accentRed;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <View style={styles.assetCard}>
      <View style={styles.assetLeft}>
        <View style={[styles.assetIconWrap, { backgroundColor: color + '22' }]}>
          <Text style={[styles.assetIconText, { color }]}>{asset.symbol[0]}</Text>
        </View>
        <View>
          <Text style={styles.assetSymbol}>{asset.symbol}</Text>
          <Text style={styles.assetName}>
            {asset.symbol === 'BTC' ? 'Bitcoin' : asset.symbol === 'ETH' ? 'Ethereum' : asset.symbol === 'SOL' ? 'Solana' : 'Dogecoin'}
          </Text>
        </View>
      </View>

      <View style={styles.assetCenter}>
        <Sparkline history={asset.history} color={changeColor} />
      </View>

      <View style={styles.assetRight}>
        <Text style={styles.assetPrice}>{fmtPrice(asset.symbol, asset.price)}</Text>
        <View style={[styles.changeBadge, { backgroundColor: changeColor + '22' }]}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={changeColor}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(asset.change24h).toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const { market } = useMarket();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const regime = market.regime;
  const info = REGIME_INFO[regime];

  return (
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
        <Text style={styles.sectionTitle}>ASSET PRICES</Text>
        <View style={styles.assetList}>
          {market.assets.map(asset => (
            <AssetCard key={asset.symbol} asset={asset} />
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
});
