import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame, GameEventInstance } from '@/contexts/GameContext';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventModalProps {
  event: GameEventInstance | null;
}

export function EventModal({ event }: EventModalProps) {
  const { resolveEvent, game } = useGame();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (event) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        tension: 50,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [event]);

  if (!event) return null;

  const handleChoice = (index: number) => {
    const choice = event.choices[index];
    if (choice.costCash && game.cash < choice.costCash) return;
    if (choice.costInsight && game.insight < choice.costInsight) return;
    
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      resolveEvent(event.instanceId, index);
    });
  };

  const getIcon = (name: string) => {
    if (name.includes(':')) {
      const [set, iconName] = name.split(':');
      if (set === 'MaterialCommunityIcons') {
        return <MaterialCommunityIcons name={iconName as any} size={32} color={event.color || Colors.accent} />;
      }
    }
    return <Ionicons name={name as any} size={32} color={event.color || Colors.accent} />;
  };

  return (
    <Modal transparent visible={!!event} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: (event.color || Colors.accent) + '20' }]}>
                {getIcon(event.icon)}
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.typeLabel}>{event.type.toUpperCase().replace('_', ' ')}</Text>
                <Text style={styles.title}>{event.title}</Text>
              </View>
            </View>

            <Text style={styles.description}>{event.description}</Text>

            <View style={styles.choicesContainer}>
              {event.choices.map((choice, index) => {
                const canAfford = (!choice.costCash || game.cash >= choice.costCash) && 
                                  (!choice.costInsight || game.insight >= choice.costInsight);
                
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.choiceButton,
                      !canAfford && styles.choiceDisabled,
                      choice.recommended && styles.choiceRecommended
                    ]}
                    onPress={() => handleChoice(index)}
                  >
                    <View style={styles.choiceHeader}>
                      <Text style={[styles.choiceLabel, !canAfford && styles.textDisabled]}>
                        {choice.label}
                      </Text>
                      {choice.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>RECOMMENDED</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.choiceEffect, !canAfford && styles.textDisabled]}>
                      {choice.effectDescription}
                    </Text>

                    {(choice.costCash || choice.costInsight) && (
                      <View style={styles.costContainer}>
                        {choice.costCash ? (
                          <Text style={[styles.costText, game.cash < choice.costCash ? styles.costError : styles.costSuccess]}>
                            Cost: ${choice.costCash.toLocaleString()}
                          </Text>
                        ) : null}
                        {choice.costInsight ? (
                          <Text style={[styles.costText, game.insight < choice.costInsight ? styles.costError : styles.costSuccess]}>
                            Cost: {choice.costInsight} Insight
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  typeLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceDisabled: {
    opacity: 0.5,
  },
  choiceRecommended: {
    borderColor: Colors.accentGreen,
    backgroundColor: Colors.accentGreen + '10',
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  choiceLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    color: Colors.background,
  },
  choiceEffect: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  costContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  costText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  costError: {
    color: Colors.accentRed,
  },
  costSuccess: {
    color: Colors.accentGreen,
  },
  textDisabled: {
    color: Colors.textMuted,
  }
});
