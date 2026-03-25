import React from 'react';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export function DistrictEffects() {
  return (
    <EffectComposer>
      {/* Bloom — makes all emissive materials glow */}
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      {/* Vignette — dark edges for cinematic feel */}
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Chromatic aberration — subtle for futuristic feel */}
      <ChromaticAberration
        offset={new THREE.Vector2(0.001, 0.001)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0.5}
      />
    </EffectComposer>
  );
}
