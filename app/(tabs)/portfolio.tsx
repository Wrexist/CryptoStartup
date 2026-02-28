import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { useMarket } from '@/contexts/MarketContext';
import Colors from '@/constants/colors';
import { fmt, fmtCoin } from '@/lib/format';

const ASSET_INFO = {
  BTC: { name: 'Bitcoin', color: Colors.accentAmber, icon: 'currency-btc' },
  ETH: { name: 'Ethereum', color: Colors.accent, icon: 'currency-eth' },
  SOL: { name: 'Solana', color: Colors.accentPurple, icon: 'currency-sol' },
  DOGE: { name: 'Dogecoin', color: Colors.accentGreen, icon: 'dog' },
};

type AssetSymbol = 'BTC' | 'ETH' | 'SOL' | 'DOGE';

const BOT_INFO = {
  dca: {
    name: 'DCA Bot',
    desc: 'Dollar-cost averages into assets. Steady, passive income.',
    income: '$120/tick',
    icon: 'repeat',
    color: Colors.accentGreen,
    cost: 0,
  },
  grid: {
    name: 'Grid Bot',
    desc: 'Executes buy/sell grid orders. Profits from volatility.',
    income: '$280/tick',
    icon: 'grid',
    color: Colors.accent,
    cost: 2500,
  },
  trend: {
    name: 'Trend Bot',
    desc: 'Follows momentum. High reward, higher risk.',
    income: '$520/tick',
    icon: 'trending-up',
    color: Colors.accentAmber,
    cost: 6000,
  },
  riskGuard: {
    name: 'Risk Guard',
    desc: 'Hedges exposure during volatility spikes.',
    income: '$180/tick',
    icon: 'shield-checkmark-outline',
    color: Colors.accentPurple,
    cost: 12000,
  },
};

interface BotCardProps {
  botKey: keyof typeof BOT_INFO;
}

function BotCard({ botKey }: BotCardProps) {
  const { game, toggleBot, getBotActivationCost } = useGame();
  const botState = game.bots[botKey];
  const info = BOT_INFO[botKey];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const cost = getBotActivationCost(botKey);
  const canAfford = game.cash >= cost;
  const isActive = botState.active;
  const isUnlocked = botState.unlocked;

  const handleToggle = () => {
    if (!isUnlocked && !canAfford) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleBot(botKey);
  };

  return (
    <Animated.View style={[styles.botCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.botCardLeft}>
        <View style={[styles.botIconWrap, { backgroundColor: info.color + '22' }]}>
          <Ionicons name={info.icon as any} size={22} color={info.color} />
        </View>
        <View style={styles.botInfo}>
          <View style={styles.botNameRow}>
            <Text style={styles.botName}>{info.name}</Text>
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: info.color + '22' }]}>
                <View style={[styles.activeDot, { backgroundColor: info.color }]} />
                <Text style={[styles.activeText, { color: info.color }]}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.botDesc}>{info.desc}</Text>
          <Text style={[styles.botIncome, { color: info.color }]}>{info.income}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleToggle}
        style={[
          styles.toggleBtn,
          {
            backgroundColor: isActive
              ? info.color + '22'
              : isUnlocked
              ? Colors.surfaceHigh
              : canAfford
              ? info.color + '15'
              : Colors.surfaceHigh,
            borderColor: isActive
              ? info.color + '66'
              : isUnlocked
              ? Colors.border
              : canAfford
              ? info.color + '44'
              : Colors.border,
          },
        ]}
      >
        {isUnlocked ? (
          <Text style={[styles.toggleBtnText, { color: isActive ? info.color : Colors.textMuted }]}>
            {isActive ? 'Pause' : 'Start'}
          </Text>
        ) : (
          <View style={styles.unlockContent}>
            <Ionicons name="lock-closed" size={12} color={canAfford ? info.color : Colors.textMuted} />
            <Text style={[styles.toggleBtnText, { color: canAfford ? info.color : Colors.textMuted }]}>
              {fmt(cost)}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { game, netWorth, incomePerTick, hashRate } = useGame();
  const { market } = useMarket();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const assets = market.assets;
  const btcPrice = assets.find(a => a.symbol === 'BTC')?.price ?? 67400;
  const ethPrice = assets.find(a => a.symbol === 'ETH')?.price ?? 3820;
  const solPrice = assets.find(a => a.symbol === 'SOL')?.price ?? 185;
  const dogePrice = assets.find(a => a.symbol === 'DOGE')?.price ?? 0.185;

  const holdings = [
    { symbol: 'BTC', amount: game.btcHeld, value: game.btcHeld * btcPrice, color: Colors.accentAmber },
    { symbol: 'ETH', amount: game.ethHeld, value: game.ethHeld * ethPrice, color: Colors.accent },
    { symbol: 'SOL', amount: game.solHeld, value: game.solHeld * solPrice, color: Colors.accentPurple },
    { symbol: 'DOGE', amount: game.dogeHeld, value: game.dogeHeld * dogePrice, color: Colors.accentGreen },
  ].filter(h => h.amount > 0);

  const totalHoldings = holdings.reduce((sum, h) => sum + h.value, 0);
  const activeBots = Object.values(game.bots).filter(b => b.active).length;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>PORTFOLIO</Text>
        <Text style={styles.headerTitle}>{fmt(netWorth)}</Text>
        <Text style={styles.headerSub}>Total Net Worth</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Cash</Text>
          <Text style={[styles.metricValue, { color: Colors.accentGreen }]}>{fmt(game.cash)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Holdings</Text>
          <Text style={[styles.metricValue, { color: Colors.accent }]}>{fmt(totalHoldings)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Income/tick</Text>
          <Text style={[styles.metricValue, { color: Colors.accentAmber }]}>{fmt(incomePerTick)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ASSET HOLDINGS</Text>
        {holdings.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="currency-btc" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Holdings</Text>
            <Text style={styles.emptyDesc}>
              Mining earnings accumulate as cash. Trading bots convert some to crypto as they operate.
            </Text>
          </View>
        ) : (
          <View style={styles.holdingsCard}>
            {holdings.map(h => (
              <View key={h.symbol} style={styles.holdingRow}>
                <View style={[styles.holdingDot, { backgroundColor: h.color }]} />
                <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                <Text style={styles.holdingAmount}>{h.amount.toFixed(6)}</Text>
                <Text style={[styles.holdingValue, { color: h.color }]}>{fmt(h.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRADING BOTS</Text>
          <View style={styles.botBadge}>
            <Text style={styles.botBadgeText}>{activeBots} ACTIVE</Text>
          </View>
        </View>
        <View style={styles.botList}>
          {(Object.keys(BOT_INFO) as (keyof typeof BOT_INFO)[]).map(key => (
            <BotCard key={key} botKey={key} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERFORMANCE</Text>
        <View style={styles.perfCard}>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Total Earned</Text>
            <Text style={[styles.perfValue, { color: Colors.accentGreen }]}>{fmt(game.totalEarned)}</Text>
          </View>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Active Bots</Text>
            <Text style={styles.perfValue}>{activeBots} / 4</Text>
          </View>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Insight Earned</Text>
            <Text style={[styles.perfValue, { color: Colors.accentPurple }]}>{game.insight.toFixed(1)}</Text>
          </View>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Prestige Level</Text>
            <Text style={[styles.perfValue, { color: Colors.accentAmber }]}>
              {game.prestigeLevel > 0 ? `Fork ${game.prestigeLevel} (+${game.prestigeLevel * 25}%)` : 'None'}
            </Text>
          </View>
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
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 40,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  metricValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  botBadge: {
    backgroundColor: Colors.accentGreenDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  botBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: Colors.accentGreen,
    letterSpacing: 1,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  emptyDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  holdingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  holdingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  holdingSymbol: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  holdingAmount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  holdingValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  botList: {
    gap: 8,
  },
  botCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botCardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  botIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botInfo: {
    flex: 1,
    gap: 2,
  },
  botNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  activeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  botDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  botIncome: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  unlockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  perfValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
