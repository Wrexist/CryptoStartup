import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import React from 'react';
import Colors from '@/constants/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} />
        <Label>District</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="market">
        <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
        <Label>Market</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="portfolio">
        <Icon sf={{ default: 'briefcase', selected: 'briefcase.fill' }} />
        <Label>Portfolio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="research">
        <Icon sf={{ default: 'atom', selected: 'atom' }} />
        <Label>Research</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : Colors.surface,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'District',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="city-variant-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color }) => <Ionicons name="briefcase-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: 'Research',
          tabBarIcon: ({ color }) => <Ionicons name="flask-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
