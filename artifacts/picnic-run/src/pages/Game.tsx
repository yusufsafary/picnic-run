import { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Storage } from "@/lib/storage";
import { playCoin, playJump, playGameOver } from "@/lib/audio";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { WebGLErrorBoundary } from "@/components/WebGLFallback";
import * as THREE from "three";

const LANES = [-2.2, 0, 2.2] as const;
const TILE_LENGTH = 14;
const NUM_TILES = 10;
const MAX_DISTANCE = 1200;
const PLAYER_Z = 1.5;

interface GameObj {
  id: number;
  lane: number;
  z: number;
  type?: number;
}

interface GameState {
  running: boolean;
  dead: boolean;
  speed: number;
  distance: number;
  coins: number;
  currentLane: number;
  targetLaneX: number;
  laneX: number;
  jumping: boolean;
  jumpTime: number;
  jumpY: number;
  sliding: boolean;
  slideTime: number;
  scaleY: number;
  obstacles: GameObj[];
  coinObjs: GameObj[];
  spawnTimer: number;
  coinSpawnTimer: number;
  startTime: number;
  idCounter: number;
  runTime: number;
  coinFlash: number;
}

function makeState(): GameState {
  return {
    running: false, dead: false,
    speed: 0.14, distance: 0, coins: 0,
    currentLane: 1, targetLaneX: 0, laneX: 0,
    jumping: false, jumpTime: 0, jumpY: 0,
    sliding: false, slideTime: 0, scaleY: 1,
    obstacles: [], coinObjs: [],
    spawnTimer: 0, coinSpawnTimer: 0,
    startTime: 0, idCounter: 0, runTime: 0, coinFlash: 0,
  };
}

/* ── Animated Character ── */
function RunnerCharacter({ state }: { state: React.MutableRefObject<GameState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    const gs = state.current;
    // Smooth X position
    groupRef.current.position.x += (gs.laneX - groupRef.current.position.x) * 0.22;
    groupRef.current.position.y = gs.jumpY;
    groupRef.current.scale.y = gs.scaleY;

    const t = gs.runTime;
    const spd = gs.speed * 5;
    if (gs.running && !gs.dead && !gs.sliding) {
      const swing = Math.sin(t * spd * Math.PI * 2) * 0.55;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;
      // Subtle body bob
      if (bodyRef.current) bodyRef.current.position.y = Math.abs(Math.sin(t * spd * Math.PI * 2)) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, PLAYER_Z]}>
      <group ref={bodyRef}>
        {/* Shadow blob */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.55, 16]} />
          <meshBasicMaterial color="#000000" opacity={0.25} transparent />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.65, 0]} castShadow>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <meshStandardMaterial color="#E8B887" roughness={0.8} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.98, 0]} castShadow>
          <boxGeometry args={[0.66, 0.18, 0.66]} />
          <meshStandardMaterial color="#4A2C0A" roughness={0.9} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.16, 1.68, 0.32]}><boxGeometry args={[0.12, 0.12, 0.04]} /><meshStandardMaterial color="#1C1C3A" /></mesh>
        <mesh position={[-0.16, 1.68, 0.32]}><boxGeometry args={[0.12, 0.12, 0.04]} /><meshStandardMaterial color="#1C1C3A" /></mesh>
        {/* Eye shine */}
        <mesh position={[0.19, 1.71, 0.335]}><boxGeometry args={[0.04, 0.04, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} /></mesh>
        <mesh position={[-0.13, 1.71, 0.335]}><boxGeometry args={[0.04, 0.04, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} /></mesh>
        {/* Smile */}
        <mesh position={[0, 1.56, 0.32]}><boxGeometry args={[0.22, 0.05, 0.03]} /><meshStandardMaterial color="#C06000" /></mesh>

        {/* Hoodie body */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.72, 0.8, 0.48]} />
          <meshStandardMaterial color="#F97316" roughness={0.7} />
        </mesh>
        {/* Hood stripe */}
        <mesh position={[0, 1.25, 0.25]}>
          <boxGeometry args={[0.4, 0.12, 0.05]} />
          <meshStandardMaterial color="#EA6300" roughness={0.7} />
        </mesh>
        {/* Kangaroo pocket */}
        <mesh position={[0, 0.82, 0.26]}>
          <boxGeometry args={[0.42, 0.26, 0.04]} />
          <meshStandardMaterial color="#EA6300" roughness={0.7} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[0.52, 1.1, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <boxGeometry args={[0.24, 0.55, 0.26]} />
            <meshStandardMaterial color="#F97316" roughness={0.7} />
          </mesh>
          {/* Glove */}
          <mesh position={[0, -0.58, 0]}><boxGeometry args={[0.24, 0.18, 0.24]} /><meshStandardMaterial color="#1E293B" roughness={0.5} /></mesh>
        </group>
        {/* Right Arm */}
        <group ref={rightArmRef} position={[-0.52, 1.1, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <boxGeometry args={[0.24, 0.55, 0.26]} />
            <meshStandardMaterial color="#F97316" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.58, 0]}><boxGeometry args={[0.24, 0.18, 0.24]} /><meshStandardMaterial color="#1E293B" roughness={0.5} /></mesh>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[0.2, 0.5, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[0.28, 0.65, 0.3]} />
            <meshStandardMaterial color="#2563EB" roughness={0.6} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.7, 0.08]}><boxGeometry args={[0.3, 0.18, 0.46]} /><meshStandardMaterial color="#111827" roughness={0.4} /></mesh>
          <mesh position={[0, -0.68, 0.3]}><boxGeometry args={[0.24, 0.1, 0.1]} /><meshStandardMaterial color="#F59E0B" roughness={0.5} /></mesh>
        </group>
        {/* Right Leg */}
        <group ref={rightLegRef} position={[-0.2, 0.5, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[0.28, 0.65, 0.3]} />
            <meshStandardMaterial color="#2563EB" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.7, 0.08]}><boxGeometry args={[0.3, 0.18, 0.46]} /><meshStandardMaterial color="#111827" roughness={0.4} /></mesh>
          <mesh position={[0, -0.68, 0.3]}><boxGeometry args={[0.24, 0.1, 0.1]} /><meshStandardMaterial color="#F59E0B" roughness={0.5} /></mesh>
        </group>
      </group>
    </group>
  );
}

/* ── Ground with track ── */
function Ground() {
  const tiles = useMemo(() => Array.from({ length: NUM_TILES }, (_, i) => i), []);
  const tileRefs = useRef<(THREE.Group | null)[]>([]);
  const offset = useRef(0);

  useFrame((_, delta) => {
    // not driven here — driven by GameLoop
  });

  return (
    <group>
      {tiles.map((i) => (
        <group key={i} ref={(el) => { tileRefs.current[i] = el; }} position={[0, -0.5, -(i * TILE_LENGTH)]}>
          {/* Grass base */}
          <mesh receiveShadow>
            <boxGeometry args={[22, 0.3, TILE_LENGTH]} />
            <meshStandardMaterial color="#1A6B2A" roughness={0.95} />
          </mesh>
          {/* Path dirt strip */}
          <mesh position={[0, 0.16, 0]} receiveShadow>
            <boxGeometry args={[6.4, 0.02, TILE_LENGTH]} />
            <meshStandardMaterial color="#8B6914" roughness={0.98} />
          </mesh>
          {/* Stone path */}
          <mesh position={[0, 0.17, 0]} receiveShadow>
            <boxGeometry args={[5.6, 0.02, TILE_LENGTH]} />
            <meshStandardMaterial color="#C2A05E" roughness={0.9} />
          </mesh>
          {/* Left grass edge detail */}
          <mesh position={[-3.8, 0.14, 0]}>
            <boxGeometry args={[0.3, 0.06, TILE_LENGTH]} />
            <meshStandardMaterial color="#22A83A" roughness={0.9} />
          </mesh>
          <mesh position={[3.8, 0.14, 0]}>
            <boxGeometry args={[0.3, 0.06, TILE_LENGTH]} />
            <meshStandardMaterial color="#22A83A" roughness={0.9} />
          </mesh>
          {/* Dashed lane dividers */}
          {[-2.2, 2.2].map((lx, j) => (
            <mesh key={j} position={[lx, 0.19, 0]}>
              <boxGeometry args={[0.07, 0.02, TILE_LENGTH * 0.9]} />
              <meshStandardMaterial color="#E8D5A0" opacity={0.5} transparent roughness={0.5} />
            </mesh>
          ))}
          {/* Center line */}
          <mesh position={[0, 0.19, 0]}>
            <boxGeometry args={[0.06, 0.02, TILE_LENGTH * 0.85]} />
            <meshStandardMaterial color="#E8D5A0" opacity={0.3} transparent />
          </mesh>
          {/* Stone texture variation dots */}
          {Array.from({ length: 6 }).map((_, k) => (
            <mesh key={k} position={[(k % 3 - 1) * 1.6, 0.19, (Math.floor(k / 3) - 0.5) * 4]}>
              <boxGeometry args={[0.8 + (k * 0.1), 0.01, 0.6 + (k * 0.05)]} />
              <meshStandardMaterial color={k % 2 === 0 ? "#BF9A50" : "#C8A85C"} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
      <GroundScroller tileRefs={tileRefs} />
    </group>
  );
}

function GroundScroller({ tileRefs }: { tileRefs: React.MutableRefObject<(THREE.Group | null)[]> }) {
  const offset = useRef(0);
  const { scene } = useThree();
  const stateRef = scene.userData.gameState as React.MutableRefObject<GameState> | undefined;

  useFrame((state, delta) => {
    const gs = (state.scene.userData.gameState as React.MutableRefObject<GameState>)?.current;
    if (!gs?.running) return;
    const move = gs.speed * 60 * delta;
    offset.current += move;
    tileRefs.current.forEach((tile, i) => {
      if (!tile) return;
      const total = NUM_TILES * TILE_LENGTH;
      const base = -(i * TILE_LENGTH);
      let z = (base + offset.current) % total;
      if (z > 3) z -= total;
      tile.position.z = z;
    });
  });
  return null;
}

/* ── Obstacles factory ── */
function makeObstacleMesh(type: number): THREE.Group {
  const g = new THREE.Group();
  if (type === 0) {
    // Rock pile
    const rockMat = new THREE.MeshStandardMaterial({ color: "#6B7280", roughness: 0.9, metalness: 0.1 });
    const r1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), rockMat);
    r1.position.set(0, 0.35, 0); r1.rotation.set(0.3, 0.7, 0.2);
    const r2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1), rockMat);
    r2.position.set(0.45, 0.2, 0.1); r2.rotation.set(0.8, 1.2, 0.5);
    const r3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), rockMat);
    r3.position.set(-0.4, 0.15, -0.1); r3.rotation.set(0.2, 0.5, 0.9);
    g.add(r1, r2, r3);
  } else if (type === 1) {
    // Barrel
    const barrelMat = new THREE.MeshStandardMaterial({ color: "#92400E", roughness: 0.7 });
    const bandMat = new THREE.MeshStandardMaterial({ color: "#7C3A0A", roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 1.0, 12), barrelMat);
    body.position.y = 0.52;
    const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.05, 8, 16), bandMat);
    band1.position.y = 0.75; band1.rotation.x = Math.PI / 2;
    const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.05, 8, 16), bandMat);
    band2.position.y = 0.3; band2.rotation.x = Math.PI / 2;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 12), bandMat);
    lid.position.y = 1.04;
    g.add(body, band1, band2, lid);
  } else if (type === 2) {
    // Fence
    const woodMat = new THREE.MeshStandardMaterial({ color: "#D97706", roughness: 0.85 });
    const darkWood = new THREE.MeshStandardMaterial({ color: "#B45309", roughness: 0.9 });
    // Posts
    [-0.55, 0.55].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.18), darkWood);
      post.position.set(x, 0.65, 0);
      g.add(post);
    });
    // Rails
    [0.35, 0.8].forEach(y => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.1), woodMat);
      rail.position.set(0, y, 0);
      g.add(rail);
    });
    // Picket tops
    [-0.55, 0.55].forEach(x => {
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), darkWood);
      top.position.set(x, 1.36, 0);
      g.add(top);
    });
  } else {
    // Hay bale
    const hayMat = new THREE.MeshStandardMaterial({ color: "#D4A017", roughness: 0.95 });
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.1, 12), hayMat);
    bale.rotation.z = Math.PI / 2; bale.position.y = 0.52;
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.04, 6, 14), new THREE.MeshStandardMaterial({ color: "#A07000", roughness: 0.9 }));
    ring1.position.y = 0.52; ring1.rotation.y = Math.PI / 2;
    const ring2 = ring1.clone(); ring2.position.z = 0.3;
    const ring3 = ring1.clone(); ring3.position.z = -0.3;
    g.add(bale, ring1, ring2, ring3);
  }
  return g;
}

/* ── Coin mesh factory ── */
function makeCoinMesh(): THREE.Group {
  const g = new THREE.Group();
  const coinMat = new THREE.MeshStandardMaterial({
    color: "#F59E0B", metalness: 0.95, roughness: 0.05,
    emissive: "#F59E0B", emissiveIntensity: 0.6,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: "#FBBF24", metalness: 0.9, roughness: 0.1,
    emissive: "#FBBF24", emissiveIntensity: 0.4,
  });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16), coinMat);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 6, 16), edgeMat);
  edge.rotation.x = Math.PI / 2;
  const shine = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), new THREE.MeshStandardMaterial({ color: "#FFF8DC", emissive: "#FFF8DC", emissiveIntensity: 1, transparent: true, opacity: 0.8 }));
  shine.position.set(0.06, 0.06, 0); shine.rotation.x = -Math.PI / 2; shine.position.y = 0.06;
  const light = new THREE.PointLight("#F59E0B", 1.2, 2.5);
  g.add(disk, edge, shine, light);
  return g;
}

/* ── Tree factory ── */
function makeTree(type: number): THREE.Group {
  const g = new THREE.Group();
  if (type === 0) {
    // Pine tree
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#713F12", roughness: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6, 7), trunkMat);
    trunk.position.y = 0.55;
    const foliageMat = new THREE.MeshStandardMaterial({ color: "#15803D", roughness: 0.85 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: "#166534", roughness: 0.9 });
    const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 8), foliageMat);
    tier1.position.y = 2.0;
    const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.5, 8), foliageMat);
    tier2.position.y = 3.1;
    const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 8), foliageMat2);
    tier3.position.y = 4.0;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 7), foliageMat2);
    tip.position.y = 4.8;
    g.add(trunk, tier1, tier2, tier3, tip);
  } else if (type === 1) {
    // Oak tree
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#78350F", roughness: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 2.4, 8), trunkMat);
    trunk.position.y = 0.9;
    const foliageMat = new THREE.MeshStandardMaterial({ color: "#16A34A", roughness: 0.8 });
    const blob1 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), foliageMat);
    blob1.position.y = 3.2; blob1.position.x = 0.2;
    const blob2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshStandardMaterial({ color: "#15803D", roughness: 0.8 }));
    blob2.position.set(-0.6, 2.8, 0.3);
    const blob3 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshStandardMaterial({ color: "#166534", roughness: 0.85 }));
    blob3.position.set(0.5, 3.6, -0.3);
    g.add(trunk, blob1, blob2, blob3);
  } else {
    // Mushroom / bush
    const stemMat = new THREE.MeshStandardMaterial({ color: "#E5D5C0", roughness: 0.9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8), stemMat);
    stem.position.y = 0.25;
    const capMat = new THREE.MeshStandardMaterial({ color: "#DC2626", roughness: 0.7 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8), capMat);
    cap.scale.y = 0.6; cap.position.y = 0.85;
    const dotMat = new THREE.MeshStandardMaterial({ color: "#FFF", roughness: 0.5 });
    [[-0.25, 0.08, 0.6], [0.28, 0.2, 0.58], [-0.1, 0.45, 0.62]].forEach(([x, y, z]) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), dotMat);
      dot.position.set(x as number, (y as number) + 0.85, z as number);
      g.add(dot);
    });
    g.add(stem, cap);
  }
  return g;
}

/* ── Dust particle system ── */
function DustParticles({ state }: { state: React.MutableRefObject<GameState> }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.8;
      arr[i * 3 + 1] = -0.3 - Math.random() * 0.3;
      arr[i * 3 + 2] = Math.random() * 2 - 4;
    }
    return arr;
  }, []);
  const phases = useMemo(() => Array.from({ length: 60 }, () => Math.random() * Math.PI * 2), []);

  useFrame((_, delta) => {
    const gs = state.current;
    if (!gs.running || gs.dead) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    gs.runTime += delta;
    for (let i = 0; i < 60; i++) {
      const t = (gs.runTime + phases[i]) % 1.5;
      pos.setXYZ(i,
        gs.laneX + (Math.random() - 0.5) * 0.7,
        -0.35 + t * 0.4,
        PLAYER_Z - 0.5 - t * 1.2
      );
    }
    pos.needsUpdate = true;
    pointsRef.current.material.opacity = Math.min(0.5, gs.speed * 2);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={60} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#D4A76A" transparent opacity={0.3} depthWrite={false} />
    </points>
  );
}

/* ── Skybox gradient background ── */
function SkyGradient() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color("#0A3D2E");
    return () => { scene.background = null; };
  }, [scene]);
  return null;
}

/* ── Cloud ── */
function CloudPuff({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[[0, 0, 0, 1.2], [1.2, 0.2, 0, 1.0], [-1.0, 0.1, 0, 0.85], [0.4, 0.6, 0, 0.7]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[r as number, 7, 5]} />
          <meshStandardMaterial color="#E8F4F0" opacity={0.85} transparent roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Main Game Scene ── */
function GameScene({
  state, onCoin, onDie,
}: {
  state: React.MutableRefObject<GameState>;
  onCoin: () => void;
  onDie: () => void;
}) {
  const { scene } = useThree();
  const obstacleGroupRef = useRef<THREE.Group>(null!);
  const coinGroupRef = useRef<THREE.Group>(null!);
  const treeGroupRef = useRef<THREE.Group>(null!);
  const obstacleMeshes = useRef<{ group: THREE.Group; id: number; lane: number; z: number }[]>([]);
  const coinMeshes = useRef<{ group: THREE.Group; id: number; lane: number; z: number }[]>([]);
  const sunRef = useRef<THREE.DirectionalLight>(null!);

  // Register state so GroundScroller can access it
  useEffect(() => {
    scene.userData.gameState = state;
    return () => { delete scene.userData.gameState; };
  }, [scene, state]);

  useFrame((_, delta) => {
    const gs = state.current;
    if (!gs.running || gs.dead) return;

    const move = gs.speed * 60 * delta;

    gs.speed = Math.min(0.35, gs.speed + 0.000018);
    gs.distance += move * 1.5;
    gs.laneX += (gs.targetLaneX - gs.laneX) * 0.2;
    gs.runTime += delta;
    if (gs.coinFlash > 0) gs.coinFlash -= delta;

    // Jump physics
    if (gs.jumping) {
      gs.jumpTime += delta;
      const t = gs.jumpTime / 0.58;
      gs.jumpY = t < 1 ? Math.sin(t * Math.PI) * 2.4 : 0;
      if (gs.jumpTime >= 0.58) { gs.jumping = false; gs.jumpTime = 0; gs.jumpY = 0; }
    }
    // Slide
    if (gs.sliding) {
      gs.slideTime += delta;
      gs.scaleY = 0.5;
      if (gs.slideTime >= 0.58) { gs.sliding = false; gs.slideTime = 0; gs.scaleY = 1; }
    }

    // Spawn timers
    gs.spawnTimer += delta;
    gs.coinSpawnTimer += delta;

    // Spawn obstacles
    if (gs.spawnTimer > 1.0 / gs.speed) {
      gs.spawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const type = Math.floor(Math.random() * 4);
      const obGrp = makeObstacleMesh(type);
      obGrp.position.set(LANES[lane], 0, -68);
      obstacleGroupRef.current?.add(obGrp);
      obstacleMeshes.current.push({ group: obGrp, id: gs.idCounter++, lane, z: -68 });
    }

    // Spawn coins
    if (gs.coinSpawnTimer > 0.42 / gs.speed) {
      gs.coinSpawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const coinGrp = makeCoinMesh();
      coinGrp.position.set(LANES[lane], 0.55, -68);
      coinGroupRef.current?.add(coinGrp);
      coinMeshes.current.push({ group: coinGrp, id: gs.idCounter++, lane, z: -68 });
    }

    // Spawn trees (every ~2.5s)
    if (Math.random() < delta * gs.speed * 18) {
      const side = Math.random() > 0.5 ? 6.5 : -6.5;
      const type = Math.floor(Math.random() * 3);
      const t = makeTree(type);
      const scale = 0.8 + Math.random() * 0.6;
      t.scale.set(scale, scale, scale);
      t.position.set(side + (Math.random() - 0.5) * 2, -0.5, -70);
      treeGroupRef.current?.add(t);
    }

    // Move obstacles
    for (let i = obstacleMeshes.current.length - 1; i >= 0; i--) {
      const ob = obstacleMeshes.current[i];
      ob.group.position.z += move;
      ob.z = ob.group.position.z;
      if (ob.z > 15) {
        obstacleGroupRef.current?.remove(ob.group);
        obstacleMeshes.current.splice(i, 1);
      }
    }

    // Move coins & spin
    for (let i = coinMeshes.current.length - 1; i >= 0; i--) {
      const c = coinMeshes.current[i];
      c.group.position.z += move;
      c.group.rotation.y += delta * 3.5;
      // Hover bob
      c.group.position.y = 0.55 + Math.sin(gs.runTime * 4 + i) * 0.15;
      c.z = c.group.position.z;
      if (c.z > 15) {
        coinGroupRef.current?.remove(c.group);
        coinMeshes.current.splice(i, 1);
      }
    }

    // Move trees
    for (let i = treeGroupRef.current.children.length - 1; i >= 0; i--) {
      const t = treeGroupRef.current.children[i];
      t.position.z += move;
      if (t.position.z > 12) treeGroupRef.current.remove(t);
    }

    // Collision detection
    const px = gs.laneX;
    const py = gs.jumpY;
    const ps = gs.scaleY;
    const playerH = 2.0 * ps;

    for (const ob of obstacleMeshes.current) {
      const oz = ob.group.position.z;
      const ox = ob.group.position.x;
      if (Math.abs(oz - PLAYER_Z) < 1.1 && Math.abs(ox - px) < 0.9) {
        const obstacleTop = 1.2;
        const playerBottom = py;
        const playerTop = py + playerH;
        if (!(playerTop < 0 || playerBottom > obstacleTop + 0.1)) {
          if (!gs.dead) {
            gs.dead = true;
            playGameOver();
            onDie();
          }
        }
      }
    }

    // Coin collection
    for (let i = coinMeshes.current.length - 1; i >= 0; i--) {
      const c = coinMeshes.current[i];
      const cz = c.group.position.z;
      const cx = c.group.position.x;
      const cy = c.group.position.y;
      if (Math.abs(cz - PLAYER_Z) < 1.1 && Math.abs(cx - px) < 1.0 && Math.abs(cy - (py + 0.9)) < 1.4) {
        coinGroupRef.current?.remove(c.group);
        coinMeshes.current.splice(i, 1);
        gs.coins += 1;
        gs.coinFlash = 0.25;
        playCoin();
        onCoin();
      }
    }

    // Sun shimmer
    if (sunRef.current) {
      sunRef.current.intensity = 2.0 + Math.sin(gs.runTime * 0.5) * 0.15;
    }

    // Win
    if (gs.distance >= MAX_DISTANCE && !gs.dead) { gs.dead = true; onDie(); }
  });

  return (
    <>
      <SkyGradient />

      {/* Atmosphere gradient - large sky plane */}
      <mesh position={[0, 15, -80]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[200, 80]} />
        <meshBasicMaterial color="#0A3D2E" />
      </mesh>
      <mesh position={[0, 30, -80]}>
        <planeGeometry args={[200, 60]} />
        <meshBasicMaterial color="#1A5C8A" />
      </mesh>

      {/* Lighting rig */}
      <hemisphereLight args={["#87CEEB", "#1A6B2A", 0.7]} />
      <directionalLight
        ref={sunRef}
        position={[8, 14, 4]}
        intensity={2.0}
        color="#FFF5E0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {/* Rim light from left */}
      <directionalLight position={[-6, 4, 2]} intensity={0.5} color="#7EC8E3" />
      {/* Warm fill from below */}
      <pointLight position={[0, -1, 3]} intensity={0.4} color="#F59E0B" distance={8} />

      <fog attach="fog" args={["#0A3D2E", 30, 90]} />

      {/* Static clouds */}
      <CloudPuff position={[-12, 12, -55]} />
      <CloudPuff position={[10, 14, -65]} />
      <CloudPuff position={[-5, 11, -75]} />
      <CloudPuff position={[18, 13, -50]} />

      {/* Ground */}
      <Ground />

      {/* Player */}
      <RunnerCharacter state={state} />

      {/* Dynamic objects */}
      <group ref={obstacleGroupRef} />
      <group ref={coinGroupRef} />
      <group ref={treeGroupRef} />

      {/* Dust particles */}
      <DustParticles state={state} />
    </>
  );
}

/* ── HUD ── */
function GameHUD({
  coins, distance, paused, speed, coinFlash,
  onPause, onResume, onQuit,
}: {
  coins: number; distance: number; paused: boolean; speed: number; coinFlash: boolean;
  onPause: () => void; onResume: () => void; onQuit: () => void;
}) {
  const pct = Math.min(distance / MAX_DISTANCE, 1);
  const speedPct = Math.min(speed / 0.35, 1);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-4 pt-safe-top pb-2 pointer-events-none" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        {/* Coin counter */}
        <motion.div
          animate={{ scale: coinFlash ? [1, 1.25, 1] : 1, backgroundColor: coinFlash ? ["rgba(0,0,0,0.5)", "rgba(245,158,11,0.4)", "rgba(0,0,0,0.5)"] : "rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 backdrop-blur-sm rounded-2xl px-3 py-2 pointer-events-none border border-white/10"
        >
          <span className="text-xl">🪙</span>
          <motion.span
            key={coins}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-yellow-300 font-serif text-xl font-bold drop-shadow-lg"
          >
            {coins}
          </motion.span>
        </motion.div>

        {/* Progress bar */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${pct * 100}%`,
                background: "linear-gradient(90deg, #16A34A, #22C55E, #86EFAC)"
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between px-1">
            <span className="text-white/60 text-[10px] font-bold">{Math.floor(distance)}m</span>
            <span className="text-white/40 text-[10px] font-bold">{MAX_DISTANCE}m</span>
          </div>
        </div>

        {/* Speed gauge */}
        <div className="flex flex-col items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-2xl px-2.5 py-2 border border-white/10">
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">SPD</span>
          <div className="w-6 h-12 bg-black/40 rounded-full overflow-hidden flex flex-col-reverse border border-white/20">
            <motion.div
              className="w-full rounded-full"
              style={{
                height: `${speedPct * 100}%`,
                background: speedPct > 0.8 ? "linear-gradient(0deg, #EF4444, #F97316)" : "linear-gradient(0deg, #16A34A, #22C55E)"
              }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Pause button */}
        <button
          data-testid="button-pause"
          onClick={onPause}
          className="pointer-events-auto bg-black/50 backdrop-blur-sm rounded-2xl w-11 h-11 flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-colors text-lg"
        >
          ⏸
        </button>
      </div>

      {/* Pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <h2 className="font-serif text-5xl text-white font-bold uppercase tracking-wider drop-shadow-xl">Paused</h2>
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">{Math.floor(distance)}m — {coins} coins</p>
              <div className="flex flex-col gap-3 w-52">
                <button data-testid="button-resume" onClick={onResume}
                  className="py-4 rounded-2xl font-serif text-2xl font-bold uppercase tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 25px #16A34A55" }}>
                  Resume
                </button>
                <button data-testid="button-quit" onClick={onQuit}
                  className="py-4 rounded-2xl font-bold text-lg uppercase tracking-wider bg-white/10 border border-white/20 text-white/80">
                  Quit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed lines overlay when fast */}
      {speedPct > 0.7 && !paused && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/5 rounded-full"
              style={{
                left: `${10 + i * 11}%`, top: 0, bottom: 0, width: 1,
              }}
              animate={{ opacity: [0, 0.4, 0], scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 0.4 + i * 0.07, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Game Page ── */
export default function Game() {
  const [, setLocation] = useLocation();
  const stateRef = useRef<GameState>(makeState());
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [displayCoinFlash, setDisplayCoinFlash] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // HUD ticker
  useEffect(() => {
    const tick = () => {
      const gs = stateRef.current;
      setDisplayCoins(gs.coins);
      setDisplayDistance(Math.floor(gs.distance));
      setDisplaySpeed(gs.speed);
      setDisplayCoinFlash(gs.coinFlash > 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Tutorial & start
  useEffect(() => {
    if (!Storage.getTutorial()) setShowTutorial(true);
    else startGame();
  }, []); // eslint-disable-line

  const startGame = useCallback(() => {
    stateRef.current = makeState();
    stateRef.current.running = true;
    stateRef.current.startTime = Date.now();
    setGameStarted(true);
    setDisplayCoins(0);
    setDisplayDistance(0);
    setPaused(false);
  }, []);

  const handleTutorialComplete = useCallback(() => {
    Storage.setTutorial(true);
    setShowTutorial(false);
    startGame();
  }, [startGame]);

  const handleDie = useCallback(() => {
    const gs = stateRef.current;
    Storage.setLastRun({ coins: gs.coins, distance: Math.floor(gs.distance), time: Date.now() - gs.startTime });
    setTimeout(() => setLocation("/results"), 1100);
  }, [setLocation]);

  const handleCoin = useCallback(() => setDisplayCoins(c => c + 1), []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      const gs = stateRef.current;
      if (!gs.running) return;
      if (e.code === "ArrowLeft" && gs.currentLane > 0) { gs.currentLane--; gs.targetLaneX = LANES[gs.currentLane]; }
      if (e.code === "ArrowRight" && gs.currentLane < 2) { gs.currentLane++; gs.targetLaneX = LANES[gs.currentLane]; }
      if ((e.code === "Space" || e.code === "ArrowUp") && !gs.jumping && !gs.sliding) {
        e.preventDefault(); gs.jumping = true; gs.jumpTime = 0; playJump();
      }
      if ((e.code === "ArrowDown" || e.code === "KeyS") && !gs.sliding && !gs.jumping) {
        gs.sliding = true; gs.slideTime = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch
  const onPointerDown = (e: React.PointerEvent) => { touchStart.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!touchStart.current || pausedRef.current) return;
    const dx = e.clientX - touchStart.current.x;
    const dy = e.clientY - touchStart.current.y;
    const gs = stateRef.current;
    if (!gs.running) return;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -25 && gs.currentLane > 0) { gs.currentLane--; gs.targetLaneX = LANES[gs.currentLane]; }
      else if (dx > 25 && gs.currentLane < 2) { gs.currentLane++; gs.targetLaneX = LANES[gs.currentLane]; }
    } else {
      if (dy < -30 && !gs.jumping && !gs.sliding) { gs.jumping = true; gs.jumpTime = 0; playJump(); }
      else if (dy > 30 && !gs.sliding && !gs.jumping) { gs.sliding = true; gs.slideTime = 0; }
    }
    touchStart.current = null;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none"
      onPointerDown={onPointerDown} onPointerUp={onPointerUp}>

      <WebGLErrorBoundary fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-4">
          <span className="text-5xl">🎮</span>
          <p className="text-foreground font-serif text-xl">WebGL not available</p>
          <button onClick={() => setLocation("/home")} className="text-muted-foreground text-sm font-bold uppercase tracking-widest">← Back</button>
        </div>
      }>
        <Suspense fallback={
          <div className="absolute inset-0 bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <motion.div className="text-5xl" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>🍃</motion.div>
              <span className="text-foreground font-serif text-xl font-bold">Loading game...</span>
            </div>
          </div>
        }>
          <Canvas
            camera={{ position: [0, 3.2, 8], fov: 60, near: 0.1, far: 130 }}
            shadows
            style={{ position: "absolute", inset: 0 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            dpr={[1, 1.5]}
          >
            {gameStarted && (
              <GameScene state={stateRef} onCoin={handleCoin} onDie={handleDie} />
            )}
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>

      {gameStarted && !showTutorial && (
        <GameHUD
          coins={displayCoins}
          distance={displayDistance}
          paused={paused}
          speed={displaySpeed}
          coinFlash={displayCoinFlash}
          onPause={() => { setPaused(true); stateRef.current.running = false; }}
          onResume={() => { setPaused(false); stateRef.current.running = true; }}
          onQuit={() => setLocation("/home")}
        />
      )}

      <AnimatePresence>
        {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
      </AnimatePresence>
    </div>
  );
}
