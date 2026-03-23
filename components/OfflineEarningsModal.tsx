import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { fmt } from '@/lib/format';

interface OfflineEarningsModalProps {
  visible: boolean;
  earnings: number;
  onCollect: () => void;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function OfflineEarningsModal({ visible, earnings, onCollect }: OfflineEarningsModalProps) {
  const handleCollect = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCollect();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="moon" size={32} color={Colors.accentPurple} />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Your rigs kept mining while you were away</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Earning Rate</Text>
            <Text style={styles.value}>50% of online</Text>
          </View>

          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Earnings</Text>
            <Text style={styles.earningsValue}>{fmt(earnings)}</Text>
          </View>

          <Pressable style={styles.button} onPress={handleCollect}>
            <Ionicons name="wallet" size={18} color={Colors.background} />
            <Text style={styles.buttonText}>Collect {fmt(earnings)}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentPurple + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  value: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingTop: 4,
  },
  earningsLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  earningsValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: Colors.accentGreen,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentGreen,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: Colors.background,
  },
});
