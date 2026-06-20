import { useRef, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Logo } from "@/components/Logo";
import { Storage } from "@/lib/storage";
import { WebGLErrorBoundary } from "@/components/WebGLFallback";
import * as THREE from "three";

/* ── Animated Character preview ── */
function PreviewCharacter() {
  const groupRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    groupRef.current.rotation.y += delta * 0.4;
    const swing = Math.sin(t.current * 6) * 0.5;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[0.62, 0.62, 0.62]} />
        <meshStandardMaterial color="#E8B887" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.98, 0]}>
        <boxGeometry args={[0.66, 0.18, 0.66]} />
        <meshStandardMaterial color="#4A2C0A" roughness={0.9} />
      </mesh>
      <mesh position={[0.16, 1.68, 0.32]}><boxGeometry args={[0.12, 0.12, 0.04]} /><meshStandardMaterial color="#1C1C3A" /></mesh>
      <mesh position={[-0.16, 1.68, 0.32]}><boxGeometry args={[0.12, 0.12, 0.04]} /><meshStandardMaterial color="#1C1C3A" /></mesh>
      <mesh position={[0.19, 1.71, 0.335]}><boxGeometry args={[0.04, 0.04, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} /></mesh>
      <mesh position={[-0.13, 1.71, 0.335]}><boxGeometry args={[0.04, 0.04, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} /></mesh>
      {/* Torso */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.72, 0.8, 0.48]} />
        <meshStandardMaterial color="#F97316" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.82, 0.26]}>
        <boxGeometry args={[0.42, 0.26, 0.04]} />
        <meshStandardMaterial color="#EA6300" roughness={0.7} />
      </mesh>
      {/* Left Arm */}
      <group ref={leftArmRef} position={[0.52, 1.1, 0]}>
        <mesh position={[0, -0.25, 0]}><boxGeometry args={[0.24, 0.55, 0.26]} /><meshStandardMaterial color="#F97316" roughness={0.7} /></mesh>
        <mesh position={[0, -0.58, 0]}><boxGeometry args={[0.24, 0.18, 0.24]} /><meshStandardMaterial color="#1E293B" roughness={0.5} /></mesh>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[-0.52, 1.1, 0]}>
        <mesh position={[0, -0.25, 0]}><boxGeometry args={[0.24, 0.55, 0.26]} /><meshStandardMaterial color="#F97316" roughness={0.7} /></mesh>
        <mesh position={[0, -0.58, 0]}><boxGeometry args={[0.24, 0.18, 0.24]} /><meshStandardMaterial color="#1E293B" roughness={0.5} /></mesh>
      </group>
      {/* Left Leg */}
      <group ref={leftLegRef} position={[0.2, 0.5, 0]}>
        <mesh position={[0, -0.28, 0]}><boxGeometry args={[0.28, 0.65, 0.3]} /><meshStandardMaterial color="#2563EB" roughness={0.6} /></mesh>
        <mesh position={[0, -0.7, 0.08]}><boxGeometry args={[0.3, 0.18, 0.46]} /><meshStandardMaterial color="#111827" roughness={0.4} /></mesh>
        <mesh position={[0, -0.68, 0.3]}><boxGeometry args={[0.24, 0.1, 0.1]} /><meshStandardMaterial color="#F59E0B" roughness={0.5} /></mesh>
      </group>
      {/* Right Leg */}
      <group ref={rightLegRef} position={[-0.2, 0.5, 0]}>
        <mesh position={[0, -0.28, 0]}><boxGeometry args={[0.28, 0.65, 0.3]} /><meshStandardMaterial color="#2563EB" roughness={0.6} /></mesh>
        <mesh position={[0, -0.7, 0.08]}><boxGeometry args={[0.3, 0.18, 0.46]} /><meshStandardMaterial color="#111827" roughness={0.4} /></mesh>
        <mesh position={[0, -0.68, 0.3]}><boxGeometry args={[0.24, 0.1, 0.1]} /><meshStandardMaterial color="#F59E0B" roughness={0.5} /></mesh>
      </group>
    </group>
  );
}

/* ── Floating Coin ── */
function FloatingCoin({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const t = useRef(delay);

  useFrame((_, delta) => {
    t.current += delta;
    ref.current.rotation.y += 0.04;
    ref.current.position.y = position[1] + Math.sin(t.current * 2.2) * 0.22;
  });

  const coinMat = new THREE.MeshStandardMaterial({
    color: "#F59E0B", metalness: 0.95, roughness: 0.05,
    emissive: "#F59E0B", emissiveIntensity: 0.5,
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
        <primitive object={coinMat} attach="material" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.055, 6, 16]} />
        <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.1} emissive="#FBBF24" emissiveIntensity={0.4} />
      </mesh>
      <pointLight color="#F59E0B" intensity={0.8} distance={2.5} />
    </group>
  );
}

/* ── Ground ── */
function PreviewGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1A6B2A" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <planeGeometry args={[5.8, 30]} />
        <meshStandardMaterial color="#C2A05E" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]}>
        <planeGeometry args={[4.8, 30]} />
        <meshStandardMaterial color="#BF9A50" roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ── Tree ── */
function PreviewTree({ position, type = 0 }: { position: [number, number, number]; type?: number }) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#713F12", roughness: 0.95 });
  if (type === 0) {
    return (
      <group position={position}>
        <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.18, 0.25, 1.6, 7]} /><primitive object={trunkMat} attach="material" /></mesh>
        <mesh position={[0, 2.0, 0]}><coneGeometry args={[1.4, 1.8, 8]} /><meshStandardMaterial color="#15803D" roughness={0.85} /></mesh>
        <mesh position={[0, 3.1, 0]}><coneGeometry args={[1.1, 1.5, 8]} /><meshStandardMaterial color="#15803D" roughness={0.85} /></mesh>
        <mesh position={[0, 4.0, 0]}><coneGeometry args={[0.7, 1.2, 8]} /><meshStandardMaterial color="#166534" roughness={0.9} /></mesh>
        <mesh position={[0, 4.8, 0]}><coneGeometry args={[0.35, 0.9, 7]} /><meshStandardMaterial color="#166534" roughness={0.9} /></mesh>
      </group>
    );
  }
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.2, 0.32, 2.4, 8]} /><primitive object={trunkMat} attach="material" /></mesh>
      <mesh position={[0.2, 3.2, 0]}><sphereGeometry args={[1.1, 8, 6]} /><meshStandardMaterial color="#16A34A" roughness={0.8} /></mesh>
      <mesh position={[-0.6, 2.8, 0.3]}><sphereGeometry args={[0.9, 8, 6]} /><meshStandardMaterial color="#15803D" roughness={0.8} /></mesh>
      <mesh position={[0.5, 3.6, -0.3]}><sphereGeometry args={[0.8, 8, 6]} /><meshStandardMaterial color="#166534" roughness={0.85} /></mesh>
    </group>
  );
}

/* ── Clouds ── */
function CloudGroup({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null!);
  const speed = useRef(0.003 + Math.random() * 0.003);
  useFrame(() => { ref.current.position.x += speed.current; if (ref.current.position.x > 18) ref.current.position.x = -18; });
  const mat = new THREE.MeshStandardMaterial({ color: "#E8F4F0", opacity: 0.88, transparent: true, roughness: 1 });
  return (
    <group ref={ref} position={position}>
      {[[0, 0, 0, 1.2], [1.3, 0.2, 0, 0.95], [-1.0, 0.1, 0, 0.82], [0.4, 0.65, 0, 0.68]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[r as number, 7, 5]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/* ── Scene background ── */
function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color("#0A3D2E");
    return () => { scene.background = null; };
  }, [scene]);
  return null;
}

/* ── Full 3D Home Scene ── */
function HomeScene3D() {
  return (
    <>
      <SceneBackground />
      {/* Sky gradient planes */}
      <mesh position={[0, 12, -30]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[80, 40]} />
        <meshBasicMaterial color="#1A5C8A" />
      </mesh>
      <mesh position={[0, 22, -30]}>
        <planeGeometry args={[80, 20]} />
        <meshBasicMaterial color="#0D3B6E" />
      </mesh>

      {/* Lighting */}
      <hemisphereLight args={["#87CEEB", "#1A6B2A", 0.65]} />
      <directionalLight position={[8, 12, 5]} intensity={1.8} color="#FFF5E0" castShadow />
      <directionalLight position={[-5, 6, 3]} intensity={0.4} color="#7EC8E3" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#F59E0B" distance={10} />

      <fog attach="fog" args={["#0A3D2E", 22, 70]} />

      {/* Ground */}
      <PreviewGround />

      {/* Animated running character */}
      <Float speed={1.4} rotationIntensity={0} floatIntensity={0.4}>
        <PreviewCharacter />
      </Float>

      {/* Floating coins */}
      <FloatingCoin position={[-2.8, 1.2, -2]} delay={0} />
      <FloatingCoin position={[3.0, 1.6, -3]} delay={1.1} />
      <FloatingCoin position={[0.5, 2.0, -4.5]} delay={0.5} />
      <FloatingCoin position={[-1.8, 1.8, -5]} delay={2.0} />
      <FloatingCoin position={[2.2, 1.4, -1.5]} delay={0.8} />

      {/* Trees */}
      <PreviewTree position={[-5.5, -0.5, -3]} type={0} />
      <PreviewTree position={[5.2, -0.5, -4]} type={1} />
      <PreviewTree position={[-6.5, -0.5, -7]} type={0} />
      <PreviewTree position={[6.8, -0.5, -6]} type={0} />
      <PreviewTree position={[-4.8, -0.5, -9]} type={1} />
      <PreviewTree position={[5.5, -0.5, -9]} type={1} />

      {/* Clouds */}
      <CloudGroup position={[-8, 9, -20]} />
      <CloudGroup position={[5, 11, -25]} />
      <CloudGroup position={[-2, 10, -18]} />

      {/* Obstacles on path */}
      <mesh position={[-2.2, 0.0, -8]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#6B7280" roughness={0.9} />
      </mesh>
      <mesh position={[2.2, 0.26, -11]}>
        <cylinderGeometry args={[0.38, 0.34, 0.85, 12]} />
        <meshStandardMaterial color="#92400E" roughness={0.7} />
      </mesh>
    </>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const player = Storage.getPlayer();
  const session = Storage.getSession();

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <WebGLErrorBoundary fallback={
          <div className="w-full h-full bg-gradient-to-b from-sky-900 via-emerald-900 to-background" />
        }>
          <Suspense fallback={<div className="w-full h-full bg-background" />}>
            <Canvas
              camera={{ position: [0, 2.5, 7], fov: 62 }}
              shadows
              style={{ background: "transparent" }}
              gl={{ antialias: true }}
              dpr={[1, 1.5]}
            >
              <HomeScene3D />
            </Canvas>
          </Suspense>
        </WebGLErrorBoundary>
      </div>

      {/* Gradient overlay — stronger at bottom for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
      {/* Side vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_hsl(var(--background)/0.6)_100%)] pointer-events-none" />

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pt-16">
        {/* Top Logo */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <Logo />
        </motion.div>

        {/* Bottom Controls */}
        <motion.div
          className="w-full max-w-sm flex flex-col items-center gap-4 mb-4"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
        >
          {player && session === "player" && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15">
              <span className="text-base">👋</span>
              <span className="text-white/90 text-sm font-bold tracking-wide">Hey, {player.name}!</span>
            </div>
          )}

          {/* PLAY Button */}
          <motion.button
            data-testid="button-play"
            onClick={() => setLocation("/game")}
            className="relative w-full py-5 rounded-3xl text-3xl font-serif font-bold uppercase tracking-widest text-white overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, hsl(152 70% 38%), hsl(152 80% 28%))" }}
            whileTap={{ scale: 0.96 }}
            animate={{
              boxShadow: [
                "0 0 25px hsl(152 70% 38% / 0.6), 0 8px 32px rgba(0,0,0,0.5)",
                "0 0 50px hsl(152 70% 38% / 0.9), 0 8px 40px rgba(0,0,0,0.6)",
                "0 0 25px hsl(152 70% 38% / 0.6), 0 8px 32px rgba(0,0,0,0.5)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative z-10 drop-shadow-lg">PLAY</span>
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 0.6 }}
            />
          </motion.button>

          {/* Guest / Login */}
          {(!session || session === "guest") && (
            <div className="flex gap-3 w-full">
              <button
                data-testid="button-guest"
                onClick={() => Storage.setSession("guest")}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider border backdrop-blur-sm transition-all ${
                  session === "guest"
                    ? "bg-primary/30 border-primary/60 text-primary"
                    : "bg-black/30 border-white/15 text-white/70 hover:bg-black/40"
                }`}
              >
                Guest
              </button>
              <button
                data-testid="button-login"
                onClick={() => setLocation("/login")}
                className="flex-1 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider bg-secondary/25 border border-secondary/50 text-secondary hover:bg-secondary/35 backdrop-blur-sm transition-all"
              >
                Login
              </button>
            </div>
          )}

          <button
            data-testid="button-dashboard"
            onClick={() => setLocation("/dashboard")}
            className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white/80 transition-colors mt-1 backdrop-blur-sm"
          >
            Dashboard →
          </button>

          {/* Bottom quick nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex justify-center gap-1 w-full mt-2 pt-3 border-t border-white/10"
          >
            {[
              { icon: "📖", label: "How to Play", path: "/howtoplay" },
              { icon: "🏆", label: "Scores", path: "/leaderboard" },
              { icon: "⚙️", label: "Settings", path: "/settings" },
              { icon: "ℹ️", label: "About", path: "/about" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 transition-all"
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-white/50 text-[9px] font-bold uppercase tracking-wider leading-none">{item.label}</span>
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
