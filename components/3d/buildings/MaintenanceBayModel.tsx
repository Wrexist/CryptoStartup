import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

interface MaintenanceBayModelProps {
  position: [number, number, number];
  onClick?: () => void;
}

export function MaintenanceBayModel({ position, onClick }: MaintenanceBayModelProps) {
  const armRef = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const purpleColor = new THREE.Color(Colors.accentPurple);

  useFrame((state, delta) => {
    // Robotic arm oscillation
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.4;
      armRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
    }

    // Spark effect
    if (sparkRef.current) {
      const positions = sparkRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y -= delta * 2;
        if (y < 0.3) {
          y = 0.9;
          positions.setX(i, (Math.random() - 0.5) * 0.3);
          positions.setZ(i, (Math.random() - 0.5) * 0.3);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }

    // Pulse light
    if (lightRef.current) {
      lightRef.current.intensity = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 1;
    }
  });

  // Spark particles
  const sparkGeo = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 20;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = Math.random() * 0.6 + 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  return (
    <group position={position} onClick={onClick}>
      {/* Low-profile garage structure */}
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.9, 0.7, 0.8]} />
        <meshStandardMaterial color="#141020" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Garage door */}
      <mesh position={[0, 0.3, 0.41]}>
        <boxGeometry args={[0.6, 0.5, 0.01]} />
        <meshStandardMaterial color="#1a1530" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Door accent lines */}
      {[0.15, 0.3, 0.45].map((y, i) => (
        <mesh key={`door_${i}`} position={[0, y, 0.42]}>
          <boxGeometry args={[0.55, 0.01, 0.01]} />
          <meshStandardMaterial
            color={purpleColor}
            emissive={purpleColor}
            emissiveIntensity={1}
          />
        </mesh>
      ))}

      {/* Roof */}
      <mesh position={[0, 0.71, 0]}>
        <boxGeometry args={[0.95, 0.02, 0.85]} />
        <meshStandardMaterial color="#1a1530" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Robotic arm */}
      <group ref={armRef} position={[0.1, 0.72, 0]}>
        {/* Arm base */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.2, 8]} />
          <meshStandardMaterial color="#2a2040" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Arm segment */}
        <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.03, 0.25, 0.03]} />
          <meshStandardMaterial color="#2a2040" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Tool head */}
        <mesh position={[0.08, 0.38, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={purpleColor}
            emissive={purpleColor}
            emissiveIntensity={2}
          />
        </mesh>
      </group>

      {/* Welding sparks */}
      <points ref={sparkRef} geometry={sparkGeo} position={[0.1, 0, 0]}>
        <pointsMaterial
          color={Colors.accentAmber}
          size={0.03}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Base platform */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.04, 0.9]} />
        <meshStandardMaterial color="#0e0c18" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Purple accent light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.5, 0.3]}
        color={purpleColor}
        intensity={1}
        distance={2.5}
        decay={2}
      />
    </group>
  );
}
