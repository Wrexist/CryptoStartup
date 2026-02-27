import React, { useEffect, useRef, createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export type ToastType = 'milestone' | 'warning' | 'regime' | 'achievement';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  icon?: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, icon?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function SingleToast({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-30);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      withDelay(2500, withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }))
    );
    translateY.value = withSequence(
      withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.2)) }),
      withDelay(2500, withTiming(-30, { duration: 400 }))
    );
    const timer = setTimeout(() => {
      runOnJS(onDone)();
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const COLORS: Record<ToastType, string> = {
    milestone: Colors.accentGreen,
    warning: Colors.accentRed,
    regime: Colors.accentAmber,
    achievement: Colors.accentPurple,
  };

  const ICONS: Record<ToastType, string> = {
    milestone: 'trending-up',
    warning: 'alert-circle',
    regime: 'pulse',
    achievement: 'star',
  };

  const color = COLORS[toast.type];
  const icon = toast.icon ?? ICONS[toast.type];

  return (
    <Animated.View style={[styles.toast, { borderColor: color + '55', backgroundColor: Colors.surface }, style]}>
      <View style={[styles.toastIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  let counter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'milestone', icon?: string) => {
    const id = `toast_${++counter.current}`;
    setToasts(prev => [...prev.slice(-2), { id, message, type, icon }]);
    if (Platform.OS !== 'web') {
      if (type === 'milestone' || type === 'achievement') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: topInset + 8 }]} pointerEvents="none">
        {toasts.map(t => (
          <SingleToast key={t.id} toast={t} onDone={() => removeToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 6,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textPrimary,
  },
});
