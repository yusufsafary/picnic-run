import { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Storage } from "@/lib/storage";
import { getStorage } from "@/lib/storage";

const LB_KEY = "cc_leaderboard";

export interface LeaderboardEntry {
  name: string;
  coins: number;
  distance: number;
  time: number;
  date: string;
}

export function getLeaderboard(): LeaderboardEntry[] {
  return getStorage<LeaderboardEntry[]>(LB_KEY, []);
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [, setLocation] = useLocation();

  const entries = useMemo(() => getLeaderboard(), []);

  const player = Storage.getPlayer();
  const session = Storage.getSession();
  const bestScore = Storage.getBestScore();
  const totalCoins = Storage.getCoins();

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="min-h-full flex flex-col p-5 pb-12 max-w-md mx-auto">

        <motion.button
          onClick={() => setLocation("/home")}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="self-start text-muted-foreground hover:text-foreground text-sm font-bold uppercase tracking-widest mb-6 transition-colors"
        >
          ← Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl font-bold text-foreground uppercase tracking-wider">Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your personal best runs, saved on this device.</p>
        </motion.div>

        {/* Personal summary */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-700/10 border border-yellow-500/30 flex flex-col gap-1">
            <span className="text-2xl">🪙</span>
            <p className="font-serif text-2xl font-bold text-foreground leading-none mt-1">{totalCoins.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Coins</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-700/10 border border-primary/30 flex flex-col gap-1">
            <span className="text-2xl">🏁</span>
            <p className="font-serif text-2xl font-bold text-foreground leading-none mt-1">{bestScore.toLocaleString()}m</p>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Best Distance</p>
          </div>
        </motion.div>

        {/* Run history */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-secondary uppercase tracking-widest">Run History</h2>
            <span className="text-muted-foreground text-xs font-bold">{entries.length} run{entries.length !== 1 ? "s" : ""}</span>
          </div>

          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center py-14 gap-3"
            >
              <span className="text-5xl opacity-40">🏃</span>
              <p className="text-muted-foreground text-sm font-bold text-center">No runs saved yet.</p>
              <p className="text-muted-foreground/60 text-xs text-center max-w-xs">
                Finish a run to save it here. Your top 10 scores are stored on this device.
              </p>
              <button
                onClick={() => setLocation("/game")}
                className="mt-4 px-6 py-2.5 rounded-2xl font-bold text-sm uppercase tracking-wider text-white"
                style={{ background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 30%))" }}
              >
                Play Now
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                    i === 0
                      ? "bg-gradient-to-r from-yellow-500/15 to-amber-600/5 border-yellow-500/30"
                      : i === 1
                      ? "bg-gradient-to-r from-slate-400/10 to-slate-500/5 border-slate-400/25"
                      : i === 2
                      ? "bg-gradient-to-r from-amber-700/10 to-amber-800/5 border-amber-700/25"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-9 text-center shrink-0">
                    {i < 3 ? (
                      <span className="text-2xl">{medals[i]}</span>
                    ) : (
                      <span className="font-serif text-lg font-bold text-muted-foreground">#{i + 1}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">
                      {entry.name || (session === "player" && player?.name) || "Runner"}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatDate(entry.date)}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-yellow-400 text-sm">{entry.coins}🪙</p>
                      <p className="text-muted-foreground text-xs">{entry.distance}m</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-muted-foreground text-xs">{formatTime(entry.time)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Play CTA */}
        {entries.length > 0 && (
          <motion.button
            onClick={() => setLocation("/game")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-3xl font-serif text-xl font-bold uppercase tracking-widest text-white mt-4"
            style={{
              background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 30%))",
              boxShadow: "0 0 28px hsl(152 60% 40% / 0.4)",
            }}
          >
            Beat Your Best
          </motion.button>
        )}
      </div>
    </div>
  );
}
