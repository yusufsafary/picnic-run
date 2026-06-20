import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { Storage } from "@/lib/storage";
import { playCoin, playJump, playGameOver } from "@/lib/audio";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { WebGLErrorBoundary } from "@/components/WebGLFallback";
import * as THREE from "three";

const LANES = [-2, 0, 2] as const;
const TILE_LENGTH = 12;
const NUM_TILES = 8;
const MAX_DISTANCE = 1000;

interface GameObj {
  id: number;
  lane: number;
  z: number;
  collected?: boolean;
  dead?: boolean;
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
  trees: GameObj[];
  spawnTimer: number;
  coinSpawnTimer: number;
  treeSpawnTimer: number;
  startTime: number;
  idCounter: number;
}

function makeState(): GameState {
  return {
    running: false,
    dead: false,
    speed: 0.12,
    distance: 0,
    coins: 0,
    currentLane: 1,
    targetLaneX: 0,
    laneX: 0,
    jumping: false,
    jumpTime: 0,
    jumpY: 0,
    sliding: false,
    slideTime: 0,
    scaleY: 1,
    obstacles: [],
    coinObjs: [],
    trees: [],
    spawnTimer: 0,
    coinSpawnTimer: 0,
    treeSpawnTimer: 0,
    startTime: 0,
    idCounter: 0,
  };
}

/* ── Character ── */
function PlayerMesh({ posY, scaleY, posX }: { posY: number; scaleY: number; posX: number }) {
  const group = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (group.current) {
      group.current.position.x += (posX - group.current.position.x) * 0.18;
      group.current.position.y = posY;
      group.current.scale.y = scaleY;
    }
  });
  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshStandardMaterial color="#D4A76A" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.14, 1.54, 0.29]}><boxGeometry args={[0.1, 0.1, 0.04]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      <mesh position={[-0.14, 1.54, 0.29]}><boxGeometry args={[0.1, 0.1, 0.04]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      {/* Torso */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.65, 0.7, 0.42]} />
        <meshStandardMaterial color="#F97316" />
      </mesh>
      {/* Arms */}
      <mesh position={[0.52, 0.78, 0]}><boxGeometry args={[0.22, 0.58, 0.28]} /><meshStandardMaterial color="#D4A76A" /></mesh>
      <mesh position={[-0.52, 0.78, 0]}><boxGeometry args={[0.22, 0.58, 0.28]} /><meshStandardMaterial color="#D4A76A" /></mesh>
      {/* Legs */}
      <mesh position={[0.18, 0.15, 0]}><boxGeometry args={[0.26, 0.6, 0.32]} /><meshStandardMaterial color="#2563EB" /></mesh>
      <mesh position={[-0.18, 0.15, 0]}><boxGeometry args={[0.26, 0.6, 0.32]} /><meshStandardMaterial color="#2563EB" /></mesh>
      {/* Shoes */}
      <mesh position={[0.18, -0.2, 0.07]}><boxGeometry args={[0.28, 0.16, 0.42]} /><meshStandardMaterial color="#1E293B" /></mesh>
      <mesh position={[-0.18, -0.2, 0.07]}><boxGeometry args={[0.28, 0.16, 0.42]} /><meshStandardMaterial color="#1E293B" /></mesh>
    </group>
  );
}

/* ── Ground tiles ── */
function Ground({ speed, running }: { speed: number; running: boolean }) {
  const tilesRef = useRef<THREE.Group[]>([]);
  const offsetRef = useRef(0);
  return (
    <group>
      {Array.from({ length: NUM_TILES }).map((_, i) => (
        <group
          key={i}
          ref={(el) => { if (el) tilesRef.current[i] = el; }}
          position={[0, -0.51, -(i * TILE_LENGTH)]}
        >
          <mesh receiveShadow>
            <boxGeometry args={[8, 0.25, TILE_LENGTH]} />
            <meshStandardMaterial color="#16A34A" roughness={0.9} />
          </mesh>
          {/* Lane lines */}
          <mesh position={[-2, 0.13, 0]}>
            <boxGeometry args={[0.06, 0.02, TILE_LENGTH]} />
            <meshStandardMaterial color="#ffffff" opacity={0.15} transparent />
          </mesh>
          <mesh position={[2, 0.13, 0]}>
            <boxGeometry args={[0.06, 0.02, TILE_LENGTH]} />
            <meshStandardMaterial color="#ffffff" opacity={0.15} transparent />
          </mesh>
        </group>
      ))}
      <ScrollUpdater tilesRef={tilesRef} speed={speed} running={running} offsetRef={offsetRef} />
    </group>
  );
}

function ScrollUpdater({
  tilesRef, speed, running, offsetRef
}: {
  tilesRef: React.MutableRefObject<THREE.Group[]>;
  speed: number;
  running: boolean;
  offsetRef: React.MutableRefObject<number>;
}) {
  useFrame((_, delta) => {
    if (!running) return;
    const move = speed * 60 * delta;
    offsetRef.current += move;
    tilesRef.current.forEach((tile, i) => {
      if (!tile) return;
      const baseZ = -(i * TILE_LENGTH);
      tile.position.z = ((baseZ + offsetRef.current) % (NUM_TILES * TILE_LENGTH)) - (NUM_TILES * TILE_LENGTH);
      if (tile.position.z > 4) tile.position.z -= NUM_TILES * TILE_LENGTH;
    });
  });
  return null;
}

/* ── Obstacles ── */
function ObstaclesMesh({ state }: { state: React.MutableRefObject<GameState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (!state.current.running || state.current.dead) return;
    const move = state.current.speed * 60 * delta;
    const gs = state.current;
    gs.obstacles = gs.obstacles
      .map(o => ({ ...o, z: o.z + move }))
      .filter(o => o.z < 20);
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const o = gs.obstacles[i];
        if (o) child.position.z = o.z;
      });
    }
  });
  return <group ref={groupRef} />;
}

/* ── Coins 3D ── */
function CoinsMesh({ state }: { state: React.MutableRefObject<GameState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (!state.current.running || state.current.dead) return;
    const move = state.current.speed * 60 * delta;
    const gs = state.current;
    gs.coinObjs = gs.coinObjs
      .map(c => ({ ...c, z: c.z + move }))
      .filter(c => c.z < 20 && !c.collected);
  });
  return <group ref={groupRef} />;
}

/* ── Trees ── */
function TreesMesh({ state }: { state: React.MutableRefObject<GameState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (!state.current.running) return;
    const move = state.current.speed * 60 * delta;
    state.current.trees = state.current.trees
      .map(t => ({ ...t, z: t.z + move }))
      .filter(t => t.z < 20);
    if (groupRef.current) {
      while (groupRef.current.children.length > state.current.trees.length) {
        groupRef.current.remove(groupRef.current.children[groupRef.current.children.length - 1]);
      }
    }
  });
  return <group ref={groupRef} />;
}

/* ── Main game loop scene ── */
function GameScene({
  state,
  onCoin,
  onDie,
}: {
  state: React.MutableRefObject<GameState>;
  onCoin: () => void;
  onDie: () => void;
}) {
  const playerRef = useRef<THREE.Group>(null!);
  const obstacleGroupRef = useRef<THREE.Group>(null!);
  const coinGroupRef = useRef<THREE.Group>(null!);
  const treeGroupRef = useRef<THREE.Group>(null!);
  const obstacleMeshes = useRef<{ mesh: THREE.Mesh; id: number }[]>([]);
  const coinMeshes = useRef<{ mesh: THREE.Mesh; id: number }[]>([]);

  const obstacleMat = new THREE.MeshStandardMaterial({ color: "#94A3B8" });
  const coinMat = new THREE.MeshStandardMaterial({ color: "#F59E0B", metalness: 0.8, roughness: 0.1, emissive: "#F59E0B", emissiveIntensity: 0.5 });

  useFrame((_, delta) => {
    const gs = state.current;
    if (!gs.running || gs.dead) return;

    const move = gs.speed * 60 * delta;

    // Speed & distance
    gs.speed = Math.min(0.32, gs.speed + 0.000015);
    gs.distance += move * 1.5;

    // Jump
    if (gs.jumping) {
      gs.jumpTime += delta;
      const t = gs.jumpTime / 0.55;
      gs.jumpY = t < 1 ? Math.sin(t * Math.PI) * 2.2 : 0;
      if (gs.jumpTime >= 0.55) {
        gs.jumping = false;
        gs.jumpTime = 0;
        gs.jumpY = 0;
      }
    }

    // Slide
    if (gs.sliding) {
      gs.slideTime += delta;
      gs.scaleY = 0.52;
      if (gs.slideTime >= 0.55) {
        gs.sliding = false;
        gs.slideTime = 0;
        gs.scaleY = 1;
      }
    }

    // Smooth lane X
    gs.laneX += (gs.targetLaneX - gs.laneX) * 0.2;

    // Update player mesh
    if (playerRef.current) {
      playerRef.current.position.x = gs.laneX;
      playerRef.current.position.y = gs.jumpY;
      playerRef.current.scale.y = gs.scaleY;
    }

    // Spawn timers
    gs.spawnTimer += delta;
    gs.coinSpawnTimer += delta;
    gs.treeSpawnTimer += delta;

    if (gs.spawnTimer > 1.1 / gs.speed) {
      gs.spawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      gs.obstacles.push({ id: gs.idCounter++, lane, z: -60 });

      const newMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.1),
        obstacleMat
      );
      newMesh.position.set(LANES[lane], 0.25, -60);
      obstacleGroupRef.current?.add(newMesh);
      obstacleMeshes.current.push({ mesh: newMesh, id: gs.idCounter - 1 });
    }

    if (gs.coinSpawnTimer > 0.55 / gs.speed) {
      gs.coinSpawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const coinGeo = new THREE.TorusGeometry(0.22, 0.08, 8, 16);
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(LANES[lane], 0.5, -60);
      coinMesh.rotation.x = Math.PI / 2;
      coinGroupRef.current?.add(coinMesh);
      coinMeshes.current.push({ mesh: coinMesh, id: gs.idCounter++ });
      gs.coinObjs.push({ id: gs.idCounter - 1, lane, z: -60 });
    }

    if (gs.treeSpawnTimer > 0.8 / gs.speed) {
      gs.treeSpawnTimer = 0;
      const side = Math.random() > 0.5 ? 5.5 : -5.5;
      gs.trees.push({ id: gs.idCounter++, lane: 0, z: -60 });
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: "#92400E" })
      );
      trunk.position.y = 0.3;
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 2.5, 7),
        new THREE.MeshStandardMaterial({ color: "#15803D" })
      );
      leaves.position.y = 2;
      treeGroup.add(trunk, leaves);
      treeGroup.position.set(side, -0.5, -60);
      treeGroupRef.current?.add(treeGroup);
    }

    // Move obstacles
    obstacleMeshes.current = obstacleMeshes.current.filter(({ mesh }) => {
      mesh.position.z += move;
      if (mesh.position.z > 15) {
        obstacleGroupRef.current?.remove(mesh);
        return false;
      }
      return true;
    });

    // Move coins & spin
    coinMeshes.current = coinMeshes.current.filter(({ mesh }) => {
      mesh.position.z += move;
      mesh.rotation.z += delta * 3;
      if (mesh.position.z > 15) {
        coinGroupRef.current?.remove(mesh);
        return false;
      }
      return true;
    });

    // Move trees
    treeGroupRef.current?.children.forEach((t) => {
      t.position.z += move;
    });
    for (let i = treeGroupRef.current?.children.length - 1; i >= 0; i--) {
      if (treeGroupRef.current.children[i]?.position.z > 20) {
        treeGroupRef.current.remove(treeGroupRef.current.children[i]);
      }
    }

    // Collision: obstacles
    const px = playerRef.current?.position.x ?? 0;
    const py = playerRef.current?.position.y ?? 0;
    const ps = gs.scaleY;
    const playerH = 1.9 * ps;
    const playerTop = py + playerH;
    const playerBot = py;

    for (const { mesh } of obstacleMeshes.current) {
      const ox = mesh.position.x;
      const oz = mesh.position.z;
      if (Math.abs(oz - 0.5) < 1.2 && Math.abs(ox - px) < 0.9) {
        if (!(playerTop < -0.1 || playerBot > 1.35)) {
          if (!gs.dead) {
            gs.dead = true;
            playGameOver();
            onDie();
          }
        }
      }
    }

    // Collision: coins
    for (let i = coinMeshes.current.length - 1; i >= 0; i--) {
      const { mesh } = coinMeshes.current[i];
      const cx = mesh.position.x;
      const cz = mesh.position.z;
      const cy = mesh.position.y;
      if (
        Math.abs(cz - 0.5) < 1.0 &&
        Math.abs(cx - px) < 0.9 &&
        Math.abs(cy - (py + 0.7)) < 1.2
      ) {
        coinGroupRef.current?.remove(mesh);
        coinMeshes.current.splice(i, 1);
        gs.coins += 1;
        playCoin();
        onCoin();
      }
    }

    // Win condition
    if (gs.distance >= MAX_DISTANCE && !gs.dead) {
      gs.dead = true;
      onDie();
    }
  });

  return (
    <>
      <Sky sunPosition={[1, 0.1, 0.5]} turbidity={3} rayleigh={0.6} mieCoefficient={0.003} mieDirectionalG={0.85} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 4]} intensity={1.4} color="#FFF8E7" castShadow />
      <fog attach="fog" args={["#0a2a1f", 25, 70]} />

      <Ground speed={0} running={state.current.running} />

      <group ref={playerRef} position={[0, 0, 0]}>
        {/* Head */}
        <mesh position={[0, 1.5, 0]}><boxGeometry args={[0.55, 0.55, 0.55]} /><meshStandardMaterial color="#D4A76A" /></mesh>
        <mesh position={[0.14, 1.54, 0.29]}><boxGeometry args={[0.1, 0.1, 0.04]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
        <mesh position={[-0.14, 1.54, 0.29]}><boxGeometry args={[0.1, 0.1, 0.04]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
        {/* Torso */}
        <mesh position={[0, 0.75, 0]}><boxGeometry args={[0.65, 0.7, 0.42]} /><meshStandardMaterial color="#F97316" /></mesh>
        {/* Arms */}
        <mesh position={[0.52, 0.78, 0]}><boxGeometry args={[0.22, 0.58, 0.28]} /><meshStandardMaterial color="#D4A76A" /></mesh>
        <mesh position={[-0.52, 0.78, 0]}><boxGeometry args={[0.22, 0.58, 0.28]} /><meshStandardMaterial color="#D4A76A" /></mesh>
        {/* Legs */}
        <mesh position={[0.18, 0.15, 0]}><boxGeometry args={[0.26, 0.6, 0.32]} /><meshStandardMaterial color="#2563EB" /></mesh>
        <mesh position={[-0.18, 0.15, 0]}><boxGeometry args={[0.26, 0.6, 0.32]} /><meshStandardMaterial color="#2563EB" /></mesh>
        {/* Shoes */}
        <mesh position={[0.18, -0.2, 0.07]}><boxGeometry args={[0.28, 0.16, 0.42]} /><meshStandardMaterial color="#1E293B" /></mesh>
        <mesh position={[-0.18, -0.2, 0.07]}><boxGeometry args={[0.28, 0.16, 0.42]} /><meshStandardMaterial color="#1E293B" /></mesh>
      </group>

      <group ref={obstacleGroupRef} />
      <group ref={coinGroupRef} />
      <group ref={treeGroupRef} />
    </>
  );
}

/* ── HUD ── */
function GameHUD({
  coins,
  distance,
  paused,
  onPause,
  onResume,
  onQuit,
}: {
  coins: number;
  distance: number;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
}) {
  const pct = Math.min(distance / MAX_DISTANCE, 1);
  return (
    <>
      {/* HUD bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2 pointer-events-none">
        <div className="pointer-events-none flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-2xl px-3 py-1.5">
          <span className="text-secondary text-xl">🪙</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={coins}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-foreground font-serif text-2xl font-bold"
            >
              {coins}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex-1 mx-3 flex flex-col gap-1">
          <div className="h-2 rounded-full bg-black/40 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-center text-xs text-foreground/60 font-bold">{Math.floor(distance)}m / {MAX_DISTANCE}m</p>
        </div>

        <button
          data-testid="button-pause"
          onClick={onPause}
          className="pointer-events-auto bg-black/40 backdrop-blur-sm rounded-2xl w-10 h-10 flex items-center justify-center text-foreground text-lg hover:bg-black/60 transition-colors"
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
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <h2 className="font-serif text-4xl text-foreground font-bold mb-8 uppercase">Paused</h2>
            <div className="flex flex-col gap-4 w-48">
              <button
                data-testid="button-resume"
                onClick={onResume}
                className="py-4 rounded-2xl font-serif text-xl font-bold uppercase tracking-wider text-white"
                style={{ background: "hsl(152 60% 40%)" }}
              >
                Resume
              </button>
              <button
                data-testid="button-quit"
                onClick={onQuit}
                className="py-4 rounded-2xl font-bold text-lg uppercase tracking-wider bg-muted/50 border border-border/40 text-muted-foreground"
              >
                Quit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main Game Page ── */
export default function Game() {
  const [, setLocation] = useLocation();
  const stateRef = useRef<GameState>(makeState());
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number>(0);

  // HUD ticker
  useEffect(() => {
    const tick = () => {
      const gs = stateRef.current;
      setDisplayCoins(gs.coins);
      setDisplayDistance(Math.floor(gs.distance));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Tutorial check
  useEffect(() => {
    const seen = Storage.getTutorial();
    if (!seen) {
      setShowTutorial(true);
    } else {
      startGame();
    }
  }, []); // eslint-disable-line

  const startGame = useCallback(() => {
    stateRef.current = makeState();
    stateRef.current.running = true;
    stateRef.current.startTime = Date.now();
    setGameStarted(true);
    setDisplayCoins(0);
    setDisplayDistance(0);
  }, []);

  const handleTutorialComplete = useCallback(() => {
    Storage.setTutorial(true);
    setShowTutorial(false);
    startGame();
  }, [startGame]);

  const handleDie = useCallback(() => {
    const gs = stateRef.current;
    const elapsed = Date.now() - gs.startTime;
    Storage.setLastRun({ coins: gs.coins, distance: Math.floor(gs.distance), time: elapsed });
    setTimeout(() => setLocation("/results"), 1000);
  }, [setLocation]);

  const handleCoin = useCallback(() => {
    setDisplayCoins(c => c + 1);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused) return;
      const gs = stateRef.current;
      if (!gs.running) return;
      if (e.code === "ArrowLeft" && gs.currentLane > 0) {
        gs.currentLane--;
        gs.targetLaneX = LANES[gs.currentLane];
      }
      if (e.code === "ArrowRight" && gs.currentLane < 2) {
        gs.currentLane++;
        gs.targetLaneX = LANES[gs.currentLane];
      }
      if ((e.code === "Space" || e.code === "ArrowUp") && !gs.jumping) {
        e.preventDefault();
        gs.jumping = true;
        gs.jumpTime = 0;
        playJump();
      }
      if ((e.code === "ArrowDown" || e.code === "KeyS") && !gs.sliding) {
        gs.sliding = true;
        gs.slideTime = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  // Touch controls
  const onPointerDown = (e: React.PointerEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!touchStartRef.current || paused) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const gs = stateRef.current;
    if (!gs.running) return;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 10 && absDy < 10) return;

    if (absDx > absDy) {
      if (dx < -25 && gs.currentLane > 0) {
        gs.currentLane--;
        gs.targetLaneX = LANES[gs.currentLane];
      } else if (dx > 25 && gs.currentLane < 2) {
        gs.currentLane++;
        gs.targetLaneX = LANES[gs.currentLane];
      }
    } else {
      if (dy < -30 && !gs.jumping) {
        gs.jumping = true;
        gs.jumpTime = 0;
        playJump();
      } else if (dy > 30 && !gs.sliding) {
        gs.sliding = true;
        gs.slideTime = 0;
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* 3D Scene */}
      <WebGLErrorBoundary fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-4">
          <span className="text-5xl">🎮</span>
          <p className="text-foreground font-serif text-xl">WebGL not available in this browser</p>
          <button onClick={() => setLocation("/home")} className="text-muted-foreground text-sm font-bold uppercase tracking-widest">← Back</button>
        </div>
      }>
        <Suspense fallback={<div className="absolute inset-0 bg-background flex items-center justify-center"><span className="text-foreground font-serif text-2xl">Loading...</span></div>}>
          <Canvas
            camera={{ position: [0, 2.8, 6], fov: 65, near: 0.1, far: 120 }}
            shadows
            style={{ position: "absolute", inset: 0 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            dpr={[1, 1.5]}
          >
            {gameStarted && (
              <GameScene
                state={stateRef}
                onCoin={handleCoin}
                onDie={handleDie}
              />
            )}
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>

      {/* HUD */}
      {gameStarted && !showTutorial && (
        <GameHUD
          coins={displayCoins}
          distance={displayDistance}
          paused={paused}
          onPause={() => { setPaused(true); stateRef.current.running = false; }}
          onResume={() => { setPaused(false); stateRef.current.running = true; stateRef.current.startTime = Date.now() - (stateRef.current.distance / 1.5 * 10); }}
          onQuit={() => setLocation("/home")}
        />
      )}

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onComplete={handleTutorialComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
