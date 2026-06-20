import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Storage } from "@/lib/storage";
import { playMilestone } from "@/lib/audio";

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val}</>;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rot: number;
  rotSpeed: number;
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const COLORS = ["#F59E0B", "#FBBF24", "#FDE68A", "#34D399", "#60A5FA", "#F472B6", "#A78BFA", "#FB923C"];

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn burst of particles
    for (let i = 0; i < 120; i++) {
      particlesRef.current.push({
        id: i,
        x: canvas.width * (0.2 + Math.random() * 0.6),
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 14,
        vy: -8 - Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.y < canvas.height + 20);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.vy += 0.35; // gravity
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.vx *= 0.99;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / (canvas.height * 1.1));
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (particlesRef.current.length > 0) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafRef.current); particlesRef.current = []; };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-30" />;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [isNewBest, setIsNewBest] = useState(false);
  const lastRun = Storage.getLastRun();
  const coins = lastRun?.coins ?? 0;
  const distance = lastRun?.distance ?? 0;
  const time = lastRun?.time ?? 0;

  useEffect(() => {
    if (!lastRun) return;
    const prevBest = Storage.getBestScore();
    if (coins > prevBest) {
      setIsNewBest(true);
      Storage.setBestScore(coins);
      setTimeout(() => playMilestone(), 600);
    }
    if (time > 0) {
      const prevBestTime = Storage.getBestTime();
      if (prevBestTime === 0 || time < prevBestTime) {
        Storage.setBestTime(time);
      }
    }
    Storage.setCoins(Storage.getCoins() + coins);
    Storage.setRuns(Storage.getRuns() + 1);

    // Save to leaderboard
    const player = Storage.getPlayer();
    Storage.addLeaderboardEntry({
      name: player?.name ?? "Runner",
      coins,
      distance: Math.floor(distance),
      time,
      date: new Date().toISOString(),
    });

    Storage.setLastRun(null);
  }, []); // eslint-disable-line

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  const grade = coins >= 50 ? "S" : coins >= 30 ? "A" : coins >= 15 ? "B" : coins >= 5 ? "C" : "D";
  const gradeColor = grade === "S" ? "#FBBF24" : grade === "A" ? "#34D399" : grade === "B" ? "#60A5FA" : grade === "C" ? "#F472B6" : "#94A3B8";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background overflow-hidden p-6">
      {/* Confetti on new best */}
      <Confetti active={isNewBest} />

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      {isNewBest && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 1.2, delay: 0.5 }}
          style={{ background: "radial-gradient(ellipse at center, rgba(245,158,11,0.4) 0%, transparent 70%)" }}
        />
      )}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5">
        {/* Title */}
        <motion.h2
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-serif text-4xl text-foreground font-bold tracking-wider uppercase"
        >
          Run Complete!
        </motion.h2>

        {/* New Best Badge */}
        <AnimatePresence>
          {isNewBest && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: [0, -5, 5, -3, 0] }}
              transition={{ type: "spring", stiffness: 300, delay: 0.8 }}
              className="px-6 py-2 rounded-full bg-secondary text-background font-serif text-xl font-bold uppercase tracking-widest shadow-2xl"
              style={{ boxShadow: "0 0 30px hsl(42 80% 55% / 0.6)" }}
            >
              🏆 NEW BEST!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grade + Coin score */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex items-stretch bg-card border border-border/50 rounded-[2rem] w-full overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        >
          {/* Grade panel */}
          <div className="flex flex-col items-center justify-center px-5 py-6 border-r border-border/30"
            style={{ background: `linear-gradient(135deg, ${gradeColor}22, ${gradeColor}08)` }}>
            <span className="font-serif text-6xl font-bold" style={{ color: gradeColor, textShadow: `0 0 20px ${gradeColor}88` }}>
              {grade}
            </span>
            <span className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest mt-1">Grade</span>
          </div>
          {/* Coin panel */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
            <span className="text-5xl mb-1">🪙</span>
            <p className="font-serif text-6xl font-bold text-secondary leading-none">
              <CountUp target={coins} />
            </p>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">Coins Collected</p>
          </div>
        </motion.div>

        {/* Secondary stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full grid grid-cols-2 gap-3"
        >
          <div className="bg-card border border-border/30 rounded-3xl p-4 text-center">
            <p className="font-serif text-3xl text-accent font-bold">
              <CountUp target={Math.floor(distance)} />m
            </p>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">Distance</p>
          </div>
          <div className="bg-card border border-border/30 rounded-3xl p-4 text-center">
            <p className="font-serif text-3xl text-foreground font-bold">
              {time > 0 ? formatTime(time) : "—"}
            </p>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">Time</p>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full flex flex-col gap-3"
        >
          <button
            data-testid="button-play-again"
            onClick={() => setLocation("/game")}
            className="w-full py-5 rounded-3xl font-serif text-2xl font-bold uppercase tracking-widest text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 32%))",
              boxShadow: "0 0 25px hsl(152 60% 40% / 0.4)",
            }}
          >
            <span className="relative z-10">PLAY AGAIN</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          </button>
          <div className="flex gap-3">
            <button
              data-testid="button-leaderboard"
              onClick={() => setLocation("/leaderboard")}
              className="flex-1 py-4 rounded-3xl font-bold text-base uppercase tracking-wider border backdrop-blur-sm transition-all"
              style={{ background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.35)", color: "#FDE68A" }}
            >
              🏆 Scores
            </button>
            <button
              data-testid="button-dashboard"
              onClick={() => setLocation("/dashboard")}
              className="flex-1 py-4 rounded-3xl font-bold text-base uppercase tracking-wider bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
