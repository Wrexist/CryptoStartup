import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

export function DistrictEnvironment() {
  const starsRef = useRef<THREE.Points>(null);

  // Starfield
  const starsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // upper hemisphere only
      const r = 30 + Math.random() * 20;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = Math.random() * 0.08 + 0.02;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  // Floating data particles (ambient)
  const dataParticlesRef = useRef<THREE.Points>(null);
  const dataGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.3) * 16;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.3) * 16;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    // Slowly rotate stars
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
    }

    // Float data particles upward
    if (dataParticlesRef.current) {
      const positions = dataParticlesRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += delta * (0.1 + Math.sin(i) * 0.05);
        if (y > 8) {
          y = 0.5;
          positions.setX(i, (Math.random() - 0.3) * 16);
          positions.setZ(i, (Math.random() - 0.3) * 16);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Sky dome - dark gradient */}
      <mesh position={[3, 0, 4]}>
        <sphereGeometry args={[50, 32, 16]} />
        <meshBasicMaterial
          color="#030508"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Stars */}
      <points ref={starsRef} geometry={starsGeometry}>
        <pointsMaterial
          color="#8B96B0"
          size={0.06}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Ambient data particles */}
      <points ref={dataParticlesRef} geometry={dataGeometry}>
        <pointsMaterial
          color={Colors.accent}
          size={0.04}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Fog */}
      <fog attach="fog" args={['#080B12', 15, 45]} />

      {/* Distant holographic horizon glow */}
      <mesh position={[3, 0.5, -15]} rotation={[0, 0, 0]}>
        <planeGeometry args={[40, 3]} />
        <meshBasicMaterial
          color={Colors.accent}
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
