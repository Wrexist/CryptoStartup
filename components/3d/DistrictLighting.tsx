import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

const REGIME_LIGHT_COLORS: Record<string, string> = {
  calm: Colors.accentGreen,
  trending: Colors.accent,
  mania: Colors.accentAmber,
  crash: Colors.accentRed,
  recovery: Colors.accentPurple,
};

interface DistrictLightingProps {
  regime: string;
}

export function DistrictLighting({ regime }: DistrictLightingProps) {
  const regimeLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);

  const regimeColor = new THREE.Color(REGIME_LIGHT_COLORS[regime] ?? Colors.accent);

  useFrame((state) => {
    // Subtle regime light pulsing
    if (regimeLightRef.current) {
      regimeLightRef.current.color.copy(regimeColor);
      regimeLightRef.current.intensity = Math.sin(state.clock.elapsedTime * 0.8) * 0.3 + 0.8;
    }
  });

  return (
    <>
      {/* Ambient — very dim for dark mood */}
      <ambientLight intensity={0.15} color="#1a2040" />

      {/* Main directional (moonlight from above-left) */}
      <directionalLight
        position={[-8, 12, -5]}
        intensity={0.6}
        color="#4466aa"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.001}
      />

      {/* Rim light from opposite side for depth */}
      <directionalLight
        ref={rimLightRef}
        position={[10, 6, 8]}
        intensity={0.2}
        color="#2244aa"
      />

      {/* Regime-colored atmospheric light */}
      <pointLight
        ref={regimeLightRef}
        position={[3, 8, 4]}
        color={regimeColor}
        intensity={0.8}
        distance={25}
        decay={2}
      />

      {/* Ground-level fill light (warm) */}
      <pointLight
        position={[3, 0.5, 4]}
        color="#1a1520"
        intensity={0.3}
        distance={15}
        decay={2}
      />

      {/* Hemisphere light for natural sky/ground colors */}
      <hemisphereLight
        args={['#1a2040', '#080B12', 0.3]}
      />
    </>
  );
}
