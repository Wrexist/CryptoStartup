import React, { useState } from 'react';
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
import { useGame, ResearchBranch, ResearchNode } from '@/contexts/GameContext';
import Colors from '@/constants/colors';

const BRANCH_INFO: Record<ResearchBranch, { label: string; icon: string; color: string; desc: string }> = {
  infrastructure: {
    label: 'Infrastructure',
    icon: 'construct-outline',
    color: Colors.accentAmber,
    desc: 'Efficiency, heat reduction, failure mitigation',
  },
  trading: {
    label: 'Trading Intel',
    icon: 'trending-up',
    color: Colors.accent,
    desc: 'Bot improvements, slippage reduction',
  },
  risk: {
    label: 'Risk Architecture',
    icon: 'shield-half-outline',
    color: Colors.accentPurple,
    desc: 'Crash hedging, incident prediction',
  },
};

function ResearchNodeCard({ node, branchColor, insight, onUnlock }: {
  node: ResearchNode;
  branchColor: string;
  insight: number;
  onUnlock: (id: string, cost: number) => void;
}) {
  const canAfford = insight >= node.cost;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (node.unlocked || !canAfford) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUnlock(node.id, node.cost);
  };

  return (
    <Animated.View
      style={[
        styles.nodeCard,
        node.unlocked && { borderColor: branchColor + '44', backgroundColor: branchColor + '0A' },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.nodeLeft}>
        <View
          style={[
            styles.nodeStatus,
            {
              backgroundColor: node.unlocked
                ? branchColor + '33'
                : canAfford
                ? branchColor + '15'
                : Colors.surfaceHigh,
              borderColor: node.unlocked
                ? branchColor + '66'
                : canAfford
                ? branchColor + '33'
                : Colors.border,
            },
          ]}
        >
          {node.unlocked ? (
            <Ionicons name="checkmark" size={14} color={branchColor} />
          ) : (
            <Ionicons name="lock-closed" size={12} color={canAfford ? branchColor : Colors.textMuted} />
          )}
        </View>
        <View style={styles.nodeContent}>
          <Text style={[styles.nodeName, node.unlocked && { color: branchColor }]}>{node.name}</Text>
          <Text style={styles.nodeDesc}>{node.description}</Text>
        </View>
      </View>

      {!node.unlocked && (
        <Pressable onPress={handlePress} style={[
          styles.nodeUnlockBtn,
          {
            backgroundColor: canAfford ? branchColor + '22' : Colors.surfaceHigh,
            borderColor: canAfford ? branchColor + '55' : Colors.border,
          }
        ]}>
          <MaterialCommunityIcons name="flask" size={11} color={canAfford ? branchColor : Colors.textMuted} />
          <Text style={[styles.nodeUnlockText, { color: canAfford ? branchColor : Colors.textMuted }]}>
            {node.cost}
          </Text>
        </Pressable>
      )}
      {node.unlocked && (
        <View style={[styles.unlockedBadge, { backgroundColor: branchColor + '22' }]}>
          <Text style={[styles.unlockedBadgeText, { color: branchColor }]}>ACTIVE</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  const { game, researchNodes, unlockResearch } = useGame();
  const [activeBranch, setActiveBranch] = useState<ResearchBranch>('infrastructure');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const branchInfo = BRANCH_INFO[activeBranch];
  const nodes = researchNodes[activeBranch];
  const unlockedCount = nodes.filter(n => n.unlocked).length;

  const totalUnlocked = Object.values(researchNodes).flat().filter(n => n.unlocked).length;
  const totalNodes = Object.values(researchNodes).flat().length;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>RESEARCH LAB</Text>
        <Text style={styles.headerTitle}>R&D Center</Text>
        <View style={styles.insightRow}>
          <MaterialCommunityIcons name="flask" size={14} color={Colors.accentPurple} />
          <Text style={styles.insightValue}>{game.insight.toFixed(1)} Insight</Text>
          <Text style={styles.insightSub}>· {totalUnlocked}/{totalNodes} nodes unlocked</Text>
        </View>
      </View>

      <View style={styles.insightBar}>
        <Text style={styles.insightHint}>
          Insight is earned passively from mining rigs and active bots. Use it to unlock upgrades.
        </Text>
      </View>

      <View style={styles.branchTabs}>
        {(Object.entries(BRANCH_INFO) as [ResearchBranch, typeof branchInfo][]).map(([branch, info]) => {
          const isActive = branch === activeBranch;
          const branchNodes = researchNodes[branch];
          const branchUnlocked = branchNodes.filter(n => n.unlocked).length;
          return (
            <Pressable
              key={branch}
              onPress={() => setActiveBranch(branch)}
              style={[
                styles.branchTab,
                isActive && { backgroundColor: info.color + '22', borderColor: info.color + '55' },
              ]}
            >
              <Ionicons
                name={info.icon as any}
                size={16}
                color={isActive ? info.color : Colors.textMuted}
              />
              <Text style={[styles.branchTabLabel, { color: isActive ? info.color : Colors.textMuted }]}>
                {info.label}
              </Text>
              <View style={[styles.branchProgress, { backgroundColor: isActive ? info.color + '33' : Colors.surfaceHigh }]}>
                <Text style={[styles.branchProgressText, { color: isActive ? info.color : Colors.textMuted }]}>
                  {branchUnlocked}/{branchNodes.length}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={[styles.branchHeader, { borderLeftColor: branchInfo.color }]}>
          <Text style={[styles.branchTitle, { color: branchInfo.color }]}>{branchInfo.label} Mastery</Text>
          <Text style={styles.branchDesc}>{branchInfo.desc}</Text>
          <Text style={styles.branchProgress2}>{unlockedCount} of {nodes.length} unlocked</Text>
        </View>

        <View style={styles.nodeList}>
          {nodes.map((node, index) => {
            const isAvailable = !node.requires || game.researchUnlocked.includes(node.requires);
            const displayNode = isAvailable ? node : { ...node, name: `??? (requires prior unlock)`, description: 'Unlock previous research first' };
            return (
              <View key={node.id}>
                {index > 0 && (
                  <View style={[styles.nodeLine, { borderColor: branchInfo.color + '33' }]} />
                )}
                <ResearchNodeCard
                  node={isAvailable ? node : { ...node, name: index === 0 ? node.name : `Tier ${index + 1} Research`, description: 'Unlock previous node first' }}
                  branchColor={isAvailable ? branchInfo.color : Colors.textMuted}
                  insight={game.insight}
                  onUnlock={unlockResearch}
                />
              </View>
            );
          })}
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
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  insightValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.accentPurple,
  },
  insightSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  insightBar: {
    backgroundColor: Colors.accentPurpleDim,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accentPurple + '33',
    marginBottom: 16,
  },
  insightHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  branchTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  branchTab: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  branchTabLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    textAlign: 'center',
  },
  branchProgress: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  branchProgressText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
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
  branchHeader: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 14,
  },
  branchTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  branchDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  branchProgress2: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  nodeList: {
    gap: 0,
  },
  nodeLine: {
    width: 2,
    height: 12,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginLeft: 22,
  },
  nodeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nodeLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  nodeStatus: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeContent: {
    flex: 1,
    gap: 2,
  },
  nodeName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  nodeDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  nodeUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
  },
  nodeUnlockText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  unlockedBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  unlockedBadgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
