import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

interface EmptySlotMarkerProps {
  position: [number, number, number];
  onClick?: () => void;
}

export function EmptySlotMarker({ position, onClick }: EmptySlotMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outlineRef = useRef<THREE.LineSegments>(null);

  useFrame((state) => {
    if (outlineRef.current) {
      const mat = outlineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 0.25;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });

  // Box outline edges
  const edgesGeo = React.useMemo(() => {
    const box = new THREE.BoxGeometry(0.8, 0.5, 0.7);
    return new THREE.EdgesGeometry(box);
  }, []);

  return (
    <group position={position} onClick={onClick}>
      <group ref={groupRef}>
        {/* Holographic outline */}
        <lineSegments ref={outlineRef} geometry={edgesGeo} position={[0, 0.25, 0]}>
          <lineBasicMaterial
            color={Colors.accent}
            transparent
            opacity={0.25}
          />
        </lineSegments>

        {/* Ground marker */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[0.7, 0.6]} />
          <meshBasicMaterial
            color={Colors.accent}
            transparent
            opacity={0.05}
          />
        </mesh>

        {/* Plus sign indicator */}
        <mesh position={[0, 0.25, 0.36]}>
          <planeGeometry args={[0.15, 0.02]} />
          <meshBasicMaterial
            color={Colors.accent}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.25, 0.36]}>
          <planeGeometry args={[0.02, 0.15]} />
          <meshBasicMaterial
            color={Colors.accent}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
