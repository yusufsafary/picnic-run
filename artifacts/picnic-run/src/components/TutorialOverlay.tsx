import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    icon: (
      <svg viewBox="0 0 80 40" className="w-24 h-12">
        <motion.path
          d="M10 20 L30 20"
          stroke="hsl(200 60% 50%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={{ x: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.polygon
          points="0,20 14,12 14,28"
          fill="hsl(200 60% 50%)"
          animate={{ x: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.path
          d="M70 20 L50 20"
          stroke="hsl(200 60% 50%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={{ x: [5, -5, 5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.polygon
          points="80,20 66,12 66,28"
          fill="hsl(200 60% 50%)"
          animate={{ x: [5, -5, 5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </svg>
    ),
    title: "Change Lanes",
    hint: "Swipe left or right to switch lanes",
    keys: "Arrow keys on desktop",
  },
  {
    icon: (
      <motion.svg
        viewBox="0 0 40 60"
        className="w-16 h-24"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
      >
        <circle cx="20" cy="30" r="12" fill="hsl(152 60% 40%)" />
        <path d="M20 10 L15 20 L25 20 Z" fill="hsl(42 80% 55%)" />
      </motion.svg>
    ),
    title: "Jump",
    hint: "Swipe up to leap over obstacles",
    keys: "Space or Up arrow on desktop",
  },
  {
    icon: (
      <motion.svg
        viewBox="0 0 60 30"
        className="w-24 h-12"
        animate={{ scaleY: [1, 0.5, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
      >
        <rect x="10" y="5" width="40" height="20" rx="6" fill="hsl(152 60% 40%)" />
        <circle cx="15" cy="28" r="4" fill="hsl(200 60% 50%)" />
        <circle cx="45" cy="28" r="4" fill="hsl(200 60% 50%)" />
      </motion.svg>
    ),
    title: "Slide",
    hint: "Swipe down to duck under barriers",
    keys: "Down arrow or S on desktop",
  },
];

interface Props {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  const current = steps[step];

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Skip button */}
      <button
        data-testid="button-skip-tutorial"
        onClick={onComplete}
        className="absolute top-6 right-6 text-muted-foreground text-sm font-bold uppercase tracking-widest hover:text-foreground transition-colors"
      >
        Skip
      </button>

      <div className="flex flex-col items-center gap-8 px-8 max-w-sm w-full">
        {/* Step indicator */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Animated icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className="flex items-center justify-center h-32"
          >
            {current.icon}
          </motion.div>
        </AnimatePresence>

        {/* Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="text-center"
          >
            <h3 className="font-serif text-3xl text-foreground font-bold mb-2">{current.title}</h3>
            <p className="text-foreground/80 text-lg">{current.hint}</p>
            <p className="text-muted-foreground text-xs mt-2 uppercase tracking-wider">{current.keys}</p>
          </motion.div>
        </AnimatePresence>

        {/* Next / Got it button */}
        <button
          data-testid="button-tutorial-next"
          onClick={next}
          className="w-full py-4 rounded-2xl font-serif text-xl font-bold uppercase tracking-widest text-white"
          style={{
            background: "linear-gradient(135deg, hsl(152 60% 40%), hsl(152 70% 32%))",
            boxShadow: "0 0 20px hsl(152 60% 40% / 0.4)",
          }}
        >
          {step < steps.length - 1 ? "Next →" : "Got it!"}
        </button>
      </div>
    </motion.div>
  );
}
