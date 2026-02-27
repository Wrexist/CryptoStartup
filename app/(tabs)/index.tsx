import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { useMarket } from '@/contexts/MarketContext';
import { useToast } from '@/components/GameToast';
import { IsometricDistrict } from '@/components/IsometricDistrict';
import { BuildingDetailSheet } from '@/components/BuildingDetailSheet';
import Colors from '@/constants/colors';

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtHash(h: number): string {
  if (h >= 1000) return `${(h / 1000).toFixed(2)} TH/s`;
  return `${h.toFixed(2)} GH/s`;
}

const REGIME_COLORS: Record<string, string> = {
  calm: Colors.accentGreen,
  trending: Colors.accent,
  mania: Colors.accentAmber,
  crash: Colors.accentRed,
  recovery: Colors.accentPurple,
};

const BUILDING_CONFIG_ORDER = [
  {
    type: 'miningRig' as const,
    label: 'Mining Rig',
    icon: 'server' as const,
    color: Colors.accentAmber,
    stat: '+10 GH/s · 10GW · 8TU',
  },
  {
    type: 'powerPlant' as const,
    label: 'Power Plant',
    icon: 'lightning-bolt' as const,
    color: Colors.accent,
    stat: '+50 GW capacity',
  },
  {
    type: 'coolingHub' as const,
    label: 'Cooling Hub',
    icon: 'snowflake' as const,
    color: Colors.accentGreen,
    stat: '+40 TU capacity',
  },
  {
    type: 'maintenanceBay' as const,
    label: 'Maintenance Bay',
    icon: 'wrench' as const,
    color: Colors.accentPurple,
    stat: '-0.2% wear/tick',
  },
  {
    type: 'securityOffice' as const,
    label: 'Security Office',
    icon: 'shield-lock' as const,
    color: Colors.accentRed,
    stat: 'Reduces incidents',
  },
] as const;

interface BuildCardProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  stat: string;
  count: number;
  cost: number;
  canAfford: boolean;
  onBuy: () => void;
  onView: () => void;
}

function BuildCard({ label, icon, color, stat, count, cost, canAfford, onBuy, onView }: BuildCardProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handleBuyPress = () => {
    if (!canAfford) {
      Animated.sequence([
        Animated.timing(pressAnim, { toValue: 0.97, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pressAnim, { toValue: 1, duration: 100, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
      return;
    }
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.95, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pressAnim, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBuy();
  };

  return (
    <Animated.View style={[styles.buildCard, { transform: [{ scale: pressAnim }] }]}>
      <Pressable style={styles.buildCardInner} onPress={onView}>
        <View style={[styles.buildIconWrap, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
          {count > 0 && (
            <View style={[styles.buildCountBadge, { backgroundColor: color }]}>
              <Text style={styles.buildCountText}>{count}</Text>
            </View>
          )}
        </View>
        <View style={styles.buildCardInfo}>
          <Text style={styles.buildCardLabel}>{label}</Text>
          <Text style={styles.buildCardStat}>{stat}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={handleBuyPress}
        style={[
          styles.buildBuyBtn,
          {
            backgroundColor: canAfford ? color + '22' : Colors.surfaceHigh,
            borderColor: canAfford ? color + '44' : Colors.border,
          },
        ]}
      >
        <Text style={[styles.buildBuyText, { color: canAfford ? color : Colors.textMuted }]}>
          {fmt(cost)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ResourceBar({ label, used, capacity, color }: { label: string; used: number; capacity: number; color: string }) {
  const ratio = capacity > 0 ? Math.min(1, used / capacity) : 0;
  const barColor = ratio > 0.9 ? Colors.accentRed : ratio > 0.7 ? Colors.accentAmber : color;
  return (
    <View style={styles.resourceItem}>
      <View style={styles.resourceLabelRow}>
        <Text style={styles.resourceLabel}>{label}</Text>
        <Text style={[styles.resourceValue, { color: barColor }]}>
          {used.toFixed(0)}/{capacity.toFixed(0)}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

export default function DistrictScreen() {
  const insets = useSafeAreaInsets();
  const {
    game, powerCapacity, powerUsed, coolingCapacity, coolingUsed,
    hashRate, uptime, incomePerTick, netWorth, buyBuilding, getBuildingCost,
    offlineEarnings, clearOfflineEarnings,
  } = useGame();
  const { market } = useMarket();
  const { showToast } = useToast();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const prevRegime = useRef(market.regime);
  const prevRigs = useRef(game.miningRigs);
  const prevNetWorth = useRef(netWorth);
  const milestoneShown = useRef<Set<number>>(new Set());

  // Regime change toast
  useEffect(() => {
    if (market.regime !== prevRegime.current) {
      const messages: Record<string, string> = {
        crash: 'Market Crash — mining income severely reduced',
        mania: 'Market Mania — earnings surging!',
        recovery: 'Recovery phase — prices stabilizing',
        trending: 'Trending Up — profitability rising',
        calm: 'Market calmed — steady conditions',
      };
      showToast(messages[market.regime] ?? 'Regime shift', 'regime', 'pulse');
      prevRegime.current = market.regime;
    }
  }, [market.regime]);

  // Heat warning toast
  useEffect(() => {
    if (game.wearLevel > 80 && game.miningRigs > 0) {
      showToast('Critical wear! Build maintenance bays immediately', 'warning', 'alert-circle');
    }
  }, [Math.floor(game.wearLevel / 20)]);

  // Power warning toast
  useEffect(() => {
    if (powerCapacity > 0 && powerUsed / powerCapacity > 0.9 && game.miningRigs > 0) {
      showToast('Power overloaded — efficiency dropping', 'warning', 'flash');
    }
  }, [Math.floor((powerUsed / Math.max(powerCapacity, 1)) * 10)]);

  // Net worth milestones
  const MILESTONES = [10000, 50000, 100000, 500000, 1_000_000, 5_000_000, 10_000_000];
  useEffect(() => {
    for (const m of MILESTONES) {
      if (netWorth >= m && !milestoneShown.current.has(m)) {
        milestoneShown.current.add(m);
        showToast(`Net worth milestone: ${fmt(m)}!`, 'milestone', 'trending-up');
      }
    }
  }, [Math.floor(netWorth / 5000)]);

  // First rig achievement
  useEffect(() => {
    if (game.miningRigs === 1 && prevRigs.current === 0) {
      showToast('First mining rig deployed! District is live.', 'achievement', 'star');
    }
    if (game.miningRigs === 5 && prevRigs.current < 5) {
      showToast('5 rigs running — serious hash power!', 'achievement', 'star');
    }
    if (game.miningRigs === 9 && prevRigs.current < 9) {
      showToast('District fully mined! Maximum rig capacity.', 'achievement', 'trophy');
    }
    prevRigs.current = game.miningRigs;
  }, [game.miningRigs]);

  // Offline earnings notification
  useEffect(() => {
    if (offlineEarnings > 0) {
      const timer = setTimeout(() => {
        showToast(`Offline earnings: +${fmt(offlineEarnings)} while away`, 'milestone', 'moon');
        clearOfflineEarnings();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [offlineEarnings]);

  const regimeColor = REGIME_COLORS[market.regime] ?? Colors.accent;
  const wearColor = game.wearLevel > 70 ? Colors.accentRed : game.wearLevel > 40 ? Colors.accentAmber : Colors.accentGreen;

  const getBuildingCount = (type: string) => {
    if (type === 'miningRig') return game.miningRigs;
    if (type === 'powerPlant') return game.powerPlants - 2;
    if (type === 'coolingHub') return game.coolingHubs - 2;
    if (type === 'maintenanceBay') return game.maintenanceBays;
    return game.securityOffices;
  };

  const handleBuy = useCallback((type: Parameters<typeof buyBuilding>[0]) => {
    const success = buyBuilding(type);
    if (!success && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [buyBuilding]);

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop: topInset }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>NET WORTH</Text>
            <Text style={styles.netWorth}>{fmt(netWorth)}</Text>
            <Text style={[styles.cashSub, { color: Colors.accentGreen }]}>{fmt(game.cash)} cash</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.regimeBadge, { backgroundColor: regimeColor + '20', borderColor: regimeColor + '50' }]}>
              <View style={[styles.regimeDot, { backgroundColor: regimeColor }]} />
              <Text style={[styles.regimeText, { color: regimeColor }]}>{market.regimeLabel}</Text>
            </View>
            <Text style={[styles.incomeLabel, { color: Colors.accentAmber }]}>
              {fmt(incomePerTick)}/tick
            </Text>
          </View>
        </View>

        {/* ── Quick stats ── */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Ionicons name="flash" size={11} color={Colors.accentAmber} />
            <Text style={styles.quickStatText}>{fmtHash(hashRate)}</Text>
          </View>
          <View style={styles.quickStat}>
            <MaterialCommunityIcons name="cpu-64-bit" size={11} color={Colors.accent} />
            <Text style={styles.quickStatText}>{(uptime * 100).toFixed(0)}% uptime</Text>
          </View>
          <View style={styles.quickStat}>
            <MaterialCommunityIcons name="flask" size={11} color={Colors.accentPurple} />
            <Text style={styles.quickStatText}>{game.insight.toFixed(0)} insight</Text>
          </View>
        </View>

        {/* ── 3D Isometric District ── */}
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR DISTRICT</Text>
            <Text style={styles.sectionHint}>Tap building to inspect</Text>
          </View>
          <IsometricDistrict onBuildingPress={type => setSelectedBuilding(type)} />
        </View>

        {/* ── Infrastructure status ── */}
        <View style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>INFRASTRUCTURE STATUS</Text>
          <View style={styles.resourceCard}>
            <ResourceBar label="Power" used={powerUsed} capacity={powerCapacity} color={Colors.accentAmber} />
            <ResourceBar label="Cooling" used={coolingUsed} capacity={coolingCapacity} color={Colors.accent} />
            <View style={styles.resourceItem}>
              <View style={styles.resourceLabelRow}>
                <Text style={styles.resourceLabel}>Wear Level</Text>
                <Text style={[styles.resourceValue, { color: wearColor }]}>{game.wearLevel.toFixed(1)}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${game.wearLevel}%`, backgroundColor: wearColor }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Build panel ── */}
        <View style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>BUILD & EXPAND</Text>
          <View style={styles.buildList}>
            {BUILDING_CONFIG_ORDER.map(cfg => {
              const cost = getBuildingCost(cfg.type);
              const count = getBuildingCount(cfg.type);
              return (
                <BuildCard
                  key={cfg.type}
                  label={cfg.label}
                  icon={cfg.icon}
                  color={cfg.color}
                  stat={cfg.stat}
                  count={count}
                  cost={cost}
                  canAfford={game.cash >= cost}
                  onBuy={() => handleBuy(cfg.type)}
                  onView={() => setSelectedBuilding(cfg.type)}
                />
              );
            })}
          </View>
        </View>

        {/* ── District summary ── */}
        <View style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>DISTRICT SUMMARY</Text>
          <View style={styles.summaryCard}>
            {[
              { label: 'Mining Rigs', value: `${game.miningRigs}`, color: Colors.accentAmber },
              { label: 'Hash Rate', value: fmtHash(hashRate), color: Colors.accentAmber },
              { label: 'Power Plants', value: `${game.powerPlants - 2}`, color: Colors.accent },
              { label: 'Cooling Hubs', value: `${game.coolingHubs - 2}`, color: Colors.accentGreen },
              { label: 'Maintenance Bays', value: `${game.maintenanceBays}`, color: Colors.accentPurple },
              { label: 'Prestige Fork', value: game.prestigeLevel > 0 ? `Level ${game.prestigeLevel}` : 'None', color: Colors.accentAmber },
            ].map(row => (
              <View key={row.label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={[styles.summaryValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Building detail sheet */}
      <BuildingDetailSheet
        buildingType={selectedBuilding as any}
        onClose={() => setSelectedBuilding(null)}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    marginBottom: 12,
  },
  headerLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  netWorth: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  cashSub: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  regimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  regimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  regimeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  incomeLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sectionGap: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  sectionHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  resourceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  resourceItem: {
    gap: 5,
  },
  resourceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resourceValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  barTrack: {
    height: 4,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  buildList: {
    gap: 8,
  },
  buildCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buildCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  buildIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  buildCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  buildCountText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: '#000',
  },
  buildCardInfo: {
    flex: 1,
  },
  buildCardLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  buildCardStat: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  buildBuyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderLeftWidth: 1,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buildBuyText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
});
