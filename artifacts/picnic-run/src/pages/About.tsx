import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

const sections = [
  {
    title: "What is COINCAR",
    body: `COINCAR is a free browser-based 3D endless runner. You sprint down a three-lane road, dodge obstacles, and collect as many gold coins as you can before the speed gets the better of you. No installs, no accounts required. Just open the page and run.`,
  },
  {
    title: "How it started",
    body: `The game grew out of a simple question: what would a classic endless runner look like built entirely with web technology? Three.js handles the 3D world, React keeps the UI reactive, and the whole thing ships as a Progressive Web App so you can pin it to your home screen and play offline.`,
  },
  {
    title: "What makes it different",
    body: `Everything runs at 60 frames per second in the browser with no plugins. The character animates in real time, coins glow with actual point lights, and the sunset sky shifts as you run. Five obstacle types keep you on your toes, and the speed ramps up without mercy the longer you survive.`,
  },
];

const techStack = [
  { label: "Renderer", value: "Three.js via React Three Fiber" },
  { label: "Framework", value: "React 18 with TypeScript" },
  { label: "Build", value: "Vite with pnpm workspaces" },
  { label: "Animations", value: "Framer Motion" },
  { label: "Routing", value: "Wouter" },
  { label: "PWA", value: "Vite PWA with Workbox" },
  { label: "Hosting", value: "GitHub Pages" },
  { label: "Domain", value: "playcoincar.xyz" },
];

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="p-5 rounded-2xl bg-card border border-border"
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  const [, setLocation] = useLocation();

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

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <Logo />
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-3">Version 1.0</p>
        </motion.div>

        {/* Story sections */}
        <div className="flex flex-col gap-4 mb-8">
          {sections.map((s, i) => (
            <Card key={s.title} delay={0.1 + i * 0.08}>
              <h2 className="font-serif text-lg font-bold text-secondary mb-2">{s.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
            </Card>
          ))}
        </div>

        {/* Tech stack */}
        <motion.section
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <h2 className="font-serif text-xl font-bold text-secondary uppercase tracking-widest mb-4">Built with</h2>
          <div className="rounded-2xl overflow-hidden border border-border divide-y divide-border">
            {techStack.map((t) => (
              <div key={t.label} className="flex items-center justify-between px-4 py-3 bg-card">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t.label}</span>
                <span className="text-foreground text-sm font-semibold text-right">{t.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Open source note */}
        <Card delay={0.45}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h3 className="font-bold text-foreground text-sm mb-1">Open to the web</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                COINCAR is a web-first game. No login required to play. Create an account only if you want your stats saved across devices. The game works fully offline once loaded as a PWA.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact / links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-8 flex flex-col items-center gap-2 text-center"
        >
          <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">Play online</p>
          <a
            href="https://playcoincar.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary font-bold text-sm hover:text-secondary/80 transition-colors"
          >
            playcoincar.xyz
          </a>
          <p className="text-muted-foreground/40 text-xs mt-2">Made with Three.js and too much coffee.</p>
        </motion.div>
      </div>
    </div>
  );
}
