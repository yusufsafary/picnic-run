import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Storage } from "@/lib/storage";

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
    }
    if (time > 0) {
      const prevBestTime = Storage.getBestTime();
      if (prevBestTime === 0 || time < prevBestTime) {
        Storage.setBestTime(time);
      }
    }
    Storage.setCoins(Storage.getCoins() + coins);
    Storage.setRuns(Storage.getRuns() + 1);
    Storage.setLastRun(null);
  }, []); // eslint-disable-line

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background overflow-hidden p-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
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
              NEW BEST!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main coin score */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex flex-col items-center bg-card border border-border/50 rounded-[2rem] p-8 w-full"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        >
          <span className="text-6xl mb-2">🪙</span>
          <p className="font-serif text-7xl font-bold text-secondary leading-none">
            <CountUp target={coins} />
          </p>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">Coins Collected</p>
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
            className="w-full py-5 rounded-3xl font-serif text-2xl font-bold uppercase tracking-widest text-white"
            style={{
              background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 32%))",
              boxShadow: "0 0 25px hsl(152 60% 40% / 0.4)",
            }}
          >
            PLAY AGAIN
          </button>
          <button
            data-testid="button-dashboard"
            onClick={() => setLocation("/dashboard")}
            className="w-full py-4 rounded-3xl font-bold text-lg uppercase tracking-wider bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
