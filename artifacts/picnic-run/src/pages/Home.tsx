import { useRef, Suspense } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, Float } from "@react-three/drei";
import { Logo } from "@/components/Logo";
import { Storage } from "@/lib/storage";
import { WebGLErrorBoundary } from "@/components/WebGLFallback";
import * as THREE from "three";

function Character() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
    }
  });
  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#D4A76A" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.15, 1.55, 0.31]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[-0.15, 1.55, 0.31]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.45]} />
        <meshStandardMaterial color="#F97316" />
      </mesh>
      {/* Arms */}
      <mesh position={[0.55, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.3]} />
        <meshStandardMaterial color="#D4A76A" />
      </mesh>
      <mesh position={[-0.55, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.3]} />
        <meshStandardMaterial color="#D4A76A" />
      </mesh>
      {/* Legs */}
      <mesh position={[0.2, 0.15, 0]}>
        <boxGeometry args={[0.28, 0.6, 0.35]} />
        <meshStandardMaterial color="#2563EB" />
      </mesh>
      <mesh position={[-0.2, 0.15, 0]}>
        <boxGeometry args={[0.28, 0.6, 0.35]} />
        <meshStandardMaterial color="#2563EB" />
      </mesh>
      {/* Shoes */}
      <mesh position={[0.2, -0.2, 0.07]}>
        <boxGeometry args={[0.3, 0.18, 0.45]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-0.2, -0.2, 0.07]}>
        <boxGeometry args={[0.3, 0.18, 0.45]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  );
}

function FloatingCoin({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.y += 0.03;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.18, 0.06, 8, 16]} />
      <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.1} emissive="#F59E0B" emissiveIntensity={0.4} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#16A34A" roughness={0.9} />
    </mesh>
  );
}

function Scene3D() {
  return (
    <>
      <Sky sunPosition={[100, 10, 100]} turbidity={2} rayleigh={0.5} mieCoefficient={0.003} mieDirectionalG={0.8} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#FFF5E0" castShadow />
      <pointLight position={[-3, 3, -3]} intensity={0.5} color="#7DD3FC" />
      <Ground />
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <Character />
      </Float>
      {[[-2, 1.2, -2], [2.5, 1.5, -1], [0, 1.8, -3], [-1.5, 1, -4], [3, 1.3, -3]].map((pos, i) => (
        <FloatingCoin key={i} position={pos as [number, number, number]} />
      ))}
      {/* Trees */}
      {[[-4, 0, -2], [4, 0, -3], [-5, 0, -5], [5, 0, -1]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1, 6]} />
            <meshStandardMaterial color="#92400E" />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <coneGeometry args={[0.8, 2.2, 8]} />
            <meshStandardMaterial color="#15803D" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const player = Storage.getPlayer();
  const session = Storage.getSession();

  const handlePlay = () => {
    setLocation("/game");
  };

  const handleLogin = () => {
    setLocation("/login");
  };

  const handleGuest = () => {
    Storage.setSession("guest");
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <WebGLErrorBoundary fallback={<div className="w-full h-full bg-gradient-to-b from-emerald-900/40 to-background" />}>
          <Suspense fallback={<div className="w-full h-full bg-background" />}>
            <Canvas
              camera={{ position: [0, 2, 6], fov: 60 }}
              shadows
              style={{ background: "transparent" }}
            >
              <Scene3D />
            </Canvas>
          </Suspense>
        </WebGLErrorBoundary>
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-background/10 pointer-events-none" />

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pt-12">
        {/* Top Logo */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Logo />
        </motion.div>

        {/* Bottom Controls */}
        <motion.div
          className="w-full max-w-sm flex flex-col items-center gap-4 mb-8"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Greeting */}
          {player && session === "player" && (
            <p className="text-foreground/70 text-sm font-bold tracking-widest uppercase">
              Welcome back, {player.name}!
            </p>
          )}

          {/* PLAY Button */}
          <motion.button
            data-testid="button-play"
            onClick={handlePlay}
            className="relative w-full py-5 rounded-3xl text-3xl font-serif font-bold uppercase tracking-widest text-white overflow-hidden"
            style={{ background: "hsl(152 60% 40%)" }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: [
                "0 0 20px hsl(152 60% 40% / 0.5), 0 4px 20px rgba(0,0,0,0.4)",
                "0 0 40px hsl(152 60% 40% / 0.8), 0 4px 30px rgba(0,0,0,0.5)",
                "0 0 20px hsl(152 60% 40% / 0.5), 0 4px 20px rgba(0,0,0,0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative z-10">PLAY</span>
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
            />
          </motion.button>

          {/* Guest / Login toggle */}
          {!session || session === "guest" ? (
            <div className="flex gap-3 w-full">
              <button
                data-testid="button-guest"
                onClick={handleGuest}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider border transition-all ${
                  session === "guest"
                    ? "bg-muted border-primary text-primary"
                    : "bg-muted/50 border-border/40 text-muted-foreground"
                }`}
              >
                Guest
              </button>
              <button
                data-testid="button-login"
                onClick={handleLogin}
                className="flex-1 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider bg-secondary/20 border border-secondary/40 text-secondary hover:bg-secondary/30 transition-all"
              >
                Login
              </button>
            </div>
          ) : null}

          {/* Dashboard link */}
          <button
            data-testid="button-dashboard"
            onClick={() => setLocation("/dashboard")}
            className="text-muted-foreground/70 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors mt-1"
          >
            Dashboard →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
