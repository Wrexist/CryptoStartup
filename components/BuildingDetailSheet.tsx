import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Rect,
  Circle,
  Line,
  G,
  Polygon,
  Ellipse,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { RIG_TIERS } from '@/constants/rigTiers';
import Colors from '@/constants/colors';

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Mining Rig Interior SVG ─────────────────────────────────────────────────
function MiningRigInterior({ count, wearLevel }: { count: number; wearLevel: number }) {
  const ledColor = wearLevel > 70 ? Colors.accentRed : wearLevel > 40 ? Colors.accentAmber : Colors.accentGreen;
  const rows = Math.min(count, 6);
  const W = 300;
  const H = 180;
  const rackW = 220;
  const rackH = 160;
  const rackX = (W - rackW) / 2;
  const rackY = (H - rackH) / 2;
  const unitH = rackH / Math.max(rows, 1);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="rackGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1A2232" />
          <Stop offset="100%" stopColor="#0D1420" />
        </LinearGradient>
        <LinearGradient id="unitGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1E2A3A" />
          <Stop offset="100%" stopColor="#111C28" />
        </LinearGradient>
      </Defs>

      {/* Rack chassis */}
      <Rect x={rackX} y={rackY} width={rackW} height={rackH} rx={4} fill="url(#rackGrad)" stroke="#2A3A50" strokeWidth={1.5} />

      {/* Rack units */}
      {Array.from({ length: Math.max(rows, 1) }).map((_, i) => {
        const uy = rackY + i * unitH + 2;
        const uh = unitH - 4;
        const hasUnit = i < count;
        return (
          <G key={i}>
            <Rect
              x={rackX + 8}
              y={uy}
              width={rackW - 16}
              height={uh}
              rx={2}
              fill={hasUnit ? 'url(#unitGrad)' : '#0A0F18'}
              stroke={hasUnit ? '#2A3A50' : '#141C28'}
              strokeWidth={0.8}
            />
            {hasUnit && (
              <>
                {/* Front plate vent lines */}
                {[0, 1, 2].map(v => (
                  <Line
                    key={v}
                    x1={rackX + 16}
                    y1={uy + uh * 0.3 + v * (uh * 0.15)}
                    x2={rackX + rackW * 0.55}
                    y2={uy + uh * 0.3 + v * (uh * 0.15)}
                    stroke="#1A2A3A"
                    strokeWidth={0.8}
                  />
                ))}
                {/* Status LEDs */}
                <Circle cx={rackX + rackW - 20} cy={uy + uh / 2 - 4} r={2.5} fill={ledColor} fillOpacity={0.9} />
                <Circle cx={rackX + rackW - 12} cy={uy + uh / 2 - 4} r={2.5} fill={Colors.accent} fillOpacity={0.7} />
                {/* Activity LED */}
                <Circle cx={rackX + rackW - 20} cy={uy + uh / 2 + 4} r={2} fill={Colors.accentAmber} fillOpacity={0.6} />
              </>
            )}
          </G>
        );
      })}

      {/* Rack side rails */}
      <Rect x={rackX + 2} y={rackY} width={6} height={rackH} rx={2} fill="#0E1828" stroke="#1E2A3A" strokeWidth={0.5} />
      <Rect x={rackX + rackW - 8} y={rackY} width={6} height={rackH} rx={2} fill="#0E1828" stroke="#1E2A3A" strokeWidth={0.5} />

      {/* Cable bundle on left */}
      {[0, 1, 2, 3].map(i => (
        <Line
          key={i}
          x1={rackX - 10}
          y1={rackY + 20 + i * 12}
          x2={rackX + 2}
          y2={rackY + 20 + i * 12}
          stroke={i % 2 === 0 ? '#2A5580' : '#3A3A60'}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      ))}

      {/* Top fan grill */}
      <Rect x={rackX + 20} y={rackY - 10} width={rackW - 40} height={10} rx={2} fill="#0E1828" stroke="#1E2A3A" strokeWidth={0.5} />
      {[0, 1, 2, 3, 4].map(i => (
        <Line
          key={i}
          x1={rackX + 28 + i * 36}
          y1={rackY - 8}
          x2={rackX + 28 + i * 36}
          y2={rackY - 2}
          stroke="#1A2A3A"
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
}

// ─── Power Plant Interior SVG ─────────────────────────────────────────────────
function PowerPlantInterior({ powerUsed, powerCapacity }: { powerUsed: number; powerCapacity: number }) {
  const loadRatio = powerCapacity > 0 ? Math.min(1, powerUsed / powerCapacity) : 0;
  const loadColor = loadRatio > 0.9 ? Colors.accentRed : loadRatio > 0.7 ? Colors.accentAmber : Colors.accentGreen;
  const W = 300;
  const H = 180;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="xfrmGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1A2840" />
          <Stop offset="100%" stopColor="#0A1828" />
        </LinearGradient>
      </Defs>

      {/* Background panel */}
      <Rect x={10} y={10} width={280} height={160} rx={6} fill="#0D1420" stroke="#1E2A44" strokeWidth={1} />

      {/* Two transformer cylinders */}
      {[0, 1].map(i => {
        const cx = 80 + i * 110;
        return (
          <G key={i}>
            <Rect x={cx - 28} y={30} width={56} height={100} rx={6} fill="url(#xfrmGrad)" stroke="#2A3A5A" strokeWidth={1.5} />
            <Ellipse cx={cx} cy={30} rx={28} ry={12} fill="#1E3050" stroke="#2A4060" strokeWidth={1} />
            <Ellipse cx={cx} cy={130} rx={28} ry={12} fill="#142040" stroke="#2A3A5A" strokeWidth={0.8} />
            {/* Coil lines */}
            {[0, 1, 2, 3, 4].map(j => (
              <Ellipse
                key={j}
                cx={cx}
                cy={50 + j * 16}
                rx={24}
                ry={5}
                fill="none"
                stroke="#2A4060"
                strokeWidth={0.8}
              />
            ))}
            {/* Status light */}
            <Circle cx={cx} cy={145} r={5} fill={Colors.accent} fillOpacity={0.8} />
          </G>
        );
      })}

      {/* Load meter on right */}
      <Rect x={230} y={30} width={50} height={110} rx={4} fill="#0A0F18" stroke="#1E2A44" strokeWidth={1} />
      <Rect x={234} y={34} width={42} height={98} rx={2} fill="#0D1520" />
      {/* Load bar */}
      <Rect
        x={238}
        y={34 + (1 - loadRatio) * 98}
        width={34}
        height={loadRatio * 98}
        rx={2}
        fill={loadColor}
        fillOpacity={0.7}
      />
      {/* Load label */}
      <Rect x={232} y={148} width={46} height={12} rx={2} fill="#0A0F18" />
      <Circle cx={255} cy={154} r={3} fill={loadColor} />

      {/* Connecting bus bars */}
      <Line x1={108} y1={80} x2={162} y2={80} stroke={Colors.accent} strokeWidth={2} strokeOpacity={0.4} />
      <Line x1={190} y1={80} x2={230} y2={80} stroke={Colors.accent} strokeWidth={2} strokeOpacity={0.4} />
    </Svg>
  );
}

// ─── Cooling Hub Interior SVG ─────────────────────────────────────────────────
function CoolingHubInterior({ count }: { count: number }) {
  const W = 300;
  const H = 180;
  const numFans = Math.min(count + 1, 4);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="fanBG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#0E2020" />
          <Stop offset="100%" stopColor="#081818" />
        </LinearGradient>
      </Defs>

      <Rect x={10} y={10} width={280} height={160} rx={6} fill="url(#fanBG)" stroke="#1A3030" strokeWidth={1} />

      {/* Fan units */}
      {Array.from({ length: numFans }).map((_, i) => {
        const cx = 50 + i * 65;
        const cy = 90;
        const fanR = 45;
        return (
          <G key={i}>
            {/* Fan housing */}
            <Circle cx={cx} cy={cy} r={fanR} fill="#0C2020" stroke="#1A3A3A" strokeWidth={1.5} />
            {/* Fan blades - 6 blades */}
            {[0, 60, 120, 180, 240, 300].map(deg => {
              const rad = (deg * Math.PI) / 180;
              const r1 = 8;
              const r2 = fanR - 8;
              return (
                <Line
                  key={deg}
                  x1={(cx + Math.cos(rad) * r1).toFixed(1)}
                  y1={(cy + Math.sin(rad) * r1).toFixed(1)}
                  x2={(cx + Math.cos(rad + 0.4) * r2).toFixed(1)}
                  y2={(cy + Math.sin(rad + 0.4) * r2 * 0.55).toFixed(1)}
                  stroke={Colors.accentGreen}
                  strokeWidth={4}
                  strokeOpacity={0.5}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Center hub */}
            <Circle cx={cx} cy={cy} r={9} fill="#142A2A" stroke={Colors.accentGreen} strokeWidth={1} />
            <Circle cx={cx} cy={cy} r={4} fill={Colors.accentGreen} fillOpacity={0.7} />
            {/* Corner screws */}
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy], si) => (
              <Circle
                key={si}
                cx={cx + dx * (fanR - 6)}
                cy={cy + dy * (fanR - 6) * 0.55}
                r={2.5}
                fill="#0E2020"
                stroke="#1A3A3A"
                strokeWidth={0.8}
              />
            ))}
          </G>
        );
      })}

      {/* Coolant pipe at bottom */}
      <Rect x={20} y={148} width={260} height={8} rx={4} fill="#0C2020" stroke="#1A3A3A" strokeWidth={1} />
      <Rect x={20} y={150} width={260} height={4} rx={2} fill={Colors.accentGreen} fillOpacity={0.3} />
    </Svg>
  );
}

// ─── Maintenance Bay Interior SVG ──────────────────────────────────────────────
function MaintenanceBayInterior({ count }: { count: number }) {
  const W = 300;
  const H = 180;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={10} y={10} width={280} height={160} rx={6} fill="#0E1020" stroke="#1E1A38" strokeWidth={1} />
      {/* Workbench */}
      <Rect x={40} y={110} width={220} height={12} rx={3} fill="#1A1430" stroke="#2A1E4A" strokeWidth={1} />
      <Rect x={50} y={122} width={8} height={30} rx={2} fill="#141028" />
      <Rect x={240} y={122} width={8} height={30} rx={2} fill="#141028" />
      {/* Tools on bench */}
      <Rect x={65} y={95} width={4} height={16} rx={1} fill={Colors.accentAmber} fillOpacity={0.7} />
      <Rect x={80} y={92} width={6} height={18} rx={1} fill="#4A7ABA" fillOpacity={0.7} />
      <Circle cx={110} cy={104} r={6} fill="#2A3A50" stroke={Colors.accent} strokeWidth={1} />
      {/* Robotic arm */}
      <Line x1={180} y1={40} x2={180} y2={110} stroke="#2A2A50" strokeWidth={4} strokeLinecap="round" />
      <Line x1={180} y1={70} x2={215} y2={95} stroke="#2A2A50" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={180} cy={40} r={8} fill="#1A1A3A" stroke={Colors.accentPurple} strokeWidth={1} fillOpacity={0.8} />
      <Circle cx={215} cy={97} r={5} fill={Colors.accentPurple} fillOpacity={0.6} />
      {/* Status panel */}
      <Rect x={228} y={30} width={48} height={70} rx={4} fill="#0A0F1A" stroke="#1A1A38" strokeWidth={1} />
      {[0, 1, 2].map(i => (
        <Rect key={i} x={236} y={40 + i * 18} width={32} height={10} rx={2} fill={i === 0 ? Colors.accentGreenDim : '#101828'} stroke={Colors.border} strokeWidth={0.5} />
      ))}
      <Circle cx={252} cy={90} r={4} fill={Colors.accentPurple} fillOpacity={0.7} />
    </Svg>
  );
}

// ─── Security Office Interior SVG ───────────────────────────────────────────────
function SecurityOfficeInterior() {
  const W = 300;
  const H = 180;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={10} y={10} width={280} height={160} rx={6} fill="#0C0F1A" stroke="#1A1428" strokeWidth={1} />
      {/* Monitor wall 2x2 */}
      {[0, 1, 2, 3].map(i => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <G key={i}>
            <Rect x={40 + col * 110} y={30 + row * 70} width={95} height={55} rx={3} fill="#0A0C18" stroke="#1E1A38" strokeWidth={1} />
            <Rect x={45 + col * 110} y={35 + row * 70} width={85} height={45} rx={2} fill="#08080E" />
            {/* Monitor content - grid lines */}
            {[0, 1, 2].map(j => (
              <Line
                key={j}
                x1={50 + col * 110}
                y1={50 + row * 70 + j * 10}
                x2={125 + col * 110}
                y2={50 + row * 70 + j * 10}
                stroke={Colors.accentPurple}
                strokeWidth={0.5}
                strokeOpacity={0.3}
              />
            ))}
            {/* Camera feed indicator */}
            <Circle cx={55 + col * 110} cy={40 + row * 70} r={3} fill={Colors.accentGreen} fillOpacity={0.8} />
          </G>
        );
      })}
      {/* Control desk */}
      <Rect x={35} y={148} width={230} height={14} rx={3} fill="#121020" stroke="#1E1838" strokeWidth={1} />
      {/* Keyboard */}
      <Rect x={90} y={140} width={120} height={10} rx={2} fill="#0E0C1A" stroke="#1A1630" strokeWidth={0.8} />
      {/* Status lights */}
      {[0, 1, 2, 3].map(i => (
        <Circle
          key={i}
          cx={50 + i * 18}
          cy={152}
          r={3}
          fill={i === 0 ? Colors.accentRed : i === 1 ? Colors.accentAmber : Colors.accentGreen}
          fillOpacity={0.7}
        />
      ))}
    </Svg>
  );
}

// ─── Building config ──────────────────────────────────────────────────────────
const BUILDING_CONFIG = {
  miningRig: {
    label: 'Mining Rig',
    icon: 'server' as const,
    color: Colors.accentAmber,
    buyType: 'miningRig' as const,
    description: 'High-performance ASIC mining arrays generating hash units from raw compute power. More rigs = more hash.',
  },
  powerPlant: {
    label: 'Power Plant',
    icon: 'lightning-bolt' as const,
    color: Colors.accent,
    buyType: 'powerPlant' as const,
    description: 'Industrial transformers and power distribution units. Each plant adds 50 GW capacity for your operations.',
  },
  coolingHub: {
    label: 'Cooling Hub',
    icon: 'snowflake' as const,
    color: Colors.accentGreen,
    buyType: 'coolingHub' as const,
    description: 'Industrial-scale liquid cooling towers with massive fan arrays. Prevents thermal throttling on your mining fleet.',
  },
  maintenanceBay: {
    label: 'Maintenance Bay',
    icon: 'wrench' as const,
    color: Colors.accentPurple,
    buyType: 'maintenanceBay' as const,
    description: 'Robotic repair bays with automated technician drones. Reduces equipment wear rate significantly.',
  },
  securityOffice: {
    label: 'Security Office',
    icon: 'shield-lock' as const,
    color: Colors.accentRed,
    buyType: 'securityOffice' as const,
    description: 'Multi-monitor surveillance systems and anti-intrusion protocols. Reduces incident probability.',
  },
};

// ─── Main Sheet ─────────────────────────────────────────────────────────────
interface BuildingDetailSheetProps {
  buildingType: keyof typeof BUILDING_CONFIG | null;
  onClose: () => void;
}

export function BuildingDetailSheet({ buildingType, onClose }: BuildingDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { game, buyBuilding, getBuildingCost, powerUsed, powerCapacity, upgradeRig, getRigUpgradeCostFn } = useGame();

  const visible = buildingType !== null;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [visible]);

  if (!buildingType) return null;

  const config = BUILDING_CONFIG[buildingType];
  const cost = getBuildingCost(config.buyType);
  const canAfford = game.cash >= cost;

  const count =
    buildingType === 'miningRig' ? game.miningRigs :
    buildingType === 'powerPlant' ? game.powerPlants - 2 :
    buildingType === 'coolingHub' ? game.coolingHubs - 2 :
    buildingType === 'maintenanceBay' ? game.maintenanceBays :
    game.securityOffices;

  const handleBuy = () => {
    if (!canAfford) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buyBuilding(config.buyType);
  };

  const renderInterior = () => {
    switch (buildingType) {
      case 'miningRig':
        return <MiningRigInterior count={game.miningRigs} wearLevel={game.wearLevel} />;
      case 'powerPlant':
        return <PowerPlantInterior powerUsed={powerUsed} powerCapacity={powerCapacity} />;
      case 'coolingHub':
        return <CoolingHubInterior count={game.coolingHubs - 2} />;
      case 'maintenanceBay':
        return <MaintenanceBayInterior count={game.maintenanceBays} />;
      case 'securityOffice':
        return <SecurityOfficeInterior />;
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 16 }]}
        >
          <Pressable onPress={() => {}}>
            {/* Grab handle */}
            <View style={styles.grabHandle} />
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={[styles.buildingIconWrap, { backgroundColor: config.color + '22' }]}>
                <MaterialCommunityIcons name={config.icon} size={26} color={config.color} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={[styles.sheetTitle, { color: config.color }]}>{config.label}</Text>
                <Text style={styles.sheetCount}>{count} installed</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Interior view */}
            <View style={[styles.interiorContainer, { borderColor: config.color + '33' }]}>
              <View style={styles.interiorSvgWrap}>
                {renderInterior()}
              </View>
              <Text style={styles.interiorLabel}>
                {count > 0 ? `${count} unit${count !== 1 ? 's' : ''} installed` : 'No units installed'}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{config.description}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {buildingType === 'miningRig' && (
                <>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Hash Output</Text>
                    <Text style={[styles.statVal, { color: Colors.accentAmber }]}>
                      {game.rigTiers.reduce((sum, t) => sum + (RIG_TIERS[t]?.hash ?? 10), 0)} GH/s
                    </Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Wear Level</Text>
                    <Text style={[styles.statVal, { color: game.wearLevel > 60 ? Colors.accentRed : Colors.accentGreen }]}>
                      {game.wearLevel.toFixed(1)}%
                    </Text>
                  </View>
                </>
              )}
              {buildingType === 'powerPlant' && (
                <>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Total Capacity</Text>
                    <Text style={[styles.statVal, { color: Colors.accent }]}>{powerCapacity.toFixed(0)} GW</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Used</Text>
                    <Text style={[styles.statVal, { color: powerUsed > powerCapacity * 0.9 ? Colors.accentRed : Colors.accentGreen }]}>
                      {powerUsed.toFixed(0)} GW
                    </Text>
                  </View>
                </>
              )}
              {buildingType === 'coolingHub' && (
                <>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Cool Capacity</Text>
                    <Text style={[styles.statVal, { color: Colors.accentGreen }]}>{(game.coolingHubs * 40).toFixed(0)} TU</Text>
                  </View>
                </>
              )}
            </View>

            {/* Rig Upgrades — only for mining rigs with at least 1 rig */}
            {buildingType === 'miningRig' && game.miningRigs > 0 && (
              <View style={styles.upgradeSection}>
                <Text style={styles.upgradeSectionTitle}>HARDWARE UPGRADES</Text>
                {Array.from({ length: game.miningRigs }).map((_, slotIdx) => {
                  const currentTier = game.rigTiers[slotIdx] ?? 0;
                  const currentDef = RIG_TIERS[currentTier];
                  const nextTier = currentTier + 1;
                  const nextDef = RIG_TIERS[nextTier];
                  const isMaxTier = nextTier >= RIG_TIERS.length;
                  const upgCost = isMaxTier ? 0 : getRigUpgradeCostFn(slotIdx, nextTier);
                  const canUpgrade = !isMaxTier && game.cash >= upgCost && (nextDef?.prestigeReq ?? 0) <= game.prestigeLevel;
                  const prestigeLocked = !isMaxTier && nextDef && nextDef.prestigeReq > game.prestigeLevel;

                  return (
                    <View key={slotIdx} style={styles.upgradeRow}>
                      <View style={styles.upgradeSlotInfo}>
                        <Text style={styles.upgradeSlotLabel}>Slot {slotIdx + 1}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={[styles.upgradeTierBadge, { backgroundColor: currentDef.color + '22', borderColor: currentDef.color + '44' }]}>
                            <Text style={[styles.upgradeTierText, { color: currentDef.color }]}>{currentDef.shortName}</Text>
                          </View>
                          <Text style={styles.upgradeHashText}>{currentDef.hash} GH/s</Text>
                        </View>
                      </View>

                      {isMaxTier ? (
                        <View style={styles.upgradeMaxBadge}>
                          <Text style={styles.upgradeMaxText}>MAX</Text>
                        </View>
                      ) : prestigeLocked ? (
                        <View style={styles.upgradeLocked}>
                          <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
                          <Text style={styles.upgradeLockedText}>P{nextDef!.prestigeReq}</Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => {
                            if (!canUpgrade) return;
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            upgradeRig(slotIdx, nextTier);
                          }}
                          style={[
                            styles.upgradeBtn,
                            {
                              backgroundColor: canUpgrade ? nextDef!.color + '22' : Colors.surfaceHigh,
                              borderColor: canUpgrade ? nextDef!.color + '55' : Colors.border,
                            },
                          ]}
                        >
                          <Ionicons name="arrow-up" size={14} color={canUpgrade ? nextDef!.color : Colors.textMuted} />
                          <Text style={[styles.upgradeBtnText, { color: canUpgrade ? nextDef!.color : Colors.textMuted }]}>
                            {nextDef!.shortName} · {fmt(upgCost)}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                {/* Tier legend */}
                <View style={styles.upgradeLegend}>
                  {RIG_TIERS.map((t, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <View style={[styles.legendDot, { backgroundColor: t.color }]} />
                      <Text style={styles.legendText}>{t.shortName} ({t.hash} GH/s)</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Buy button */}
            <Pressable
              onPress={handleBuy}
              style={[
                styles.buyBtn,
                {
                  backgroundColor: canAfford ? config.color + '22' : Colors.surfaceHigh,
                  borderColor: canAfford ? config.color + '55' : Colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={18}
                color={canAfford ? config.color : Colors.textMuted}
              />
              <Text style={[styles.buyBtnText, { color: canAfford ? config.color : Colors.textMuted }]}>
                Build Another · {fmt(cost)}
              </Text>
            </Pressable>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  grabHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  buildingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
  },
  sheetCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interiorContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 10,
  },
  interiorSvgWrap: {
    alignItems: 'center',
  },
  interiorLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  statVal: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
  },
  buyBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  // ─── Rig Upgrade Styles ─────────────────────────────────────────────────────
  upgradeSection: {
    marginBottom: 14,
    gap: 6,
  },
  upgradeSectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  upgradeSlotInfo: {
    gap: 2,
  },
  upgradeSlotLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  upgradeTierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  upgradeTierText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  upgradeHashText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  upgradeMaxBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.accentGreenDim,
    borderWidth: 1,
    borderColor: Colors.accentGreen + '44',
  },
  upgradeMaxText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: Colors.accentGreen,
  },
  upgradeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upgradeLockedText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  upgradeBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  upgradeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
