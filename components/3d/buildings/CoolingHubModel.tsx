import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

interface CoolingHubModelProps {
  position: [number, number, number];
  onClick?: () => void;
}

export function CoolingHubModel({ position, onClick }: CoolingHubModelProps) {
  const fanRef = useRef<THREE.Mesh>(null);
  const steamRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const greenColor = new THREE.Color(Colors.accentGreen);

  // Steam particles
  const steamGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 40;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 1.5 + 1.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    // Spin fan
    if (fanRef.current) {
      fanRef.current.rotation.y += delta * 3;
    }

    // Pulse ring
    if (ringRef.current) {
      const scale = Math.sin(state.clock.elapsedTime * 1.5) * 0.05 + 1;
      ringRef.current.scale.set(scale, 1, scale);
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        Math.sin(state.clock.elapsedTime * 2) * 0.5 + 1.5;
    }

    // Animate steam
    if (steamRef.current) {
      const positions = steamRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += delta * (0.3 + Math.random() * 0.2);
        const x = positions.getX(i) + (Math.random() - 0.5) * delta * 0.3;
        if (y > 2.8) {
          y = 1.2;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.15;
          positions.setX(i, Math.cos(angle) * radius);
          positions.setZ(i, Math.sin(angle) * radius);
        } else {
          positions.setX(i, x);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }

    // Pulse light
    if (glowRef.current) {
      glowRef.current.intensity = Math.sin(state.clock.elapsedTime * 1.5) * 0.5 + 1.5;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Cylindrical tower base */}
      <mesh castShadow receiveShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 1.3, 16]} />
        <meshStandardMaterial color="#081818" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Green accent rings */}
      {[0.3, 0.6, 0.9].map((y, i) => (
        <mesh key={`ring_${i}`} position={[0, y, 0]}>
          <torusGeometry args={[0.4 - i * 0.01, 0.008, 8, 32]} />
          <meshStandardMaterial
            color={greenColor}
            emissive={greenColor}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {/* Top grate */}
      <mesh position={[0, 1.31, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.02, 16]} />
        <meshStandardMaterial color="#0e2222" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Fan blades */}
      <group ref={fanRef} position={[0, 1.32, 0]}>
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={`blade_${deg}`} position={[Math.cos(rad) * 0.15, 0, Math.sin(rad) * 0.15]} rotation={[0, -rad, 0]}>
              <boxGeometry args={[0.22, 0.01, 0.06]} />
              <meshStandardMaterial color="#1a3030" metalness={0.8} roughness={0.3} />
            </mesh>
          );
        })}
        {/* Fan hub */}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
          <meshStandardMaterial
            color={greenColor}
            emissive={greenColor}
            emissiveIntensity={2}
          />
        </mesh>
      </group>

      {/* Pulsing ring at top */}
      <mesh ref={ringRef} position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.32, 32]} />
        <meshStandardMaterial
          color={greenColor}
          emissive={greenColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.04, 16]} />
        <meshStandardMaterial color="#0a1612" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Steam particles */}
      <points ref={steamRef} geometry={steamGeometry}>
        <pointsMaterial
          color={greenColor}
          size={0.04}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Glow light */}
      <pointLight
        ref={glowRef}
        position={[0, 1.0, 0]}
        color={greenColor}
        intensity={1.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}
