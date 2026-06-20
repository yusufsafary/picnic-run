import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Splash from "@/pages/Splash";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Game from "@/pages/Game";
import Results from "@/pages/Results";
import HowToPlay from "@/pages/HowToPlay";
import About from "@/pages/About";
import Settings from "@/pages/Settings";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/">
          <PageTransition><Splash /></PageTransition>
        </Route>
        <Route path="/home">
          <PageTransition><Home /></PageTransition>
        </Route>
        <Route path="/login">
          <PageTransition><Login /></PageTransition>
        </Route>
        <Route path="/dashboard">
          <PageTransition><Dashboard /></PageTransition>
        </Route>
        <Route path="/game">
          <PageTransition><Game /></PageTransition>
        </Route>
        <Route path="/results">
          <PageTransition><Results /></PageTransition>
        </Route>
        <Route path="/howtoplay">
          <PageTransition><HowToPlay /></PageTransition>
        </Route>
        <Route path="/about">
          <PageTransition><About /></PageTransition>
        </Route>
        <Route path="/settings">
          <PageTransition><Settings /></PageTransition>
        </Route>
        <Route path="/leaderboard">
          <PageTransition><Leaderboard /></PageTransition>
        </Route>
        <Route>
          <PageTransition><NotFound /></PageTransition>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="w-full h-[100dvh] game-safe-area bg-background relative overflow-hidden text-foreground">
          <Router />
        </div>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
