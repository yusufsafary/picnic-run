import { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Storage } from "@/lib/storage";
import { playCoin, playJump, playGameOver, playLaneSwitch, playSlide, playMilestone, playCombo, playMagnetPickup, startBgMusic, stopBgMusic } from "@/lib/audio";
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

interface CoinBurst {
  id: number;
  x: number;
  y: number;
  time: number;
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
  screenShake: number;
  coinBursts: CoinBurst[];
  combo: number;
  comboTimer: number;
  lastCoinTime: number;
  milestonesHit: number[];
  magnetActive: boolean;
  magnetTimer: number;
  magnetObjs: GameObj[];
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
    screenShake: 0, coinBursts: [],
    combo: 0, comboTimer: 0, lastCoinTime: 0,
    milestonesHit: [], magnetActive: false, magnetTimer: 0, magnetObjs: [],
  };
}

/* ═══════════════════════════════════════════
   RUNNER CHARACTER — COINCAR gold theme
═══════════════════════════════════════════ */
function RunnerCharacter({ state }: { state: React.MutableRefObject<GameState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const coinHelmetRef = useRef<THREE.Mesh>(null!);

  // Shared materials to avoid re-creation
  const skinMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E8B887", roughness: 0.75 }), []);
  const hairMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2A1A06", roughness: 0.95 }), []);
  const jacketMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1E3A5F", roughness: 0.65 }), []);
  const goldMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F59E0B", metalness: 0.9, roughness: 0.15, emissive: "#F59E0B", emissiveIntensity: 0.35 }), []);
  const pantsMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0F172A", roughness: 0.7 }), []);
  const shoeMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1E293B", roughness: 0.4 }), []);
  const eyeMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0A0A2A" }), []);
  const shineMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#fff", emissiveIntensity: 1 }), []);

  useFrame((_, delta) => {
    const gs = state.current;
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
      if (bodyRef.current) bodyRef.current.position.y = Math.abs(Math.sin(t * spd * Math.PI * 2)) * 0.07;
    }
    if (coinHelmetRef.current) coinHelmetRef.current.rotation.y += delta * 1.4;
  });

  return (
    <group ref={groupRef} position={[0, 0, PLAYER_Z]}>
      {/* Shadow */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color="#000" opacity={0.22} transparent />
      </mesh>

      <group ref={bodyRef}>
        {/* === HEAD === */}
        <mesh position={[0, 1.65, 0]} castShadow material={skinMat}>
          <boxGeometry args={[0.64, 0.64, 0.64]} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 2.0, 0]} castShadow material={hairMat}>
          <boxGeometry args={[0.68, 0.2, 0.68]} />
        </mesh>
        {/* Coin helmet visor */}
        <mesh ref={coinHelmetRef} position={[0, 2.24, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.12, 16]} />
          <primitive object={goldMat} attach="material" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.17, 1.68, 0.33]} material={eyeMat}><boxGeometry args={[0.13, 0.13, 0.04]} /></mesh>
        <mesh position={[-0.17, 1.68, 0.33]} material={eyeMat}><boxGeometry args={[0.13, 0.13, 0.04]} /></mesh>
        {/* Eye shine */}
        <mesh position={[0.20, 1.72, 0.34]} material={shineMat}><boxGeometry args={[0.045, 0.045, 0.02]} /></mesh>
        <mesh position={[-0.14, 1.72, 0.34]} material={shineMat}><boxGeometry args={[0.045, 0.045, 0.02]} /></mesh>
        {/* Smile */}
        <mesh position={[0, 1.54, 0.34]}>
          <boxGeometry args={[0.22, 0.05, 0.03]} />
          <meshStandardMaterial color="#C06000" />
        </mesh>

        {/* === TORSO === */}
        <mesh position={[0, 0.9, 0]} castShadow material={jacketMat}>
          <boxGeometry args={[0.74, 0.82, 0.5]} />
        </mesh>
        {/* Gold trim on collar */}
        <mesh position={[0, 1.28, 0.26]}>
          <boxGeometry args={[0.5, 0.1, 0.05]} />
          <primitive object={goldMat} attach="material" />
        </mesh>
        {/* "C" logo on chest */}
        <mesh position={[0, 0.9, 0.27]}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
          <primitive object={goldMat} attach="material" />
        </mesh>

        {/* === ARMS === */}
        <group ref={leftArmRef} position={[0.54, 1.12, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow material={jacketMat}>
            <boxGeometry args={[0.25, 0.56, 0.27]} />
          </mesh>
          {/* Gold glove */}
          <mesh position={[0, -0.6, 0]}>
            <boxGeometry args={[0.26, 0.2, 0.26]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[-0.54, 1.12, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow material={jacketMat}>
            <boxGeometry args={[0.25, 0.56, 0.27]} />
          </mesh>
          <mesh position={[0, -0.6, 0]}>
            <boxGeometry args={[0.26, 0.2, 0.26]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        </group>

        {/* === LEGS === */}
        <group ref={leftLegRef} position={[0.2, 0.5, 0]}>
          <mesh position={[0, -0.29, 0]} castShadow material={pantsMat}>
            <boxGeometry args={[0.29, 0.66, 0.31]} />
          </mesh>
          <mesh position={[0, -0.71, 0.09]} material={shoeMat}>
            <boxGeometry args={[0.31, 0.19, 0.48]} />
          </mesh>
          {/* Gold sole stripe */}
          <mesh position={[0, -0.8, 0.28]}>
            <boxGeometry args={[0.25, 0.06, 0.12]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[-0.2, 0.5, 0]}>
          <mesh position={[0, -0.29, 0]} castShadow material={pantsMat}>
            <boxGeometry args={[0.29, 0.66, 0.31]} />
          </mesh>
          <mesh position={[0, -0.71, 0.09]} material={shoeMat}>
            <boxGeometry args={[0.31, 0.19, 0.48]} />
          </mesh>
          <mesh position={[0, -0.8, 0.28]}>
            <boxGeometry args={[0.25, 0.06, 0.12]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════
   GROUND — Dark asphalt road, glowing markings
═══════════════════════════════════════════ */
function Ground() {
  const tiles = useMemo(() => Array.from({ length: NUM_TILES }, (_, i) => i), []);
  const tileRefs = useRef<(THREE.Group | null)[]>([]);

  // Shared materials
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1A5C28", roughness: 0.96 }), []);
  const sidewalkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3D3D3D", roughness: 0.85 }), []);
  const asphaltMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1A1A1A", roughness: 0.92 }), []);
  const laneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F59E0B", emissive: "#F59E0B", emissiveIntensity: 0.45, roughness: 0.4 }), []);
  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.25, roughness: 0.5, transparent: true, opacity: 0.7 }), []);
  const edgeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.3, roughness: 0.4 }), []);

  return (
    <group>
      {tiles.map((i) => (
        <group key={i} ref={(el) => { tileRefs.current[i] = el; }} position={[0, -0.5, -(i * TILE_LENGTH)]}>
          {/* Grass base wide */}
          <mesh receiveShadow material={grassMat}>
            <boxGeometry args={[30, 0.3, TILE_LENGTH]} />
          </mesh>
          {/* Sidewalk strips */}
          <mesh position={[-4.0, 0.16, 0]} receiveShadow material={sidewalkMat}>
            <boxGeometry args={[2.0, 0.04, TILE_LENGTH]} />
          </mesh>
          <mesh position={[4.0, 0.16, 0]} receiveShadow material={sidewalkMat}>
            <boxGeometry args={[2.0, 0.04, TILE_LENGTH]} />
          </mesh>
          {/* Main asphalt road */}
          <mesh position={[0, 0.17, 0]} receiveShadow material={asphaltMat}>
            <boxGeometry args={[5.8, 0.04, TILE_LENGTH]} />
          </mesh>
          {/* White edge lines */}
          <mesh position={[-2.9, 0.22, 0]} material={edgeMat}>
            <boxGeometry args={[0.08, 0.02, TILE_LENGTH]} />
          </mesh>
          <mesh position={[2.9, 0.22, 0]} material={edgeMat}>
            <boxGeometry args={[0.08, 0.02, TILE_LENGTH]} />
          </mesh>
          {/* Gold lane dividers (dashed) */}
          {[-2.2, 2.2].map((lx, j) => (
            Array.from({ length: 5 }).map((_, k) => (
              <mesh key={`${j}-${k}`} position={[lx, 0.22, k * 2.8 - 5.6]} material={laneMat}>
                <boxGeometry args={[0.1, 0.02, 1.4]} />
              </mesh>
            ))
          ))}
          {/* Center dashed line */}
          {Array.from({ length: 5 }).map((_, k) => (
            <mesh key={k} position={[0, 0.22, k * 2.8 - 5.6]} material={centerMat}>
              <boxGeometry args={[0.07, 0.02, 1.1]} />
            </mesh>
          ))}
          {/* Asphalt variation patches */}
          {Array.from({ length: 4 }).map((_, k) => (
            <mesh key={k} position={[(k % 2 - 0.5) * 2.4, 0.19, (Math.floor(k / 2) - 0.5) * 5]}>
              <boxGeometry args={[1.5, 0.015, 2.0]} />
              <meshStandardMaterial color={k % 2 === 0 ? "#1E1E1E" : "#161616"} roughness={0.9} />
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

/* ═══════════════════════════════════════════
   OBSTACLES — 5 types with vivid designs
═══════════════════════════════════════════ */
function makeObstacleMesh(type: number): THREE.Group {
  const g = new THREE.Group();

  if (type === 0) {
    // Rock pile — granite with variation
    const rockColors = ["#52525B", "#71717A", "#6B7280"];
    [
      [0, 0.38, 0, 0.55],
      [0.48, 0.22, 0.1, 0.38],
      [-0.42, 0.18, -0.1, 0.32],
      [0.12, 0.55, 0.2, 0.28],
    ].forEach(([x, y, z, r], i) => {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        new THREE.MeshStandardMaterial({ color: rockColors[i % 3], roughness: 0.88, metalness: 0.08 })
      );
      m.position.set(x, y, z); m.rotation.set(i * 0.7, i * 1.2, i * 0.4);
      g.add(m);
    });
    // Moss green highlight
    const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), new THREE.MeshStandardMaterial({ color: "#22C55E", roughness: 0.9 }));
    moss.position.set(-0.1, 0.85, 0.1); g.add(moss);

  } else if (type === 1) {
    // Glowing toxic barrel
    const barrelMat = new THREE.MeshStandardMaterial({ color: "#7C3D0A", roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.4, 1.05, 14), barrelMat);
    body.position.y = 0.54;
    const toxicMat = new THREE.MeshStandardMaterial({ color: "#84CC16", emissive: "#84CC16", emissiveIntensity: 0.9, roughness: 0.4 });
    const bandMat = new THREE.MeshStandardMaterial({ color: "#A3E635", metalness: 0.5, roughness: 0.3, emissive: "#A3E635", emissiveIntensity: 0.4 });
    [0.76, 0.31].forEach(y => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.055, 8, 18), bandMat);
      band.position.y = y; band.rotation.x = Math.PI / 2; g.add(band);
    });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.09, 14), bandMat);
    lid.position.y = 1.07;
    // Warning X mark
    const xMat = new THREE.MeshStandardMaterial({ color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 0.6 });
    const x1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), xMat);
    x1.position.set(0, 0.54, 0.45); x1.rotation.z = Math.PI / 4;
    const x2 = x1.clone(); x2.rotation.z = -Math.PI / 4;
    // Toxic glow light
    const glow = new THREE.PointLight("#84CC16", 1.8, 3.5);
    glow.position.y = 0.8;
    g.add(body, lid, x1, x2, glow);

  } else if (type === 2) {
    // Neon warning barrier
    const postMat = new THREE.MeshStandardMaterial({ color: "#DC2626", roughness: 0.6 });
    const barMat = new THREE.MeshStandardMaterial({ color: "#F97316", emissive: "#F97316", emissiveIntensity: 0.55, roughness: 0.3 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: "#1E293B", roughness: 0.7 });
    [-0.6, 0.6].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), postMat);
      post.position.set(x, 0.7, 0); g.add(post);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 6), new THREE.MeshStandardMaterial({ color: "#FACC15", emissive: "#FACC15", emissiveIntensity: 0.7 }));
      top.position.set(x, 1.45, 0); g.add(top);
    });
    [0.85, 0.45].forEach(y => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.13, 0.13), barMat);
      bar.position.y = y; g.add(bar);
      // Diagonal stripes
      [-.4, 0, .4].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.14), stripeMat);
        stripe.position.set(sx, y, 0); g.add(stripe);
      });
    });
    const gl = new THREE.PointLight("#F97316", 1.5, 3); gl.position.y = 1; g.add(gl);

  } else if (type === 3) {
    // Giant hay bale — warm golden
    const hayMat = new THREE.MeshStandardMaterial({ color: "#D97706", roughness: 0.92 });
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 1.15, 14), hayMat);
    bale.rotation.z = Math.PI / 2; bale.position.y = 0.56;
    const bandMat = new THREE.MeshStandardMaterial({ color: "#92400E", roughness: 0.85 });
    [0, 0.35, -0.35].forEach(z => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.045, 6, 16), bandMat);
      ring.position.set(0, 0.56, z); ring.rotation.y = Math.PI / 2; g.add(ring);
    });
    g.add(bale);

  } else {
    // Spinning coin wall — very dramatic
    const wallMat = new THREE.MeshStandardMaterial({ color: "#1E3A5F", roughness: 0.6, metalness: 0.4 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 0.18), wallMat);
    wall.position.y = 0.8; g.add(wall);
    const spikeMat = new THREE.MeshStandardMaterial({ color: "#F59E0B", emissive: "#F59E0B", emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.1 });
    [[-0.45, 1.4], [0.45, 1.4], [-0.45, 0.25], [0.45, 0.25], [0, 0.82]].forEach(([x, y]) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 5), spikeMat);
      spike.position.set(x as number, y as number, 0.11); spike.rotation.x = -Math.PI / 2; g.add(spike);
    });
    const glow2 = new THREE.PointLight("#F59E0B", 1.2, 3.5); glow2.position.y = 0.8; g.add(glow2);
  }

  return g;
}

/* ═══════════════════════════════════════════
   COIN — Large, brilliant, magnetic feel
═══════════════════════════════════════════ */
function makeCoinMesh(): THREE.Group {
  const g = new THREE.Group();
  const faceMat = new THREE.MeshStandardMaterial({
    color: "#FBBF24", metalness: 0.98, roughness: 0.04,
    emissive: "#F59E0B", emissiveIntensity: 0.7,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: "#F59E0B", metalness: 0.95, roughness: 0.08,
    emissive: "#F59E0B", emissiveIntensity: 0.5,
  });
  // Big coin body
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 20), faceMat);
  // Rim torus
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 8, 22), rimMat);
  rim.rotation.x = Math.PI / 2;
  // Inner "C" face emboss
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 20), new THREE.MeshStandardMaterial({
    color: "#D97706", metalness: 0.9, roughness: 0.15, emissive: "#D97706", emissiveIntensity: 0.3,
  }));
  // Shine cap
  const shine = new THREE.Mesh(new THREE.CircleGeometry(0.14, 10), new THREE.MeshBasicMaterial({ color: "#FFFDE7", transparent: true, opacity: 0.75 }));
  shine.position.set(0.1, 0.07, 0); shine.rotation.x = -Math.PI / 2; shine.position.y = 0.07;
  // Bright point light
  const light = new THREE.PointLight("#F59E0B", 2.5, 4);
  g.add(disk, rim, inner, shine, light);
  return g;
}

/* ═══════════════════════════════════════════
   TREES — 4 vivid types
═══════════════════════════════════════════ */
function makeTree(type: number): THREE.Group {
  const g = new THREE.Group();
  const trunk1 = new THREE.MeshStandardMaterial({ color: "#6B3710", roughness: 0.95 });
  const trunk2 = new THREE.MeshStandardMaterial({ color: "#78350F", roughness: 0.92 });

  if (type === 0) {
    // Majestic pine
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.27, 1.8, 7), trunk1);
    t.position.y = 0.6;
    const colors = ["#15803D", "#16A34A", "#14532D", "#166534"];
    [[1.5, 2.2, 2.0], [1.2, 1.6, 3.2], [0.9, 1.3, 4.1], [0.55, 1.0, 4.9]].forEach(([r, h, y], i) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.82 }));
      cone.position.y = y; g.add(cone);
    });
    g.add(t);

  } else if (type === 1) {
    // Autumn oak — orange & red leaves
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.6, 8), trunk2);
    t.position.y = 1.0;
    const leafColors = ["#EA580C", "#DC2626", "#F97316", "#B91C1C"];
    [[0.2, 3.3, 0, 1.2], [-0.6, 2.9, 0.3, 0.95], [0.5, 3.8, -0.3, 0.88], [0, 4.5, 0, 0.65], [-0.3, 3.5, -0.6, 0.78]].forEach(([x, y, z, r], i) => {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 6), new THREE.MeshStandardMaterial({ color: leafColors[i % 4], roughness: 0.78 }));
      blob.position.set(x as number, y as number, z as number); g.add(blob);
    });
    g.add(t);

  } else if (type === 2) {
    // Glowing mushroom — fantasy vibe
    const stemMat = new THREE.MeshStandardMaterial({ color: "#F3E8D0", roughness: 0.88 });
    const capMat = new THREE.MeshStandardMaterial({ color: "#9333EA", emissive: "#7E22CE", emissiveIntensity: 0.4, roughness: 0.65 });
    const dotMat = new THREE.MeshStandardMaterial({ color: "#E879F9", emissive: "#E879F9", emissiveIntensity: 0.6 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 9), stemMat);
    stem.position.y = 0.28;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.88, 14, 9), capMat);
    cap.scale.y = 0.62; cap.position.y = 0.98;
    [[-0.3, 0.08, 0.62], [0.3, 0.22, 0.60], [-0.08, 0.5, 0.68], [0.5, 0.0, 0.5]].forEach(([x, y, z]) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 6), dotMat);
      dot.position.set(x as number, (y as number) + 0.98, z as number); g.add(dot);
    });
    const gl = new THREE.PointLight("#A855F7", 1.2, 5); gl.position.y = 1;
    g.add(stem, cap, gl);

  } else {
    // Palm tree — sunny beach vibe
    const palmTrunk = new THREE.MeshStandardMaterial({ color: "#92400E", roughness: 0.88 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 3.2, 7), palmTrunk);
    trunk.position.y = 1.2; trunk.rotation.z = 0.12;
    const leafMat = new THREE.MeshStandardMaterial({ color: "#16A34A", roughness: 0.75, side: THREE.DoubleSide });
    [0, 60, 120, 180, 240, 300].forEach(deg => {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), leafMat);
      const r = (deg * Math.PI) / 180;
      leaf.position.set(Math.cos(r) * 0.8, 3.6, Math.sin(r) * 0.8);
      leaf.rotation.set(-0.4, r, 0.3); g.add(leaf);
    });
    g.add(trunk);
  }
  return g;
}

/* ═══════════════════════════════════════════
   DUST & COIN BURST PARTICLES
═══════════════════════════════════════════ */
function DustParticles({ state }: { state: React.MutableRefObject<GameState> }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const COUNT = 80;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) { arr[i * 3] = 0; arr[i * 3 + 1] = -5; arr[i * 3 + 2] = 0; }
    return arr;
  }, []);
  const phases = useMemo(() => Array.from({ length: COUNT }, () => Math.random() * Math.PI * 2), []);

  useFrame((_, delta) => {
    const gs = state.current;
    if (!gs.running || gs.dead) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const t = (gs.runTime * 1.3 + phases[i]) % 1.4;
      pos.setXYZ(i,
        gs.laneX + (Math.random() - 0.5) * 0.8,
        -0.38 + t * 0.5,
        PLAYER_Z - 0.6 - t * 1.4
      );
    }
    pos.needsUpdate = true;
    (pointsRef.current.material as THREE.PointsMaterial).opacity = Math.min(0.55, gs.speed * 2.2);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.11} color="#B8860B" transparent opacity={0.3} depthWrite={false} />
    </points>
  );
}

/* ═══════════════════════════════════════════
   SKY — Vibrant sunset gradient
═══════════════════════════════════════════ */
function SunsetSky() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color("#1A0A2E");
    return () => { scene.background = null; };
  }, [scene]);
  return (
    <>
      {/* Ground horizon glow */}
      <mesh position={[0, 2, -85]} rotation={[0.08, 0, 0]}>
        <planeGeometry args={[250, 35]} />
        <meshBasicMaterial color="#7C2D12" />
      </mesh>
      {/* Sunset band */}
      <mesh position={[0, 12, -85]}>
        <planeGeometry args={[250, 30]} />
        <meshBasicMaterial color="#EA580C" />
      </mesh>
      {/* Mid-sky orange-pink */}
      <mesh position={[0, 25, -85]}>
        <planeGeometry args={[250, 30]} />
        <meshBasicMaterial color="#BE185D" />
      </mesh>
      {/* Upper sky purple-dark */}
      <mesh position={[0, 40, -85]}>
        <planeGeometry args={[250, 35]} />
        <meshBasicMaterial color="#4C1D95" />
      </mesh>
      {/* Deep night sky top */}
      <mesh position={[0, 58, -85]}>
        <planeGeometry args={[250, 40]} />
        <meshBasicMaterial color="#1A0A2E" />
      </mesh>
      {/* Sun disc */}
      <mesh position={[8, 8, -83]}>
        <circleGeometry args={[5.5, 32]} />
        <meshBasicMaterial color="#FBBF24" />
      </mesh>
      <mesh position={[8, 8, -82]}>
        <circleGeometry args={[7.5, 32]} />
        <meshBasicMaterial color="#FED7AA" transparent opacity={0.35} />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════
   STARS
═══════════════════════════════════════════ */
function Stars() {
  const ref = useRef<THREE.Points>(null!);
  const STAR_COUNT = 180;
  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 180;
      arr[i * 3 + 1] = 20 + Math.random() * 55;
      arr[i * 3 + 2] = -60 - Math.random() * 30;
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.004;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.28} color="#FFFFFF" transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

/* ═══════════════════════════════════════════
   MOVING CLOUDS
═══════════════════════════════════════════ */
function MovingCloud({ startX, y, z, speed }: { startX: number; y: number; z: number; speed: number }) {
  const ref = useRef<THREE.Group>(null!);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFD6A5", transparent: true, opacity: 0.78, roughness: 1 }), []);
  useFrame((_, delta) => {
    ref.current.position.x += delta * speed;
    if (ref.current.position.x > 55) ref.current.position.x = -55;
  });
  return (
    <group ref={ref} position={[startX, y, z]}>
      {[[0, 0, 0, 1.6], [1.8, 0.25, 0, 1.3], [-1.5, 0.15, 0, 1.1], [0.6, 0.8, 0, 0.9], [-0.8, 0.7, 0, 0.75]].map(([x, cy, cz, r], i) => (
        <mesh key={i} position={[x as number, cy as number, cz as number]} material={mat}>
          <sphereGeometry args={[r as number, 7, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   SIDE BARRIERS / rails along path
═══════════════════════════════════════════ */
function SideBarriers() {
  const railMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F59E0B", metalness: 0.8, roughness: 0.2, emissive: "#D97706", emissiveIntensity: 0.25 }), []);
  const postMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1E293B", metalness: 0.6, roughness: 0.4 }), []);
  const tiles = useMemo(() => Array.from({ length: NUM_TILES }, (_, i) => i), []);
  const leftRailRef = useRef<(THREE.Group | null)[]>([]);
  const rightRailRef = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    const gs = (state.scene.userData.gameState as React.MutableRefObject<GameState>)?.current;
    if (!gs?.running) return;
    const move = gs.speed * 60 * delta;
    [...leftRailRef.current, ...rightRailRef.current].forEach((g, i) => {
      if (!g) return;
      const idx = i % NUM_TILES;
      const total = NUM_TILES * TILE_LENGTH;
      const base = -(idx * TILE_LENGTH);
      let z = (base + (state.scene.userData._barrierOffset || 0)) % total;
      if (z > 3) z -= total;
      g.position.z = z;
    });
    (state.scene.userData._barrierOffset as number) = ((state.scene.userData._barrierOffset as number) || 0) + move;
  });

  return (
    <>
      {tiles.map((i) => (
        <group key={`L${i}`} ref={el => { leftRailRef.current[i] = el; }} position={[-3.6, -0.5, -(i * TILE_LENGTH)]}>
          <mesh position={[0, 0.55, 0]} material={railMat}><boxGeometry args={[0.12, 0.12, TILE_LENGTH]} /></mesh>
          {Array.from({ length: 4 }).map((_, k) => (
            <mesh key={k} position={[0, 0.28, k * 3.5 - 5.25]} material={postMat}><boxGeometry args={[0.14, 0.6, 0.14]} /></mesh>
          ))}
        </group>
      ))}
      {tiles.map((i) => (
        <group key={`R${i}`} ref={el => { rightRailRef.current[i] = el; }} position={[3.6, -0.5, -(i * TILE_LENGTH)]}>
          <mesh position={[0, 0.55, 0]} material={railMat}><boxGeometry args={[0.12, 0.12, TILE_LENGTH]} /></mesh>
          {Array.from({ length: 4 }).map((_, k) => (
            <mesh key={k} position={[0, 0.28, k * 3.5 - 5.25]} material={postMat}><boxGeometry args={[0.14, 0.6, 0.14]} /></mesh>
          ))}
        </group>
      ))}
    </>
  );
}


/* ═══════════════════════════════════════════
   MAGNET POWER-UP 3D OBJECTS
═══════════════════════════════════════════ */
function MagnetObjects({ state }: { state: React.MutableRefObject<GameState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshes = useRef<{ mesh: THREE.Group; id: number }[]>([]);
  const t = useRef(0);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#A855F7", metalness: 0.85, roughness: 0.12,
    emissive: "#7C3AED", emissiveIntensity: 0.9,
  }), []);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#C084FC", transparent: true, opacity: 0.35,
    emissive: "#A855F7", emissiveIntensity: 1.2,
  }), []);

  useFrame((_, delta) => {
    const gs = state.current;
    t.current += delta;
    const move = gs.speed * 60 * delta;

    // Sync with gameState magnetObjs
    const existing = new Set(meshes.current.map(m => m.id));
    for (const mo of gs.magnetObjs) {
      if (!existing.has(mo.id)) {
        const g = new THREE.Group();
        // Magnet body - two arms
        const body = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.1, 8, 16, Math.PI), mat.clone());
        body.rotation.x = Math.PI / 2;
        body.position.y = 0.9;
        const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 8), mat.clone());
        arm1.position.set(-0.26, 0.56, 0);
        const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 8), mat.clone());
        arm2.position.set(0.26, 0.56, 0);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), glowMat.clone());
        glow.position.y = 0.8;
        const light = new THREE.PointLight("#A855F7", 2.5, 5);
        light.position.y = 0.9;
        g.add(body, arm1, arm2, glow, light);
        g.position.set(LANES[mo.lane], 0, mo.z);
        groupRef.current.add(g);
        meshes.current.push({ mesh: g, id: mo.id });
      }
    }

    // Remove gone magnets
    const activeIds = new Set(gs.magnetObjs.map(m => m.id));
    for (let i = meshes.current.length - 1; i >= 0; i--) {
      if (!activeIds.has(meshes.current[i].id)) {
        groupRef.current.remove(meshes.current[i].mesh);
        meshes.current.splice(i, 1);
      }
    }

    // Animate remaining
    meshes.current.forEach(({ mesh }) => {
      mesh.position.z += move;
      mesh.rotation.y += delta * 2.2;
      mesh.position.y = Math.sin(t.current * 2.5 + mesh.position.x) * 0.25;
    });
  });

  return <group ref={groupRef} />;
}

/* ═══════════════════════════════════════════
   MAIN GAME SCENE
═══════════════════════════════════════════ */
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
  const ambientRef = useRef<THREE.HemisphereLight>(null!);

  useEffect(() => {
    scene.userData.gameState = state;
    scene.userData._barrierOffset = 0;
    return () => { delete scene.userData.gameState; delete scene.userData._barrierOffset; };
  }, [scene, state]);

  useFrame((_, delta) => {
    const gs = state.current;
    if (!gs.running || gs.dead) return;

    const move = gs.speed * 60 * delta;
    gs.speed = Math.min(0.36, gs.speed + 0.00002);
    gs.distance += move * 1.5;
    gs.laneX += (gs.targetLaneX - gs.laneX) * 0.2;
    gs.runTime += delta;
    if (gs.coinFlash > 0) gs.coinFlash -= delta;
    if (gs.screenShake > 0) gs.screenShake -= delta;
    // Combo timer decay
    if (gs.comboTimer > 0) { gs.comboTimer -= delta; if (gs.comboTimer <= 0) gs.combo = 0; }
    // Magnet timer
    if (gs.magnetActive) { gs.magnetTimer -= delta; if (gs.magnetTimer <= 0) { gs.magnetActive = false; gs.magnetTimer = 0; } }
    // Milestone checks
    const MILESTONES = [100, 300, 500, 800, 1000];
    for (const m of MILESTONES) {
      if (gs.distance >= m && !gs.milestonesHit.includes(m)) {
        gs.milestonesHit.push(m);
        playMilestone();
      }
    }

    // Jump
    if (gs.jumping) {
      gs.jumpTime += delta;
      gs.jumpY = gs.jumpTime < 0.58 ? Math.sin((gs.jumpTime / 0.58) * Math.PI) * 2.5 : 0;
      if (gs.jumpTime >= 0.58) { gs.jumping = false; gs.jumpTime = 0; gs.jumpY = 0; }
    }
    // Slide
    if (gs.sliding) {
      gs.slideTime += delta;
      gs.scaleY = 0.5;
      if (gs.slideTime >= 0.6) { gs.sliding = false; gs.slideTime = 0; gs.scaleY = 1; }
    }

    // Spawn timers
    gs.spawnTimer += delta;
    gs.coinSpawnTimer += delta;

    // Spawn obstacles
    if (gs.spawnTimer > 0.95 / gs.speed) {
      gs.spawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const type = Math.floor(Math.random() * 5);
      const ob = makeObstacleMesh(type);
      ob.position.set(LANES[lane], 0, -70);
      obstacleGroupRef.current?.add(ob);
      obstacleMeshes.current.push({ group: ob, id: gs.idCounter++, lane, z: -70 });
    }

    // Spawn coins (clusters of 3)
    if (gs.coinSpawnTimer > 0.38 / gs.speed) {
      gs.coinSpawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const count = Math.random() > 0.5 ? 3 : 1;
      for (let ci = 0; ci < count; ci++) {
        const c = makeCoinMesh();
        c.position.set(LANES[lane], 0.7, -70 - ci * 1.8);
        coinGroupRef.current?.add(c);
        coinMeshes.current.push({ group: c, id: gs.idCounter++, lane, z: -70 - ci * 1.8 });
      }
    }

    // Spawn magnet power-up (rare)
    if (Math.random() < delta * gs.speed * 0.25 && gs.magnetObjs.length < 2) {
      const lane = Math.floor(Math.random() * 3);
      const id = gs.idCounter++;
      gs.magnetObjs.push({ id, lane, z: -70 });
    }

    // Spawn trees
    if (Math.random() < delta * gs.speed * 16) {
      const side = Math.random() > 0.5 ? 7 : -7;
      const type = Math.floor(Math.random() * 4);
      const t = makeTree(type);
      const scale = 0.75 + Math.random() * 0.65;
      t.scale.set(scale, scale, scale);
      t.position.set(side + (Math.random() - 0.5) * 2, -0.5, -72);
      treeGroupRef.current?.add(t);
    }

    // Move obstacles
    for (let i = obstacleMeshes.current.length - 1; i >= 0; i--) {
      const ob = obstacleMeshes.current[i];
      ob.group.position.z += move;
      ob.z = ob.group.position.z;
      // Slow rotation for some types
      ob.group.rotation.y += delta * 0.5;
      if (ob.z > 15) { obstacleGroupRef.current?.remove(ob.group); obstacleMeshes.current.splice(i, 1); }
    }

    // Move & spin coins
    for (let i = coinMeshes.current.length - 1; i >= 0; i--) {
      const c = coinMeshes.current[i];
      c.group.position.z += move;
      c.group.rotation.y += delta * 4;
      c.group.position.y = 0.7 + Math.sin(gs.runTime * 3.5 + i * 0.8) * 0.2;
      c.z = c.group.position.z;
      if (c.z > 15) { coinGroupRef.current?.remove(c.group); coinMeshes.current.splice(i, 1); }
    }

    // Move magnet objects
    for (let i = gs.magnetObjs.length - 1; i >= 0; i--) {
      const m = gs.magnetObjs[i];
      m.z += move;
      if (m.z > 15) { gs.magnetObjs.splice(i, 1); continue; }
      // Collect magnet
      if (Math.abs(m.z - PLAYER_Z) < 1.2 && Math.abs(LANES[m.lane] - px) < 1.1) {
        gs.magnetObjs.splice(i, 1);
        gs.magnetActive = true;
        gs.magnetTimer = 5.5;
        playMagnetPickup();
        continue;
      }
    }
    // Magnet coin attraction
    if (gs.magnetActive) {
      for (const c of coinMeshes.current) {
        const dx = px - c.group.position.x;
        const dz = PLAYER_Z - c.group.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 7) {
          c.group.position.x += dx * 0.08;
          c.group.position.z += dz * 0.08;
        }
      }
    }

    // Move trees
    for (let i = treeGroupRef.current.children.length - 1; i >= 0; i--) {
      const t = treeGroupRef.current.children[i];
      t.position.z += move;
      if (t.position.z > 14) treeGroupRef.current.remove(t);
    }

    // === COLLISION ===
    const px = gs.laneX, py = gs.jumpY, ps = gs.scaleY;
    const playerH = 2.0 * ps;
    for (const ob of obstacleMeshes.current) {
      const oz = ob.group.position.z, ox = ob.group.position.x;
      if (Math.abs(oz - PLAYER_Z) < 1.1 && Math.abs(ox - px) < 0.85) {
        if (!(py + playerH < 0 || py > 1.25)) {
          if (!gs.dead) {
            gs.dead = true;
            gs.screenShake = 0.5;
            playGameOver();
            onDie();
          }
        }
      }
    }

    // === COIN COLLECT ===
    for (let i = coinMeshes.current.length - 1; i >= 0; i--) {
      const c = coinMeshes.current[i];
      if (Math.abs(c.group.position.z - PLAYER_Z) < 1.1 &&
          Math.abs(c.group.position.x - px) < 1.1 &&
          Math.abs(c.group.position.y - (py + 0.9)) < 1.5) {
        coinGroupRef.current?.remove(c.group);
        coinMeshes.current.splice(i, 1);
        gs.coins++;
        gs.coinFlash = 0.3;
        // Combo system
        const now2 = gs.runTime;
        if (now2 - gs.lastCoinTime < 1.4) {
          gs.combo = Math.min(gs.combo + 1, 8);
          if (gs.combo >= 2) playCombo(gs.combo);
        } else {
          gs.combo = 1;
        }
        gs.lastCoinTime = now2;
        gs.comboTimer = 1.4;
        playCoin();
        onCoin();
      }
    }

    // Animate lights
    if (sunRef.current) sunRef.current.intensity = 1.8 + Math.sin(gs.runTime * 0.4) * 0.2;

    if (gs.distance >= MAX_DISTANCE && !gs.dead) { gs.dead = true; onDie(); }
  });

  return (
    <>
      <SunsetSky />
      <Stars />

      {/* Moving clouds */}
      <MovingCloud startX={-18} y={12} z={-65} speed={1.2} />
      <MovingCloud startX={5} y={15} z={-78} speed={0.8} />
      <MovingCloud startX={30} y={13} z={-70} speed={1.5} />
      <MovingCloud startX={-40} y={17} z={-82} speed={0.6} />

      {/* Lighting rig — sunset quality */}
      <hemisphereLight ref={ambientRef} args={["#EA580C", "#1A3D1E", 0.75]} />
      {/* Main warm sun */}
      <directionalLight
        ref={sunRef}
        position={[10, 12, 5]}
        intensity={1.8}
        color="#FED7AA"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      {/* Cool blue rim from opposite */}
      <directionalLight position={[-7, 4, -3]} intensity={0.55} color="#818CF8" />
      {/* Warm under-fill */}
      <pointLight position={[0, -0.5, 3]} intensity={1.2} color="#F59E0B" distance={12} />
      {/* Ambient glow on path */}
      <pointLight position={[0, 2, -15]} intensity={0.8} color="#EA580C" distance={20} />

      <fog attach="fog" args={["#4C1D95", 40, 110]} />

      {/* Ground */}
      <Ground />

      {/* Side barriers */}
      <SideBarriers />

      {/* Player */}
      <RunnerCharacter state={state} />

      {/* Dynamic objects */}
      <group ref={obstacleGroupRef} />
      <group ref={coinGroupRef} />
      <group ref={treeGroupRef} />

      {/* Magnet power-ups */}
      <MagnetObjects state={state} />

      {/* Dust trail */}
      <DustParticles state={state} />
    </>
  );
}

/* ═══════════════════════════════════════════
   HUD — COINCAR themed
═══════════════════════════════════════════ */
function GameHUD({
  coins, distance, paused, speed, coinFlash, combo, milestone, magnetActive,
  onPause, onResume, onQuit,
}: {
  coins: number; distance: number; paused: boolean; speed: number; coinFlash: boolean;
  combo: number; milestone: number; magnetActive: boolean;
  onPause: () => void; onResume: () => void; onQuit: () => void;
}) {
  const pct = Math.min(distance / MAX_DISTANCE, 1);
  const speedPct = Math.min(speed / 0.36, 1);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-4 pointer-events-none"
           style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 8 }}>

        {/* Coin counter */}
        <motion.div
          animate={{
            scale: coinFlash ? [1, 1.3, 1] : 1,
            backgroundColor: coinFlash ? ["rgba(0,0,0,0.6)", "rgba(245,158,11,0.5)", "rgba(0,0,0,0.6)"] : "rgba(0,0,0,0.6)"
          }}
          transition={{ duration: 0.28 }}
          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 border border-yellow-400/30 backdrop-blur-md shadow-lg"
        >
          <span className="text-xl drop-shadow-lg">🪙</span>
          <motion.span
            key={coins}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-yellow-300 font-serif text-xl font-bold drop-shadow-lg tabular-nums"
          >
            {coins}
          </motion.span>
        </motion.div>

        {/* Distance progress */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-3.5 rounded-full bg-black/50 border border-white/10 overflow-hidden backdrop-blur-sm shadow">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${pct * 100}%`,
                background: "linear-gradient(90deg, #F59E0B, #FDE68A, #F59E0B)",
                boxShadow: "0 0 8px #F59E0B88",
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between px-1">
            <span className="text-amber-300/80 text-[10px] font-bold tabular-nums">{Math.floor(distance)}m</span>
            <span className="text-white/30 text-[10px] font-bold">{MAX_DISTANCE}m</span>
          </div>
        </div>

        {/* Speed gauge */}
        <div className="flex flex-col items-center gap-0.5 bg-black/60 backdrop-blur-md rounded-2xl px-2.5 py-2 border border-white/10 shadow">
          <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-widest">SPD</span>
          <div className="w-5 h-12 bg-black/40 rounded-full overflow-hidden flex flex-col-reverse border border-white/15">
            <motion.div
              className="w-full rounded-full"
              style={{
                height: `${speedPct * 100}%`,
                background: speedPct > 0.75
                  ? "linear-gradient(0deg, #EF4444, #F97316, #FDE68A)"
                  : "linear-gradient(0deg, #F59E0B, #FDE68A)"
              }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>

        {/* Pause */}
        <button
          data-testid="button-pause"
          onClick={onPause}
          className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-2xl w-11 h-11 flex items-center justify-center text-white border border-white/10 hover:bg-black/80 transition-colors text-lg shadow"
        >⏸</button>
      </div>

      {/* Speed streak overlay */}
      {speedPct > 0.65 && !paused && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${5 + i * 8}%`,
                top: 0, bottom: 0,
                width: speedPct > 0.88 ? 2 : 1,
                background: `linear-gradient(180deg, transparent, rgba(251,191,36,${0.08 + speedPct * 0.18}), transparent)`,
              }}
              animate={{ opacity: [0, 1, 0], scaleY: [0.2, 1, 0.2] }}
              transition={{ duration: 0.35 + i * 0.06, repeat: Infinity, delay: i * 0.04 }}
            />
          ))}
          {/* Vignette pulse at max speed */}
          {speedPct > 0.85 && (
            <motion.div
              className="absolute inset-0 rounded-none"
              style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(234,88,12,0.18) 100%)" }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          )}
        </div>
      )}

      {/* Magnet indicator */}
      <AnimatePresence>
        {magnetActive && (
          <motion.div
            key="magnet"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md pointer-events-none"
            style={{ background: "rgba(139,92,246,0.35)", borderColor: "rgba(167,139,250,0.6)", boxShadow: "0 0 18px rgba(139,92,246,0.5)" }}
          >
            <span className="text-sm">🧲</span>
            <span className="text-purple-200 text-xs font-bold uppercase tracking-widest">Magnet Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo display */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            key={`combo-${combo}`}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute top-20 right-4 z-20 flex flex-col items-center pointer-events-none"
          >
            <span className="text-yellow-300 font-serif font-bold text-2xl drop-shadow-lg" style={{ textShadow: "0 0 12px #F59E0B" }}>
              x{combo}
            </span>
            <span className="text-yellow-400/80 text-[9px] font-bold uppercase tracking-widest">COMBO</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone popup */}
      <AnimatePresence>
        {milestone > 0 && (
          <motion.div
            key={`ms-${milestone}`}
            initial={{ scale: 0.5, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-25 flex flex-col items-center gap-1 pointer-events-none"
          >
            <div className="px-6 py-3 rounded-3xl backdrop-blur-xl border text-center"
              style={{ background: "rgba(245,158,11,0.28)", borderColor: "rgba(251,191,36,0.65)", boxShadow: "0 0 40px rgba(245,158,11,0.55)" }}>
              <p className="text-yellow-200 text-[11px] font-bold uppercase tracking-widest">Milestone!</p>
              <p className="text-yellow-300 font-serif text-4xl font-bold drop-shadow-lg">{milestone}m</p>
              <p className="text-yellow-200/70 text-[10px] font-bold uppercase tracking-widest">🎉 Keep Running!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coin flash burst */}
      <AnimatePresence>
        {coinFlash && (
          <motion.div
            key="coinburst"
            className="absolute inset-0 pointer-events-none z-15"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(251,191,36,0.45) 0%, transparent 65%)" }}
          />
        )}
      </AnimatePresence>

      {/* Pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <h2 className="font-serif text-5xl font-bold uppercase tracking-wider text-white drop-shadow-2xl">PAUSED</h2>
              <p className="text-yellow-300/70 text-sm font-bold uppercase tracking-widest">{Math.floor(distance)}m &nbsp;·&nbsp; {coins} coins</p>
              <div className="flex flex-col gap-3 w-56">
                <button data-testid="button-resume" onClick={onResume}
                  className="py-4 rounded-2xl font-serif text-2xl font-bold uppercase tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 0 28px #F59E0B66" }}>
                  Resume
                </button>
                <button data-testid="button-quit" onClick={onQuit}
                  className="py-4 rounded-2xl font-bold text-lg uppercase tracking-wider bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 transition-colors">
                  Quit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════
   GAME PAGE
═══════════════════════════════════════════ */
export default function Game() {
  const [, setLocation] = useLocation();
  const stateRef = useRef<GameState>(makeState());
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [displayCoinFlash, setDisplayCoinFlash] = useState(false);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [displayMilestone, setDisplayMilestone] = useState(0);
  const [displayMagnet, setDisplayMagnet] = useState(false);
  const lastMilestoneRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // HUD updater
  useEffect(() => {
    const tick = () => {
      const gs = stateRef.current;
      setDisplayCoins(gs.coins);
      setDisplayDistance(Math.floor(gs.distance));
      setDisplaySpeed(gs.speed);
      setDisplayCoinFlash(gs.coinFlash > 0);
      setDisplayCombo(gs.comboTimer > 0 ? gs.combo : 0);
      setDisplayMagnet(gs.magnetActive);
      // Milestone popup: show latest milestone hit
      if (gs.milestonesHit.length > 0) {
        const latest = gs.milestonesHit[gs.milestonesHit.length - 1];
        if (latest !== lastMilestoneRef.current) {
          lastMilestoneRef.current = latest;
          setDisplayMilestone(latest);
          setTimeout(() => setDisplayMilestone(0), 2200);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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
    startBgMusic();
  }, []);

  const handleTutorialComplete = useCallback(() => {
    Storage.setTutorial(true);
    setShowTutorial(false);
    startGame();
  }, [startGame]);

  const handleDie = useCallback(() => {
    const gs = stateRef.current;
    stopBgMusic();
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
      if (e.code === "ArrowLeft" && gs.currentLane > 0) { gs.currentLane--; gs.targetLaneX = LANES[gs.currentLane]; playLaneSwitch(); }
      if (e.code === "ArrowRight" && gs.currentLane < 2) { gs.currentLane++; gs.targetLaneX = LANES[gs.currentLane]; playLaneSwitch(); }
      if ((e.code === "Space" || e.code === "ArrowUp") && !gs.jumping && !gs.sliding) {
        e.preventDefault(); gs.jumping = true; gs.jumpTime = 0; playJump();
      }
      if ((e.code === "ArrowDown" || e.code === "KeyS") && !gs.sliding && !gs.jumping) {
        gs.sliding = true; gs.slideTime = 0; playSlide();
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
      if (dx < -25 && gs.currentLane > 0) { gs.currentLane--; gs.targetLaneX = LANES[gs.currentLane]; playLaneSwitch(); }
      else if (dx > 25 && gs.currentLane < 2) { gs.currentLane++; gs.targetLaneX = LANES[gs.currentLane]; playLaneSwitch(); }
    } else {
      if (dy < -30 && !gs.jumping && !gs.sliding) { gs.jumping = true; gs.jumpTime = 0; playJump(); }
      else if (dy > 30 && !gs.sliding && !gs.jumping) { gs.sliding = true; gs.slideTime = 0; playSlide(); }
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
              <motion.div className="text-5xl" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>🪙</motion.div>
              <span className="text-foreground font-serif text-xl font-bold">Loading COINCAR...</span>
            </div>
          </div>
        }>
          <Canvas
            camera={{ position: [0, 3.4, 9], fov: 58, near: 0.1, far: 150 }}
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
          combo={displayCombo}
          milestone={displayMilestone}
          magnetActive={displayMagnet}
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
