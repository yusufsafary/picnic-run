import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export default function Splash() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/home");
    }, 3000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      {/* Golden leaf particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-secondary/60 blur-[1px]"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 20,
              opacity: 0,
            }}
            animate={{
              y: -50,
              x: `calc(${Math.random() * window.innerWidth}px + ${Math.random() * 100 - 50}px)`,
              opacity: [0, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center"
      >
        <Logo className="scale-125 mb-8" />

        <div className="relative w-16 h-16 mt-12">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/10"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray="251.2"
              className="text-secondary"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* easya branding + X link */}
      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-3 z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Powered by</span>

        {/* easya logo */}
        <a
          href="https://easya.io"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#6EE7B7"/>
            <path d="M10 28L20 12L30 28H10Z" fill="#064E3B" opacity="0.9"/>
            <path d="M15 28L20 20L25 28H15Z" fill="#6EE7B7" opacity="0.8"/>
          </svg>
          <span className="text-white font-bold text-base tracking-tight">easya</span>
        </a>

        {/* X / Twitter link */}
        <a
          href="https://x.com/Yugobyte_"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/70">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
          </svg>
          <span className="text-white/70 text-xs font-semibold tracking-wide">@Yugobyte_</span>
        </a>
      </motion.div>
    </div>
  );
}
