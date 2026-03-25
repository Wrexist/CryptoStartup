import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/constants/colors';

export function GroundPlane() {
  const gridRef = useRef<THREE.LineSegments>(null);

  // Create grid line geometry for the cyberpunk ground
  const gridGeometry = useMemo(() => {
    const size = 20;
    const divisions = 20;
    const step = size / divisions;
    const half = size / 2;

    const vertices: number[] = [];
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      // X lines
      vertices.push(-half, 0.01, pos, half, 0.01, pos);
      // Z lines
      vertices.push(pos, 0.01, -half, pos, 0.01, half);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  // Accent lines around the building area
  const accentGeometry = useMemo(() => {
    const vertices: number[] = [];
    // Main district outline
    const minX = -3, maxX = 10, minZ = -1, maxZ = 10;
    vertices.push(
      minX, 0.02, minZ, maxX, 0.02, minZ,
      maxX, 0.02, minZ, maxX, 0.02, maxZ,
      maxX, 0.02, maxZ, minX, 0.02, maxZ,
      minX, 0.02, maxZ, minX, 0.02, minZ,
    );
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = Math.sin(state.clock.elapsedTime * 0.3) * 0.05 + 0.15;
    }
  });

  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0, 4]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#060910"
          metalness={0.9}
          roughness={0.4}
        />
      </mesh>

      {/* Subtle reflective layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.005, 4]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#080B12"
          metalness={0.95}
          roughness={0.1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Grid lines */}
      <lineSegments ref={gridRef} geometry={gridGeometry}>
        <lineBasicMaterial
          color={Colors.accent}
          transparent
          opacity={0.12}
        />
      </lineSegments>

      {/* Accent border */}
      <lineSegments geometry={accentGeometry}>
        <lineBasicMaterial
          color={Colors.accent}
          transparent
          opacity={0.3}
        />
      </lineSegments>

      {/* Building zone ground tiles */}
      {/* Mining zone - slightly brighter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.003, 6]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial
          color="#0E1520"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Power zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.003, 6]} receiveShadow>
        <planeGeometry args={[2, 6]} />
        <meshStandardMaterial
          color="#0A1018"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Cooling zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.003, 0]} receiveShadow>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial
          color="#0A1612"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}
