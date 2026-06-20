import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";

const avatars = [
  { id: "fox", emoji: "🦊", color: "bg-orange-500" },
  { id: "bear", emoji: "🐻", color: "bg-yellow-600" },
  { id: "panda", emoji: "🐼", color: "bg-slate-200" },
  { id: "lion", emoji: "🦁", color: "bg-yellow-500" },
  { id: "tiger", emoji: "🐯", color: "bg-orange-400" },
  { id: "frog", emoji: "🐸", color: "bg-green-500" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(avatars[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    Storage.setPlayer({ name: name.trim(), avatarId });
    Storage.setSession("player");
    setLocation("/home");
  };

  const handleGuest = () => {
    Storage.setSession("guest");
    setLocation("/home");
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Blurred background map */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-0" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm bg-card border border-border/50 rounded-[2rem] p-6 shadow-2xl shadow-black/50"
      >
        <h2 className="font-serif text-3xl text-center text-foreground mb-6">Who's Playing?</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Speedy Ninja"
              className="w-full bg-input text-foreground font-bold text-lg rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-shadow"
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-2">Choose Avatar</label>
            <div className="grid grid-cols-3 gap-4">
              {avatars.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvatarId(a.id)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all ${
                    avatarId === a.id 
                      ? "ring-4 ring-primary scale-105" 
                      : "opacity-70 hover:opacity-100 hover:scale-105"
                  } ${a.color}`}
                >
                  <span className={avatarId === a.id ? "drop-shadow-lg" : ""}>{a.emoji}</span>
                  {avatarId === a.id && (
                    <motion.div 
                      layoutId="ring"
                      className="absolute inset-0 rounded-2xl ring-4 ring-primary shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!name.trim()}
            className="w-full py-6 text-xl font-serif rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Let's Go!
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={handleGuest}
            className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors"
          >
            Continue as Guest →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
