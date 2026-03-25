import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

const REGIME_PARTICLE_COLORS: Record<string, string> = {
  calm: Colors.accentGreen,
  trending: Colors.accent,
  mania: Colors.accentAmber,
  crash: Colors.accentRed,
  recovery: Colors.accentPurple,
};

interface DistrictParticlesProps {
  regime: string;
  rigCount: number;
  overheated: boolean;
}

export function DistrictParticles({ regime, rigCount, overheated }: DistrictParticlesProps) {
  const miningRef = useRef<THREE.Points>(null);
  const regimeRef = useRef<THREE.Points>(null);

  const regimeColor = REGIME_PARTICLE_COLORS[regime] ?? Colors.accent;

  // Mining data stream particles (rise from rig area)
  const miningGeo = useMemo(() => {
    const count = Math.min(rigCount * 8, 72);
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 2 + Math.random() * 4;     // X: mining zone
      positions[i * 3 + 1] = Math.random() * 4;       // Y: from ground up
      positions[i * 3 + 2] = 4 + Math.random() * 4;   // Z: mining zone
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [rigCount]);

  // Regime-specific ambient particles
  const regimeGeo = useMemo(() => {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.3) * 14;
      positions[i * 3 + 1] = Math.random() * 6 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.3) * 14;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    // Mining particles float upward
    if (miningRef.current && rigCount > 0) {
      const positions = miningRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += delta * (0.5 + Math.sin(i * 0.7 + state.clock.elapsedTime) * 0.2);
        if (y > 5) {
          y = 0.2;
          positions.setX(i, 2 + Math.random() * 4);
          positions.setZ(i, 4 + Math.random() * 4);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }

    // Regime particles — fall in crash, rise in mania, float in others
    if (regimeRef.current) {
      const positions = regimeRef.current.geometry.attributes.position;
      const isCrash = regime === 'crash';
      const dir = isCrash ? -1 : 1;

      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += delta * dir * (0.3 + Math.sin(i * 0.5) * 0.15);
        const x = positions.getX(i) + Math.sin(state.clock.elapsedTime + i) * delta * 0.1;

        if (isCrash && y < 0.1) {
          y = 6;
          positions.setX(i, (Math.random() - 0.3) * 14);
          positions.setZ(i, (Math.random() - 0.3) * 14);
        } else if (!isCrash && y > 7) {
          y = 1;
          positions.setX(i, (Math.random() - 0.3) * 14);
          positions.setZ(i, (Math.random() - 0.3) * 14);
        } else {
          positions.setX(i, x);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Mining data stream particles */}
      {rigCount > 0 && (
        <points ref={miningRef} geometry={miningGeo}>
          <pointsMaterial
            color={overheated ? Colors.accentRed : Colors.accentAmber}
            size={0.05}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      )}

      {/* Regime ambient particles */}
      <points ref={regimeRef} geometry={regimeGeo}>
        <pointsMaterial
          color={regimeColor}
          size={regime === 'crash' ? 0.06 : 0.04}
          transparent
          opacity={regime === 'mania' ? 0.6 : 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
