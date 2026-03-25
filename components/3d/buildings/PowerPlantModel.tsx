import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

interface PowerPlantModelProps {
  position: [number, number, number];
  onClick?: () => void;
}

export function PowerPlantModel({ position, onClick }: PowerPlantModelProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const arcGroup = useRef<THREE.Group>(null);

  const accentColor = new THREE.Color(Colors.accent);

  useFrame((state, delta) => {
    // Rotating energy rings
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 1.5;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 1.2;
      ring2Ref.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.7) * 0.15;
    }

    // Pulsing core
    if (coreRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 1;
      coreRef.current.scale.setScalar(pulse);
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 3;
    }

    // Pulsing light
    if (glowRef.current) {
      glowRef.current.intensity = Math.sin(state.clock.elapsedTime * 2) * 1 + 3;
    }

    // Rotate arc group
    if (arcGroup.current) {
      arcGroup.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Base structure — tall reactor */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.9, 1.6, 0.9]} />
        <meshStandardMaterial color="#0c1829" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Reactor chamber (cylinder) */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.8, 16]} />
        <meshStandardMaterial
          color="#0e1e35"
          metalness={0.9}
          roughness={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Core energy sphere */}
      <mesh ref={coreRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Energy ring 1 */}
      <mesh ref={ringRef} position={[0, 1.1, 0]}>
        <torusGeometry args={[0.3, 0.015, 8, 32]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Energy ring 2 */}
      <mesh ref={ring2Ref} position={[0, 1.1, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.25, 0.01, 8, 32]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Electrical arc pillars */}
      <group ref={arcGroup} position={[0, 1.1, 0]}>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh
            key={`arc_${i}`}
            position={[Math.cos(angle) * 0.42, 0, Math.sin(angle) * 0.42]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1.5}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Top cap */}
      <mesh position={[0, 1.61, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 0.1, 16]} />
        <meshStandardMaterial color="#0a1525" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.04, 1.0]} />
        <meshStandardMaterial color="#0a1220" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Corner accent lights */}
      {[[-0.4, 0.02, -0.4], [0.4, 0.02, -0.4], [-0.4, 0.02, 0.4], [0.4, 0.02, 0.4]].map((pos, i) => (
        <mesh key={`corner_${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={2}
          />
        </mesh>
      ))}

      {/* Core point light */}
      <pointLight
        ref={glowRef}
        position={[0, 1.1, 0]}
        color={accentColor}
        intensity={3}
        distance={4}
        decay={2}
      />
    </group>
  );
}
