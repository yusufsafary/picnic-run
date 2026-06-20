import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Storage } from "@/lib/storage";

const avatarEmojis: Record<string, string> = {
  fox: "🦊", bear: "🐻", panda: "🐼", lion: "🦁", tiger: "🐯", frog: "🐸",
};
const avatarColors: Record<string, string> = {
  fox: "bg-orange-500", bear: "bg-yellow-600", panda: "bg-slate-400",
  lion: "bg-yellow-500", tiger: "bg-orange-400", frog: "bg-green-500",
};

function CountUp({ target, duration = 1000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const player = Storage.getPlayer();
  const session = Storage.getSession();
  const coins = Storage.getCoins();
  const bestScore = Storage.getBestScore();
  const runs = Storage.getRuns();
  const bestTime = Storage.getBestTime();
  const streak = Storage.getStreak();

  const avatarId = player?.avatarId ?? "fox";

  // Update streak on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const s = Storage.getStreak();
    if (s.lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newCount = s.lastDate === yesterday ? s.count + 1 : 1;
      Storage.setStreak({ count: newCount, lastDate: today });
    }
  }, []);

  const handleLogout = () => {
    Storage.setSession(null);
    Storage.setPlayer(null);
    setLocation("/home");
  };

  const stats = [
    { label: "Total Coins", value: coins, suffix: "", icon: "🪙", color: "from-yellow-500/20 to-amber-600/10 border-yellow-500/30" },
    { label: "Best Score", value: bestScore, suffix: "", icon: "🏆", color: "from-primary/20 to-emerald-700/10 border-primary/30" },
    { label: "Runs Played", value: runs, suffix: "", icon: "🎮", color: "from-accent/20 to-sky-700/10 border-accent/30" },
    { label: "Best Time", value: bestTime > 0 ? Math.floor(bestTime / 1000) : 0, suffix: "s", icon: "⏱", color: "from-purple-500/20 to-purple-700/10 border-purple-500/30" },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="min-h-full flex flex-col p-5 pb-10 max-w-md mx-auto">

        {/* Back button */}
        <motion.button
          data-testid="button-back"
          onClick={() => setLocation("/home")}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="self-start text-muted-foreground hover:text-foreground text-sm font-bold uppercase tracking-widest mb-6 transition-colors"
        >
          ← Back
        </motion.button>

        {/* Player card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className={`w-24 h-24 rounded-3xl ${avatarColors[avatarId] ?? "bg-primary/30"} flex items-center justify-center text-5xl mb-3 shadow-2xl ring-4 ring-primary/40`}>
            {avatarEmojis[avatarId] ?? "🎮"}
          </div>
          <h2 className="font-serif text-3xl text-foreground font-bold">
            {session === "player" && player ? player.name : "Guest Runner"}
          </h2>
          <div className="mt-1 px-4 py-1 rounded-full bg-primary/20 border border-primary/30">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Runner</span>
          </div>

          {/* Streak */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="mt-4 flex items-center gap-2 px-5 py-2 rounded-2xl bg-secondary/10 border border-secondary/30"
          >
            <span className="text-xl">🔥</span>
            <div>
              <span className="font-serif text-2xl text-secondary font-bold">{streak.count}</span>
              <span className="text-muted-foreground text-sm ml-1">day streak</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className={`bg-gradient-to-br ${stat.color} border rounded-3xl p-4 flex flex-col gap-1`}
            >
              <span className="text-2xl">{stat.icon}</span>
              <p className="font-serif text-2xl text-foreground font-bold leading-none mt-1">
                <CountUp target={stat.value} duration={800} suffix={stat.suffix} />
              </p>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Play CTA */}
        <motion.button
          data-testid="button-play-now"
          onClick={() => setLocation("/game")}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 rounded-3xl font-serif text-2xl font-bold uppercase tracking-widest text-white mb-4"
          style={{
            background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 32%))",
            boxShadow: "0 0 30px hsl(152 60% 40% / 0.4), 0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          PLAY NOW
        </motion.button>

        {/* Logout */}
        {session === "player" && (
          <motion.button
            data-testid="button-logout"
            onClick={handleLogout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-muted-foreground/50 text-sm text-center hover:text-destructive transition-colors font-bold uppercase tracking-wider"
          >
            Logout
          </motion.button>
        )}
      </div>
    </div>
  );
}
