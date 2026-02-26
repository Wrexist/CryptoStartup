import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { useGame } from '@/contexts/GameContext';
import { useMarket } from '@/contexts/MarketContext';
import Colors from '@/constants/colors';

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtTime(ms: number): string {
  const totalSeconds = Math.floor((Date.now() - ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const REGIME_COLORS: Record<string, string> = {
  calm: Colors.accentGreen,
  trending: Colors.accent,
  mania: Colors.accentAmber,
  crash: Colors.accentRed,
  recovery: Colors.accentPurple,
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { game, netWorth, canPrestige, prestigeRequirement, performPrestige, totalEarned } = useGame();
  const { market } = useMarket();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const regimeColor = REGIME_COLORS[market.regime] ?? Colors.accent;
  const prestigeProgress = Math.min(1, game.totalEarned / prestigeRequirement);

  const handlePrestige = () => {
    if (!canPrestige) return;
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Perform Fork?',
        `This will reset your infrastructure and cash, but grant a permanent +25% income multiplier and grow your district.\n\nYou will keep: Research unlocks, Prestige bonuses\nYou will lose: All buildings, Cash, Bot unlocks`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Fork District',
            style: 'destructive',
            onPress: () => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              performPrestige();
            },
          },
        ]
      );
    } else {
      performPrestige();
    }
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Reset Game?',
        'This permanently deletes all progress. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Everything',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.removeItem('@chain_district_save');
              await reloadAppAsync();
            },
          },
        ]
      );
    } else {
      AsyncStorage.removeItem('@chain_district_save').then(() => reloadAppAsync());
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>COMMAND CENTER</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Prestige / Fork */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DISTRICT FORK</Text>
        <View style={[styles.prestigeCard, canPrestige && { borderColor: Colors.accentAmber + '55' }]}>
          <View style={styles.prestigeHeader}>
            <MaterialCommunityIcons
              name="source-fork"
              size={28}
              color={canPrestige ? Colors.accentAmber : Colors.textMuted}
            />
            <View style={styles.prestigeHeaderText}>
              <Text style={[styles.prestigeTitle, canPrestige && { color: Colors.accentAmber }]}>
                Fork District {game.prestigeLevel > 0 ? `· Level ${game.prestigeLevel}` : ''}
              </Text>
              <Text style={styles.prestigeSubtitle}>
                {canPrestige ? 'Ready to fork — permanent +25% bonus awaits' : 'Reset progress for permanent multipliers'}
              </Text>
            </View>
          </View>

          <View style={styles.prestigeProgress}>
            <View style={styles.prestigeProgressLabel}>
              <Text style={styles.prestigeProgressText}>Progress to Fork</Text>
              <Text style={[styles.prestigeProgressValue, { color: canPrestige ? Colors.accentAmber : Colors.textSecondary }]}>
                {fmt(game.totalEarned)} / {fmt(prestigeRequirement)}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${prestigeProgress * 100}%`,
                    backgroundColor: canPrestige ? Colors.accentAmber : Colors.accent,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.prestigeBenefits}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
              <Text style={styles.benefitText}>+25% permanent income multiplier</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
              <Text style={styles.benefitText}>Keep all research upgrades</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="close-circle" size={14} color={Colors.accentRed} />
              <Text style={styles.benefitText}>Reset buildings, cash, bots</Text>
            </View>
          </View>

          <Pressable
            onPress={handlePrestige}
            style={[
              styles.prestigeBtn,
              {
                backgroundColor: canPrestige ? Colors.accentAmber + '22' : Colors.surfaceHigh,
                borderColor: canPrestige ? Colors.accentAmber + '55' : Colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="source-fork"
              size={16}
              color={canPrestige ? Colors.accentAmber : Colors.textMuted}
            />
            <Text style={[styles.prestigeBtnText, { color: canPrestige ? Colors.accentAmber : Colors.textMuted }]}>
              {canPrestige ? 'Fork District Now' : 'Not Yet Available'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Game Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GAME STATISTICS</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Session Duration</Text>
            <Text style={styles.statValue}>{fmtTime(game.gameStartTime)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Net Worth</Text>
            <Text style={[styles.statValue, { color: Colors.accentGreen }]}>{fmt(netWorth)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={[styles.statValue, { color: Colors.accentGreen }]}>{fmt(game.totalEarned)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Mining Rigs</Text>
            <Text style={styles.statValue}>{game.miningRigs}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Research Unlocked</Text>
            <Text style={[styles.statValue, { color: Colors.accentPurple }]}>{game.researchUnlocked.length} nodes</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Prestige Level</Text>
            <Text style={[styles.statValue, { color: Colors.accentAmber }]}>
              {game.prestigeLevel > 0 ? `Fork ${game.prestigeLevel} (+${game.prestigeLevel * 25}%)` : 'None'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Market Regime</Text>
            <View style={[styles.regimeBadge, { backgroundColor: regimeColor + '22' }]}>
              <View style={[styles.regimeDot, { backgroundColor: regimeColor }]} />
              <Text style={[styles.regimeBadgeText, { color: regimeColor }]}>{market.regimeLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.aboutCard}>
          <MaterialCommunityIcons name="city-variant" size={36} color={Colors.accent} />
          <Text style={styles.aboutTitle}>Chain District</Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
          <Text style={styles.aboutDesc}>
            A premium crypto infrastructure tycoon. Build your district, master the market, architect your empire.
          </Text>
        </View>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DANGER ZONE</Text>
        <Pressable onPress={handleReset} style={styles.resetBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.accentRed} />
          <Text style={styles.resetBtnText}>Reset All Progress</Text>
        </Pressable>
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
    marginBottom: 20,
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
  prestigeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  prestigeHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  prestigeHeaderText: {
    flex: 1,
    gap: 3,
  },
  prestigeTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  prestigeSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  prestigeProgress: {
    gap: 6,
  },
  prestigeProgressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prestigeProgressText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  prestigeProgressValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  prestigeBenefits: {
    gap: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  benefitText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  prestigeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  prestigeBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  regimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  regimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  regimeBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  aboutTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  aboutVersion: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  aboutDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accentRedDim,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.accentRed + '44',
  },
  resetBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: Colors.accentRed,
  },
});
