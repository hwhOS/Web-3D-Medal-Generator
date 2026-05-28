import { Bounds, ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { resolveMaterial } from '../domain/materials';
import type { MedalConfig, ModelBuffers } from '../domain/types';
import { createMedalGeometry, hasBackMarkGeometry, hasReliefGeometry } from '../export/exporters';

function MedalMesh({ model, config }: { model: ModelBuffers; config: MedalConfig }) {
  const baseGeometry = useMemo(() => createMedalGeometry(model, 'base'), [model]);
  const reliefGeometry = useMemo(() => (hasReliefGeometry(model) ? createMedalGeometry(model, 'relief') : null), [model]);
  const markGeometry = useMemo(() => (hasBackMarkGeometry(model) ? createMedalGeometry(model, 'mark') : null), [model]);
  const material = resolveMaterial(config);

  return (
    <group>
      <mesh geometry={baseGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={material.color} metalness={material.metalness} roughness={material.roughness} />
      </mesh>
      {reliefGeometry && (
        <mesh geometry={reliefGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={config.reliefColor} metalness={config.reliefMetalness} roughness={config.reliefRoughness} />
        </mesh>
      )}
      {markGeometry && (
        <mesh geometry={markGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={config.backMarkColor} metalness={config.backMarkMetalness} roughness={config.backMarkRoughness} />
        </mesh>
      )}
    </group>
  );
}

export function PreviewScene({ model, config }: { model: ModelBuffers | null; config: MedalConfig }) {
  return (
    <div className="preview-shell">
      <Canvas camera={{ position: [0, -105, 72], fov: 42 }} shadows gl={{ antialias: true }}>
        <color attach="background" args={['#f6f4ef']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[32, -44, 70]} intensity={2.2} castShadow />
        <directionalLight position={[-55, 32, 35]} intensity={0.8} />
        <Environment preset="city" />
        <Grid
          position={[0, 0, -8]}
          args={[180, 180]}
          cellSize={10}
          cellThickness={0.6}
          sectionSize={30}
          sectionThickness={1}
          fadeDistance={150}
          fadeStrength={1.5}
          cellColor="#d6d2c7"
          sectionColor="#9b9488"
        />
        {model && (
          <Bounds fit clip observe margin={1.25}>
            <MedalMesh model={model} config={config} />
          </Bounds>
        )}
        <ContactShadows opacity={0.28} scale={120} blur={2.5} far={30} position={[0, 0, -8]} />
        <OrbitControls makeDefault enableDamping minDistance={38} maxDistance={220} />
      </Canvas>
    </div>
  );
}
