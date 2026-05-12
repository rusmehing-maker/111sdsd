import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, PresentationControls, Environment, ContactShadows } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelViewer({ url }: { url: string }) {
  return (
    <div className="w-full h-[400px] bg-slate-950/50 rounded-2xl overflow-hidden relative border border-slate-800">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">
           Loading 3D Engine...
        </div>
      }>
        <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
          <Environment preset="city" />
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0.3, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
          >
             <Stage environment="city" intensity={0.5} contactShadow={true} adjustCamera={true}>
                <Model url={url} />
             </Stage>
          </PresentationControls>
          <OrbitControls makeDefault enableZoom={false} autoRotate autoRotateSpeed={0.5} />
          <ContactShadows position={[0, -0.8, 0]} opacity={0.4} scale={5} blur={2} />
        </Canvas>
      </Suspense>
    </div>
  );
}
