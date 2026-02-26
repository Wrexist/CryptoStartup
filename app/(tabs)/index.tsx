import React, { useCallback, useRef } from 'react';
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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { useMarket } from '@/contexts/MarketContext';
import Colors from '@/constants/colors';

function fmt(n: number): string {
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

interface ResourceBarProps {
  label: string;
  used: number;
  capacity: number;
  unit: string;
  color: string;
}

function ResourceBar({ label, used, capacity, unit, color }: ResourceBarProps) {
  const ratio = capacity > 0 ? Math.min(1, used / capacity) : 0;
  const barColor = ratio > 0.9 ? Colors.accentRed : ratio > 0.7 ? Colors.accentAmber : color;

  return (
    <View style={styles.resourceRow}>
      <View style={styles.resourceLabelRow}>
        <Text style={styles.resourceLabel}>{label}</Text>
        <Text style={[styles.resourceValue, { color: barColor }]}>
          {used.toFixed(0)}/{capacity.toFixed(0)} {unit}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

interface BuildingCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  cost: number;
  canAfford: boolean;
  onBuy: () => void;
  accentColor?: string;
}

function BuildingCard({ icon, title, subtitle, count, cost, canAfford, onBuy, accentColor = Colors.accent }: BuildingCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!canAfford) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBuy();
  };

  return (
    <Animated.View style={[styles.buildingCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.buildingIconWrap, { backgroundColor: accentColor + '22' }]}>
        {icon}
      </View>
      {count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
      <Text style={styles.buildingTitle}>{title}</Text>
      <Text style={styles.buildingSubtitle}>{subtitle}</Text>
      <Pressable
        onPress={handlePress}
        style={[
          styles.buyBtn,
          {
            backgroundColor: canAfford ? accentColor + '22' : Colors.surfaceHigh,
            borderColor: canAfford ? accentColor + '55' : Colors.border,
          },
        ]}
      >
        <Text style={[styles.buyBtnText, { color: canAfford ? accentColor : Colors.textMuted }]}>
          {fmt(cost)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function DistrictScreen() {
  const insets = useSafeAreaInsets();
  const { game, powerCapacity, powerUsed, coolingCapacity, coolingUsed, hashRate, uptime, incomePerTick, netWorth, buyBuilding, getBuildingCost } = useGame();
  const { market } = useMarket();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const regimeColor = REGIME_COLORS[market.regime] ?? Colors.accent;

  const handleBuy = useCallback((type: Parameters<typeof buyBuilding>[0]) => {
    buyBuilding(type);
  }, [buyBuilding]);

  const wearColor = game.wearLevel > 70 ? Colors.accentRed : game.wearLevel > 40 ? Colors.accentAmber : Colors.accentGreen;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>NET WORTH</Text>
          <Text style={styles.netWorth}>{fmt(netWorth)}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.regimeBadge, { backgroundColor: regimeColor + '22', borderColor: regimeColor + '55' }]}>
            <View style={[styles.regimeDot, { backgroundColor: regimeColor }]} />
            <Text style={[styles.regimeText, { color: regimeColor }]}>{market.regimeLabel}</Text>
          </View>
          <Text style={styles.cashLabel}>{fmt(game.cash)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Ionicons name="flash" size={12} color={Colors.accentAmber} />
          <Text style={styles.statPillText}>{fmtHash(hashRate)}</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="trending-up" size={12} color={Colors.accentGreen} />
          <Text style={styles.statPillText}>{fmt(incomePerTick)}/tick</Text>
        </View>
        <View style={styles.statPill}>
          <Feather name="cpu" size={12} color={Colors.accent} />
          <Text style={styles.statPillText}>{(uptime * 100).toFixed(0)}% uptime</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFRASTRUCTURE STATUS</Text>
        <View style={styles.resourceCard}>
          <ResourceBar label="Power" used={powerUsed} capacity={powerCapacity} unit="GW" color={Colors.accentAmber} />
          <ResourceBar label="Cooling" used={coolingUsed} capacity={coolingCapacity} unit="TU" color={Colors.accent} />
          <View style={styles.resourceRow}>
            <View style={styles.resourceLabelRow}>
              <Text style={styles.resourceLabel}>Wear Level</Text>
              <Text style={[styles.resourceValue, { color: wearColor }]}>
                {game.wearLevel.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${game.wearLevel}%`, backgroundColor: wearColor }]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BUILD DISTRICT</Text>
        <View style={styles.buildGrid}>
          <BuildingCard
            icon={<MaterialCommunityIcons name="server" size={28} color={Colors.accentAmber} />}
            title="Mining Rig"
            subtitle="+10 GH/s, 10 GW, 8 TU"
            count={game.miningRigs}
            cost={getBuildingCost('miningRig')}
            canAfford={game.cash >= getBuildingCost('miningRig')}
            onBuy={() => handleBuy('miningRig')}
            accentColor={Colors.accentAmber}
          />
          <BuildingCard
            icon={<MaterialCommunityIcons name="lightning-bolt" size={28} color={Colors.accent} />}
            title="Power Plant"
            subtitle="+50 GW capacity"
            count={game.powerPlants - 2}
            cost={getBuildingCost('powerPlant')}
            canAfford={game.cash >= getBuildingCost('powerPlant')}
            onBuy={() => handleBuy('powerPlant')}
            accentColor={Colors.accent}
          />
          <BuildingCard
            icon={<MaterialCommunityIcons name="snowflake" size={28} color={Colors.accentGreen} />}
            title="Cooling Hub"
            subtitle="+40 TU capacity"
            count={game.coolingHubs - 2}
            cost={getBuildingCost('coolingHub')}
            canAfford={game.cash >= getBuildingCost('coolingHub')}
            onBuy={() => handleBuy('coolingHub')}
            accentColor={Colors.accentGreen}
          />
          <BuildingCard
            icon={<MaterialCommunityIcons name="wrench" size={28} color={Colors.accentPurple} />}
            title="Maintenance Bay"
            subtitle="-0.2% wear/tick"
            count={game.maintenanceBays}
            cost={getBuildingCost('maintenanceBay')}
            canAfford={game.cash >= getBuildingCost('maintenanceBay')}
            onBuy={() => handleBuy('maintenanceBay')}
            accentColor={Colors.accentPurple}
          />
          <BuildingCard
            icon={<MaterialCommunityIcons name="shield-lock" size={28} color={Colors.accentRed} />}
            title="Security Office"
            subtitle="Reduces incident risk"
            count={game.securityOffices}
            cost={getBuildingCost('securityOffice')}
            canAfford={game.cash >= getBuildingCost('securityOffice')}
            onBuy={() => handleBuy('securityOffice')}
            accentColor={Colors.accentRed}
          />
          <View style={styles.buildingCardPlaceholder}>
            <MaterialCommunityIcons name="office-building" size={28} color={Colors.textMuted} />
            <Text style={styles.lockedText}>Exchange Tower</Text>
            <Text style={styles.lockedSub}>Prestige 2</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DISTRICT SUMMARY</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mining Rigs</Text>
            <Text style={styles.summaryValue}>{game.miningRigs}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hash Rate</Text>
            <Text style={[styles.summaryValue, { color: Colors.accentAmber }]}>{fmtHash(hashRate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Insight (Research)</Text>
            <Text style={[styles.summaryValue, { color: Colors.accentPurple }]}>{game.insight.toFixed(1)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Prestige Level</Text>
            <Text style={[styles.summaryValue, { color: Colors.accentGreen }]}>
              {game.prestigeLevel > 0 ? `Fork ${game.prestigeLevel}` : 'None'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingTop: 8,
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
    fontSize: 34,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
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
  cashLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: Colors.accentGreen,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statPillText: {
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
  resourceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  resourceRow: {
    gap: 6,
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
  buildGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  buildingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '48%',
    position: 'relative',
  },
  buildingIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#000',
  },
  buildingTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  buildingSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  buyBtn: {
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
  },
  buyBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  buildingCardPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '48%',
    alignItems: 'flex-start',
    opacity: 0.4,
  },
  lockedText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 10,
    marginBottom: 2,
  },
  lockedSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
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
    color: Colors.textPrimary,
  },
});
