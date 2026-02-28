import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '@/contexts/GameContext';
import { ACHIEVEMENTS, computeAchievementBonuses } from '@/constants/achievements';
import Colors from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AchievementsGallery({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { game } = useGame();
  const earned = game.achievements;
  const cardWidth = (screenWidth - 32 - 16) / 3; // 16px padding each side, 8px gap × 2

  const bonuses = useMemo(() => computeAchievementBonuses(earned), [earned]);
  const earnedCount = earned.length;
  const totalCount = ACHIEVEMENTS.length;

  const activeBonuses = useMemo(() => {
    const list: { label: string; value: string; color: string }[] = [];
    if (bonuses.incomePct > 0) list.push({ label: 'Income', value: `+${bonuses.incomePct}%`, color: Colors.accentGreen });
    if (bonuses.hashPct > 0) list.push({ label: 'Hash', value: `+${bonuses.hashPct}%`, color: Colors.accentAmber });
    if (bonuses.botIncomePct > 0) list.push({ label: 'Bot', value: `+${bonuses.botIncomePct}%`, color: Colors.accent });
    if (bonuses.insightPct > 0) list.push({ label: 'Insight', value: `+${bonuses.insightPct}%`, color: Colors.accentPurple });
    if (bonuses.crashIncomePct > 0) list.push({ label: 'Crash', value: `+${bonuses.crashIncomePct}%`, color: Colors.accentRed });
    if (bonuses.maniaIncomePct > 0) list.push({ label: 'Mania', value: `+${bonuses.maniaIncomePct}%`, color: Colors.accentGreen });
    if (bonuses.wearPct > 0) list.push({ label: 'Uptime', value: `+${bonuses.wearPct}%`, color: Colors.accentPurple });
    return list;
  }, [bonuses]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Achievements</Text>
            <Text style={styles.headerSub}>{earnedCount} / {totalCount} unlocked</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(earnedCount / totalCount) * 100}%` }]} />
        </View>

        {/* Bonus summary */}
        {activeBonuses.length > 0 && (
          <View style={styles.bonusRow}>
            {activeBonuses.map((b, i) => (
              <View key={i} style={[styles.bonusPill, { borderColor: b.color + '44' }]}>
                <Text style={[styles.bonusValue, { color: b.color }]}>{b.value}</Text>
                <Text style={styles.bonusLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Achievement grid */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {ACHIEVEMENTS.map(def => {
            const isEarned = earned.includes(def.id);
            const isHidden = def.hidden && !isEarned;

            return (
              <View
                key={def.id}
                style={[
                  styles.card,
                  { width: cardWidth },
                  isEarned
                    ? { borderColor: def.color + '55', backgroundColor: def.color + '0D' }
                    : { borderColor: Colors.border, backgroundColor: Colors.surface },
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.cardIcon,
                    {
                      backgroundColor: isEarned ? def.color + '22' : Colors.surfaceHigh,
                    },
                  ]}
                >
                  {isHidden ? (
                    <Text style={styles.hiddenText}>?</Text>
                  ) : (
                    <Ionicons
                      name={def.icon as any}
                      size={22}
                      color={isEarned ? def.color : Colors.textMuted}
                    />
                  )}
                </View>

                {/* Title */}
                <Text
                  style={[styles.cardTitle, { color: isEarned ? Colors.textPrimary : Colors.textMuted }]}
                  numberOfLines={1}
                >
                  {isHidden ? '???' : def.title}
                </Text>

                {/* Description */}
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {isHidden ? 'Hidden achievement' : def.description}
                </Text>

                {/* Bonus tag */}
                {!isHidden && (
                  <View
                    style={[
                      styles.cardBonus,
                      {
                        backgroundColor: isEarned ? def.color + '22' : Colors.surfaceHigh,
                        borderColor: isEarned ? def.color + '44' : Colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.cardBonusText, { color: isEarned ? def.color : Colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {def.bonusDescription}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const CARD_GAP = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 2,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.accentGreen,
    borderRadius: 2,
  },
  bonusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bonusPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bonusValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  bonusLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: CARD_GAP,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    minHeight: 140,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  hiddenText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: Colors.textMuted,
  },
  cardTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
  cardDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 12,
  },
  cardBonus: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 'auto' as any,
  },
  cardBonusText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9,
    textAlign: 'center',
  },
});
