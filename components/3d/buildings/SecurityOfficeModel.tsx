import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

interface SecurityOfficeModelProps {
  position: [number, number, number];
  onClick?: () => void;
}

export function SecurityOfficeModel({ position, onClick }: SecurityOfficeModelProps) {
  const radarRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const purpleColor = new THREE.Color(Colors.accentPurple);
  const redColor = new THREE.Color(Colors.accentRed);

  useFrame((state, delta) => {
    // Rotating radar
    if (radarRef.current) {
      radarRef.current.rotation.y += delta * 2;
    }

    // Shield pulse
    if (shieldRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.2) * 0.1 + 0.3;
      (shieldRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
      const scale = Math.sin(state.clock.elapsedTime * 0.8) * 0.05 + 1;
      shieldRef.current.scale.setScalar(scale);
    }

    // Scanner sweep
    if (scanRef.current) {
      scanRef.current.rotation.y += delta * 3;
      (scanRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        Math.sin(state.clock.elapsedTime * 4) * 1 + 1.5;
    }

    // Pulse light
    if (lightRef.current) {
      lightRef.current.intensity = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 1.5;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Main building */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.7]} />
        <meshStandardMaterial color="#140c1e" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Front panel accent */}
      <mesh position={[0, 0.5, 0.351]}>
        <boxGeometry args={[0.6, 0.8, 0.01]} />
        <meshStandardMaterial color="#1a1230" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Shield emblem on front */}
      <mesh position={[0, 0.55, 0.36]}>
        <circleGeometry args={[0.12, 6]} />
        <meshStandardMaterial
          color={purpleColor}
          emissive={purpleColor}
          emissiveIntensity={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Status indicator line */}
      <mesh position={[0, 0.25, 0.36]}>
        <boxGeometry args={[0.5, 0.02, 0.01]} />
        <meshStandardMaterial
          color={redColor}
          emissive={redColor}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.01, 0]}>
        <boxGeometry args={[0.85, 0.02, 0.75]} />
        <meshStandardMaterial color="#1a1230" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Radar dish mount */}
      <group ref={radarRef} position={[0, 1.15, 0]}>
        {/* Radar pole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.25, 8]} />
          <meshStandardMaterial color="#2a1e3a" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Dish */}
        <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.12, 0.06, 16, 1, true]} />
          <meshStandardMaterial
            color="#2a1e3a"
            metalness={0.85}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Radar scanner beam */}
        <mesh ref={scanRef} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.01]} />
          <meshStandardMaterial
            color={purpleColor}
            emissive={purpleColor}
            emissiveIntensity={2}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Holographic shield dome */}
      <mesh ref={shieldRef} position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={purpleColor}
          emissive={purpleColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.04, 0.8]} />
        <meshStandardMaterial color="#0e0814" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 0.3]}
        color={purpleColor}
        intensity={1.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}
