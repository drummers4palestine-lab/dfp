import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Home from "@/pages/home";
import Tunes from "@/pages/tunes";
import ProtestBeats from "@/pages/protest-beats";
import Experiment from "@/pages/experiment";
import About from "@/pages/about";
import InstagramPage from "@/pages/instagram";
import Shop from "@/pages/shop";
import Instruments from "@/pages/instruments";
import Theory from "@/pages/theory";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/instagram" component={InstagramPage} />
        <Route path="/protest-beats" component={ProtestBeats} />
        <Route path="/tunes" component={Tunes} />
        <Route path="/experiment" component={Experiment} />
        <Route path="/instruments" component={Instruments} />
        <Route path="/theory" component={Theory} />
        <Route path="/shop" component={Shop} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-black text-white">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
