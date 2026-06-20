import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Storage, getStorage, setStorage } from "@/lib/storage";

const SETTINGS_KEY = "cc_settings";

interface AppSettings {
  soundEnabled: boolean;
  quality: "high" | "low";
  showFps: boolean;
}

function loadSettings(): AppSettings {
  return getStorage<AppSettings>(SETTINGS_KEY, {
    soundEnabled: true,
    quality: "high",
    showFps: false,
  });
}

function saveSettings(s: AppSettings) {
  setStorage(SETTINGS_KEY, s);
}

function Toggle({
  value,
  onChange,
  label,
  desc,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm">{label}</p>
        <p className="text-muted-foreground text-xs mt-0.5 leading-snug">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${value ? "bg-primary" : "bg-muted"}`}
        aria-pressed={value}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: value ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </button>
    </div>
  );
}

function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <p className="font-bold text-foreground text-sm mb-3">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmTutorial, setConfirmTutorial] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  function update(partial: Partial<AppSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  function resetAllData() {
    Storage.setCoins(0);
    Storage.setBestScore(0);
    Storage.setBestTime(0);
    Storage.setRuns(0);
    Storage.setStreak({ count: 0, lastDate: "" });
    Storage.setLastRun(null);
    setStorage("cc_leaderboard", []);
    setConfirmReset(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  }

  function resetTutorial() {
    Storage.setTutorial(false);
    setConfirmTutorial(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  }

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
          <h1 className="font-serif text-4xl font-bold text-foreground uppercase tracking-wider">Settings</h1>
        </motion.div>

        {/* Saved indicator */}
        <AnimatePresence>
          {savedFlash && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold text-center"
            >
              Saved
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio */}
        <motion.section
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.07 }}
          className="mb-6"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Audio</h2>
          <div className="bg-card border border-border rounded-2xl px-4">
            <Toggle
              label="Sound Effects"
              desc="Coin collects, jumps, and game over sounds."
              value={settings.soundEnabled}
              onChange={(v) => update({ soundEnabled: v })}
            />
          </div>
        </motion.section>

        {/* Visuals */}
        <motion.section
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.13 }}
          className="mb-6"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Visuals</h2>
          <div className="bg-card border border-border rounded-2xl px-4">
            <ChoiceRow
              label="Render Quality"
              options={[
                { value: "high", label: "High" },
                { value: "low", label: "Low" },
              ]}
              value={settings.quality}
              onChange={(v) => update({ quality: v as "high" | "low" })}
            />
            <Toggle
              label="Show FPS Counter"
              desc="Display the frames-per-second rate during gameplay."
              value={settings.showFps}
              onChange={(v) => update({ showFps: v })}
            />
          </div>
        </motion.section>

        {/* Data */}
        <motion.section
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Data</h2>
          <div className="bg-card border border-border rounded-2xl px-4">
            {/* Reset tutorial */}
            <div className="py-4 border-b border-border">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-foreground text-sm">Reset Tutorial</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Show the how-to-play intro again on next game launch.</p>
                </div>
                <button
                  onClick={() => setConfirmTutorial(true)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
                >
                  Reset
                </button>
              </div>
              <AnimatePresence>
                {confirmTutorial && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex gap-2">
                      <button onClick={resetTutorial} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Confirm</button>
                      <button onClick={() => setConfirmTutorial(false)} className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-bold">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset all data */}
            <div className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-destructive text-sm">Reset All Progress</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Clears coins, scores, streaks, and leaderboard. Cannot be undone.</p>
                </div>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive text-xs font-bold hover:bg-destructive/25 transition-colors"
                >
                  Clear
                </button>
              </div>
              <AnimatePresence>
                {confirmReset && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-destructive/80 text-xs mt-3 mb-2">This will permanently delete all your local data.</p>
                    <div className="flex gap-2">
                      <button onClick={resetAllData} className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold">Yes, clear everything</button>
                      <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-bold">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center mt-4"
        >
          <p className="text-muted-foreground/40 text-xs font-bold uppercase tracking-widest">COINCAR v1.0</p>
          <p className="text-muted-foreground/30 text-xs mt-1">playcoincar.xyz</p>
        </motion.div>
      </div>
    </div>
  );
}
