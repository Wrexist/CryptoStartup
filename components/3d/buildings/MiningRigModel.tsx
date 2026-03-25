import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RIG_TIERS } from '@/constants/rigTiers';
import Colors from '@/constants/colors';

interface MiningRigModelProps {
  position: [number, number, number];
  tier: number;
  overheated: boolean;
  onClick?: () => void;
}

export function MiningRigModel({ position, tier, overheated, onClick }: MiningRigModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fanRef1 = useRef<THREE.Mesh>(null);
  const fanRef2 = useRef<THREE.Mesh>(null);
  const fanRef3 = useRef<THREE.Mesh>(null);
  const ledRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const smokeRef = useRef<THREE.Points>(null);

  const tierData = RIG_TIERS[tier] ?? RIG_TIERS[0];
  const tierColor = new THREE.Color(tierData.color);
  const hotColor = new THREE.Color(Colors.accentRed);

  const activeColor = overheated ? hotColor : tierColor;
  const emissiveIntensity = overheated ? 2.5 : 1.2;

  // Smoke particles for overheated state
  const smokeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 30;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 1] = Math.random() * 1.5 + 1.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.02 + 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    // Spin fans
    const speed = overheated ? 8 : 4;
    if (fanRef1.current) fanRef1.current.rotation.y += delta * speed;
    if (fanRef2.current) fanRef2.current.rotation.y += delta * speed * 0.9;
    if (fanRef3.current) fanRef3.current.rotation.y += delta * speed * 1.1;

    // Pulse LED
    if (ledRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (overheated ? 6 : 2)) * 0.3 + 0.7;
      (ledRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * emissiveIntensity;
    }

    // Pulse glow light
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (overheated ? 4 : 1.5)) * 0.5 + 1;
      glowRef.current.intensity = pulse * (overheated ? 3 : 1.5);
    }

    // Animate smoke particles
    if (smokeRef.current && overheated) {
      const positions = smokeRef.current.geometry.attributes.position;
      const velocities = smokeRef.current.geometry.attributes.velocity;
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, positions.getY(i) + (velocities as THREE.BufferAttribute).getY(i));
        positions.setX(i, positions.getX(i) + (velocities as THREE.BufferAttribute).getX(i));
        if (positions.getY(i) > 2.5) {
          positions.setY(i, 1.2);
          positions.setX(i, (Math.random() - 0.5) * 0.6);
          positions.setZ(i, (Math.random() - 0.5) * 0.6);
        }
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Base server rack */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.7]} />
        <meshStandardMaterial
          color="#0a1220"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Front panel */}
      <mesh position={[0, 0.6, 0.351]}>
        <boxGeometry args={[0.75, 1.1, 0.01]} />
        <meshStandardMaterial
          color="#0e1828"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* LED strips (3 rows) */}
      {[0.2, 0.5, 0.8].map((y, i) => (
        <mesh key={`led_${i}`} position={[0, y, 0.36]} ref={i === 0 ? ledRef : undefined}>
          <boxGeometry args={[0.6, 0.04, 0.01]} />
          <meshStandardMaterial
            color={activeColor}
            emissive={activeColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {/* LED dots */}
      {[0.2, 0.5, 0.8].map((y, i) => (
        <mesh key={`dot_${i}`} position={[0.32, y, 0.36]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={activeColor}
            emissive={activeColor}
            emissiveIntensity={emissiveIntensity * 1.5}
          />
        </mesh>
      ))}

      {/* Cooling fans (top) */}
      {[-0.2, 0, 0.2].map((x, i) => (
        <mesh
          key={`fan_${i}`}
          ref={i === 0 ? fanRef1 : i === 1 ? fanRef2 : fanRef3}
          position={[x, 1.22, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.12, 0.12, 0.02, 6]} />
          <meshStandardMaterial
            color="#1a2a3a"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Fan grill on top */}
      <mesh position={[0, 1.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.35, 16]} />
        <meshStandardMaterial
          color="#1a2a3a"
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Antenna/status indicator on top */}
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={emissiveIntensity * 2}
        />
      </mesh>

      {/* Side vents */}
      {[-1, 1].map(side => (
        <group key={`vent_${side}`}>
          {[0.3, 0.5, 0.7, 0.9].map((y, i) => (
            <mesh key={`svent_${i}`} position={[side * 0.41, y, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.5]} />
              <meshStandardMaterial color="#1a2838" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Point light glow */}
      <pointLight
        ref={glowRef}
        position={[0, 0.8, 0.5]}
        color={activeColor}
        intensity={overheated ? 3 : 1.5}
        distance={3}
        decay={2}
      />

      {/* Smoke particles when overheated */}
      {overheated && (
        <points ref={smokeRef} geometry={smokeGeometry}>
          <pointsMaterial
            color={Colors.accentRed}
            size={0.06}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
