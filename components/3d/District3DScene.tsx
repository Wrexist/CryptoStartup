import React, { useMemo, Suspense, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, ActivityIndicator } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/contexts/GameContext';
import { useMarket } from '@/contexts/MarketContext';
import Colors from '@/constants/colors';
import { MiningRigModel } from './buildings/MiningRigModel';
import { PowerPlantModel } from './buildings/PowerPlantModel';
import { CoolingHubModel } from './buildings/CoolingHubModel';
import { MaintenanceBayModel } from './buildings/MaintenanceBayModel';
import { SecurityOfficeModel } from './buildings/SecurityOfficeModel';
import { GroundPlane } from './GroundPlane';
import { DistrictEnvironment } from './DistrictEnvironment';
import { DistrictLighting } from './DistrictLighting';
import { DistrictEffects } from './DistrictEffects';
import { DistrictParticles } from './DistrictParticles';
import { EmptySlotMarker } from './EmptySlotMarker';

// ─── Grid layout: 2D slot → 3D world position ──────────────────────────────
const GRID_SPACING = 1.8;

const MINING_SLOTS: [number, number][] = [
  [1, 2], [2, 2], [3, 2],
  [1, 3], [2, 3], [3, 3],
  [1, 4], [2, 4], [3, 4],
];
const POWER_SLOTS: [number, number][] = [[-1, 2], [-1, 3], [-1, 4]];
const COOL_SLOTS: [number, number][] = [[1, 0], [2, 0], [3, 0]];
const MAINT_SLOTS: [number, number][] = [[4, 2], [4, 3]];
const SEC_SLOTS: [number, number][] = [[4, 0], [4, 1]];

function gridToWorld(col: number, row: number): [number, number, number] {
  return [col * GRID_SPACING, 0, row * GRID_SPACING];
}

// ─── Inner 3D scene (rendered inside Canvas) ──────────────────────────────
interface SceneContentProps {
  onBuildingPress: (type: string) => void;
}

function SceneContent({ onBuildingPress }: SceneContentProps) {
  const { game, powerUsed, powerCapacity } = useGame();
  const { market } = useMarket();

  const overheated = game.wearLevel > 60 || (powerCapacity > 0 && powerUsed / powerCapacity > 0.9);

  const handleClick = useCallback((type: string) => () => {
    onBuildingPress(type);
  }, [onBuildingPress]);

  // Build list of rendered buildings
  const buildings = useMemo(() => {
    const items: React.ReactNode[] = [];

    // Mining Rigs
    MINING_SLOTS.forEach(([c, r], i) => {
      if (i < game.miningRigs) {
        const tier = game.rigTiers?.[i] ?? 0;
        items.push(
          <MiningRigModel
            key={`rig_${i}`}
            position={gridToWorld(c, r)}
            tier={tier}
            overheated={overheated}
            onClick={handleClick('miningRig')}
          />
        );
      } else {
        items.push(
          <EmptySlotMarker
            key={`empty_rig_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('miningRig')}
          />
        );
      }
    });

    // Power Plants (starts at 2 built-in, only extra ones show)
    POWER_SLOTS.forEach(([c, r], i) => {
      if (i < game.powerPlants - 2) {
        items.push(
          <PowerPlantModel
            key={`power_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('powerPlant')}
          />
        );
      } else if (i === 0) {
        items.push(
          <EmptySlotMarker
            key={`empty_power_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('powerPlant')}
          />
        );
      }
    });

    // Cooling Hubs (starts at 2 built-in)
    COOL_SLOTS.forEach(([c, r], i) => {
      if (i < game.coolingHubs - 2) {
        items.push(
          <CoolingHubModel
            key={`cool_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('coolingHub')}
          />
        );
      } else if (i === 0) {
        items.push(
          <EmptySlotMarker
            key={`empty_cool_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('coolingHub')}
          />
        );
      }
    });

    // Maintenance Bays
    MAINT_SLOTS.forEach(([c, r], i) => {
      if (i < game.maintenanceBays) {
        items.push(
          <MaintenanceBayModel
            key={`maint_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('maintenanceBay')}
          />
        );
      }
    });

    // Security Offices
    SEC_SLOTS.forEach(([c, r], i) => {
      if (i < game.securityOffices) {
        items.push(
          <SecurityOfficeModel
            key={`sec_${i}`}
            position={gridToWorld(c, r)}
            onClick={handleClick('securityOffice')}
          />
        );
      }
    });

    return items;
  }, [
    game.miningRigs, game.powerPlants, game.coolingHubs,
    game.maintenanceBays, game.securityOffices,
    game.rigTiers, game.wearLevel,
    overheated, handleClick,
  ]);

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={18}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.45}
        target={[3 * GRID_SPACING, 0, 3 * GRID_SPACING]}
        autoRotate
        autoRotateSpeed={0.3}
      />

      {/* Lighting system */}
      <DistrictLighting regime={market.regime} />

      {/* Environment (sky, stars, fog) */}
      <DistrictEnvironment />

      {/* Ground */}
      <GroundPlane />

      {/* Buildings */}
      {buildings}

      {/* Particle systems */}
      <DistrictParticles
        regime={market.regime}
        rigCount={game.miningRigs}
        overheated={overheated}
      />

      {/* Post-processing */}
      <DistrictEffects />
    </>
  );
}

// ─── Loading fallback ─────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color={Colors.accent} />
      <Text style={styles.loadingText}>Initializing district...</Text>
    </View>
  );
}

// ─── Main exported component ──────────────────────────────────────────────
interface District3DSceneProps {
  onBuildingPress: (type: string) => void;
  containerWidth?: number;
}

export function District3DScene({ onBuildingPress }: District3DSceneProps) {
  const { game } = useGame();
  const { market } = useMarket();

  return (
    <View style={styles.container}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          alpha: false,
        }}
        camera={{
          position: [12, 8, 12],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        style={styles.canvas}
        onCreated={(state) => {
          state.gl.setClearColor('#080B12');
        }}
      >
        <Suspense fallback={null}>
          <SceneContent onBuildingPress={onBuildingPress} />
        </Suspense>
      </Canvas>

      {/* Status bar overlay */}
      <View style={styles.districtLabel} pointerEvents="none">
        <View style={[styles.labelDot, {
          backgroundColor: market.regime === 'crash' ? Colors.accentRed : Colors.accentGreen
        }]} />
        <Text style={styles.labelText}>
          {game.miningRigs} Rigs · {game.powerPlants - 2 + game.coolingHubs - 2} Infra
        </Text>
      </View>

      {/* Orbit hint */}
      <View style={styles.orbitHint} pointerEvents="none">
        <Text style={styles.orbitHintText}>Drag to orbit · Pinch to zoom</Text>
      </View>

      {game.miningRigs === 0 && (
        <View style={styles.tapHint} pointerEvents="none">
          <Text style={styles.tapHintText}>Build rigs to grow your district</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#080B12',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  canvas: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  districtLabel: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  orbitHint: {
    position: 'absolute',
    top: 10,
    right: 14,
  },
  orbitHintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
    color: Colors.textMuted,
    opacity: 0.6,
  },
  tapHint: {
    position: 'absolute',
    bottom: 10,
    right: 14,
  },
  tapHintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
