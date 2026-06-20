import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export default function Splash() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/home");
    }, 2500);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      {/* Golden leaf particles - simulated via CSS keyframes usually, but simplified here with framer-motion */}
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
              transition={{ duration: 2, ease: "easeInOut" }}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
