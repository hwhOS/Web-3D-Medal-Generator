import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { Vector3 } from 'three';
import { resolveMaterial } from '../domain/materials';
import type { MedalConfig, ModelBuffers, ThemeMode } from '../domain/types';
import { createMedalGeometry, hasBackMarkGeometry, hasReliefGeometry } from '../export/exporters';

export type PreviewView = 'iso' | 'front' | 'back' | 'right' | 'top';

const viewVectors: Record<PreviewView, [number, number, number]> = {
  iso: [0.55, -0.8, 0.62],
  front: [0, -0.03, 1],
  back: [0, 0.03, -1],
  right: [1, -0.03, 0.03],
  top: [0, 1, 0.03]
};

const upVectors: Record<PreviewView, [number, number, number]> = {
  iso: [0, 1, 0],
  front: [0, 1, 0],
  back: [0, 1, 0],
  right: [0, 0, 1],
  top: [0, 0, 1]
};

function useEffectiveTheme(themeMode: ThemeMode): 'light' | 'dark' {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemDark(query.matches);
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;
}

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

function SceneCamera({ model, view }: { model: ModelBuffers | null; view: PreviewView }) {
  const { camera, invalidate, size } = useThree();
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);

  useEffect(() => {
    if (!model) {
      return undefined;
    }

    const applyView = () => {
      const center = new Vector3(
        (model.bounds.min[0] + model.bounds.max[0]) / 2,
        (model.bounds.min[1] + model.bounds.max[1]) / 2,
        (model.bounds.min[2] + model.bounds.max[2]) / 2
      );
      const maxDimension = Math.max(
        model.bounds.max[0] - model.bounds.min[0],
        model.bounds.max[1] - model.bounds.min[1],
        model.bounds.max[2] - model.bounds.min[2]
      );
      const fov = 'fov' in camera ? (camera.fov * Math.PI) / 180 : Math.PI / 4;
      const aspectFit = Math.max(1, size.height / Math.max(size.width, 1));
      const distance = Math.max(88, (maxDimension * 0.72 * aspectFit) / Math.tan(fov / 2));
      const direction = new Vector3(...viewVectors[view]).normalize();

      camera.position.copy(center).addScaledVector(direction, distance);
      camera.up.fromArray(upVectors[view]);
      camera.near = Math.max(0.1, distance / 500);
      camera.far = distance * 8;
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.object.position.copy(camera.position);
        controlsRef.current.object.up.copy(camera.up);
        controlsRef.current.enableDamping = false;
        controlsRef.current.update();
        controlsRef.current.enableDamping = true;
      }
      invalidate();
    };

    const frame = window.requestAnimationFrame(applyView);
    return () => window.cancelAnimationFrame(frame);
  }, [camera, invalidate, model, size.height, size.width, view]);

  return <OrbitControls ref={controlsRef} makeDefault enableDamping minDistance={38} maxDistance={220} />;
}

export function PreviewScene({
  model,
  config,
  view,
  themeMode
}: {
  model: ModelBuffers | null;
  config: MedalConfig;
  view: PreviewView;
  themeMode: ThemeMode;
}) {
  const effectiveTheme = useEffectiveTheme(themeMode);
  const colors =
    effectiveTheme === 'dark'
      ? {
          background: '#111113',
          gridCell: '#2b2b30',
          gridSection: '#515158',
          shadowOpacity: 0.36
        }
      : {
          background: '#f5f5f7',
          gridCell: '#d7d7dc',
          gridSection: '#a7a7af',
          shadowOpacity: 0.22
        };

  return (
    <div className="preview-shell">
      <Canvas camera={{ position: [0, -105, 72], fov: 42 }} shadows gl={{ antialias: true }}>
        <color attach="background" args={[colors.background]} />
        <ambientLight intensity={effectiveTheme === 'dark' ? 0.95 : 0.8} />
        <directionalLight position={[32, -44, 70]} intensity={effectiveTheme === 'dark' ? 2.5 : 2.2} castShadow />
        <directionalLight position={[-55, 32, 35]} intensity={effectiveTheme === 'dark' ? 1 : 0.8} />
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
          cellColor={colors.gridCell}
          sectionColor={colors.gridSection}
        />
        {model && <MedalMesh model={model} config={config} />}
        <ContactShadows opacity={colors.shadowOpacity} scale={120} blur={2.5} far={30} position={[0, 0, -8]} />
        <SceneCamera model={model} view={view} />
      </Canvas>
    </div>
  );
}
