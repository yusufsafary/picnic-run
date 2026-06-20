import { useLocation } from "wouter";
import { motion } from "framer-motion";

const controls = [
  {
    icon: "👆",
    gesture: "Swipe Left or Right",
    key: "Arrow Keys",
    desc: "Change lanes to dodge obstacles coming your way.",
  },
  {
    icon: "☝️",
    gesture: "Swipe Up",
    key: "Space / Up Arrow",
    desc: "Jump over low obstacles like rocks and hay bales.",
  },
  {
    icon: "👇",
    gesture: "Swipe Down",
    key: "Down Arrow / S",
    desc: "Slide under barriers and fence obstacles.",
  },
];

const tips = [
  { icon: "🪙", title: "Chase the coins", body: "Coins spawn in clusters of three on a single lane. Steer into those lanes early." },
  { icon: "🚧", title: "Read the pattern", body: "Obstacles never block all three lanes at once. There is always a safe path." },
  { icon: "⚡", title: "Speed climbs fast", body: "The longer you run, the faster everything moves. Do not wait to react." },
  { icon: "🦘", title: "Jump or slide, not both", body: "You cannot jump while sliding and vice versa. Commit to one move." },
  { icon: "👟", title: "Stay in the middle", body: "The center lane gives you the most time to react in either direction." },
  { icon: "🏁", title: "Hit 1200 meters", body: "Survive to 1200 meters and the run counts as a full clear. Every coin on the way adds to your score." },
];

const obstacles = [
  { emoji: "🪨", name: "Rock Pile", tip: "Jump over it. Sliding does nothing here." },
  { emoji: "🛢️", name: "Toxic Barrel", tip: "Jump or switch lanes. The glow is your warning." },
  { emoji: "🚧", name: "Neon Barrier", tip: "Slide under the top bar or jump over the whole thing." },
  { emoji: "🌾", name: "Hay Bale", tip: "Low and round. A clean jump clears it easily." },
  { emoji: "🔩", name: "Spike Wall", tip: "Switch lanes fast. Do not try to jump or slide through." },
];

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="mb-8"
    >
      <h2 className="font-serif text-xl font-bold text-secondary uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </motion.section>
  );
}

export default function HowToPlay() {
  const [, setLocation] = useLocation();

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="min-h-full flex flex-col p-5 pb-12 max-w-md mx-auto">

        {/* Header */}
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
          <h1 className="font-serif text-4xl font-bold text-foreground uppercase tracking-wider">How to Play</h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Run as far as you can, collect coins, and avoid everything in your path.
          </p>
        </motion.div>

        {/* Controls */}
        <Section title="Controls" delay={0.05}>
          <div className="flex flex-col gap-3">
            {controls.map((c, i) => (
              <motion.div
                key={c.gesture}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border"
              >
                <span className="text-3xl mt-0.5 shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-foreground text-sm">{c.gesture}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono uppercase">{c.key}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-snug">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Goal */}
        <Section title="The Goal" delay={0.2}>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-800/10 border border-primary/30">
            <p className="text-foreground text-sm leading-relaxed">
              Sprint down a three-lane road that never ends. Obstacles appear faster as you go. Collect every gold coin you can reach and survive to 1200 meters to complete a full run. Your coin total and distance are both saved to your personal record.
            </p>
          </div>
        </Section>

        {/* Obstacle guide */}
        <Section title="Obstacle Guide" delay={0.25}>
          <div className="flex flex-col gap-2">
            {obstacles.map((o, i) => (
              <motion.div
                key={o.name}
                initial={{ x: 16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.28 + i * 0.06 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border"
              >
                <span className="text-2xl w-9 text-center shrink-0">{o.emoji}</span>
                <div>
                  <p className="font-bold text-foreground text-sm">{o.name}</p>
                  <p className="text-muted-foreground text-xs leading-snug mt-0.5">{o.tip}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Tips */}
        <Section title="Pro Tips" delay={0.35}>
          <div className="grid grid-cols-1 gap-3">
            {tips.map((t, i) => (
              <motion.div
                key={t.title}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.38 + i * 0.06 }}
                className="flex gap-3 p-3.5 rounded-2xl bg-card border border-border"
              >
                <span className="text-xl shrink-0 mt-0.5">{t.icon}</span>
                <div>
                  <p className="font-bold text-foreground text-sm">{t.title}</p>
                  <p className="text-muted-foreground text-xs leading-snug mt-0.5">{t.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Play CTA */}
        <motion.button
          onClick={() => setLocation("/game")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-3xl font-serif text-xl font-bold uppercase tracking-widest text-white mt-2"
          style={{
            background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 30%))",
            boxShadow: "0 0 28px hsl(152 60% 40% / 0.4)",
          }}
        >
          Start Running
        </motion.button>
      </div>
    </div>
  );
}
