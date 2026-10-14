import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  OctagonMinus,
  Volume2,
  Gauge,
  Layers,
  Sliders,
  RotateCcw,
} from "lucide-react";
import PatternVisualizer from "./pattern-visualizer";
import InstrumentToggle from "./instrument-toggle";
import AudioContextWarning from "./audio-context-warning";
import DrummerPovBox, { type AllowedDrumInstrument } from "./drummer-pov-box";
import { useAudioEngine } from "@/lib/audio-engine";
import type { Tune } from "@/data/tunes";

interface BeatboxPlayerProps {
  tune: Tune;
  showDrummerPov?: boolean;
}

export default function BeatboxPlayer({ tune, showDrummerPov = false }: BeatboxPlayerProps) {
  // Automatically select the first available pattern
  const firstPatternName = Object.keys(tune.patterns)[0] || "Tune";
  const [selectedPattern, setSelectedPattern] = useState(firstPatternName);
  const [tempo, setTempo] = useState(tune.speed || 120);
  const [volume, setVolume] = useState(70);
  const [currentStep, setCurrentStep] = useState(0);
  const [soloInstrument, setSoloInstrument] = useState<AllowedDrumInstrument | null>(null);
  
  const [instrumentStates, setInstrumentStates] = useState<Record<string, { enabled: boolean; volume: number }>>({
    ls: { enabled: true, volume: 100 }, // 3x louder surdo
    ms: { enabled: true, volume: 100 }, // 3x louder surdo
    hs: { enabled: true, volume: 100 }, // 3x louder surdo
    re: { enabled: true, volume: 85 },
    sn: { enabled: true, volume: 90 },
    ta: { enabled: true, volume: 75 },
    ag: { enabled: true, volume: 25 }, // Very low agogo volume
    sh: { enabled: true, volume: 60 }
  });

  const effectiveInstrumentStates = useMemo(() => {
    if (!soloInstrument) return instrumentStates;
    const next: Record<string, { enabled: boolean; volume: number }> = {};
    for (const [key, state] of Object.entries(instrumentStates)) {
      next[key] = {
        ...state,
        enabled: key === soloInstrument,
      };
    }
    return next;
  }, [instrumentStates, soloInstrument]);

  // Update selected pattern when tune changes
  useEffect(() => {
    const firstPattern = Object.keys(tune.patterns)[0];
    if (firstPattern && !tune.patterns[selectedPattern]) {
      setSelectedPattern(firstPattern);
    }
  }, [tune, selectedPattern]);

  // Reset tempo when tune changes
  useEffect(() => {
    setTempo(tune.speed || 120);
  }, [tune.name, tune.speed]);

  const { isPlaying, isAudioLoaded, play, pause, stop } = useAudioEngine({
    tune,
    pattern: selectedPattern,
    tempo,
    volume,
    instrumentStates: effectiveInstrumentStates,
    onStepChange: setCurrentStep
  });

  const handleInstrumentToggle = useCallback((instrument: string, enabled: boolean) => {
    setSoloInstrument(null);
    setInstrumentStates(prev => ({
      ...prev,
      [instrument]: { ...prev[instrument], enabled }
    }));
  }, []);

  const handleInstrumentVolumeChange = useCallback((instrument: string, volume: number) => {
    setInstrumentStates(prev => ({
      ...prev,
      [instrument]: { ...prev[instrument], volume }
    }));
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const pattern = tune.patterns[selectedPattern];
  if (!pattern) return null;

  const patternKeys = Object.keys(tune.patterns);

  const enableAllInstruments = () => {
    setSoloInstrument(null);
    setInstrumentStates((prev) => {
      const next: Record<string, { enabled: boolean; volume: number }> = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = { ...v, enabled: true };
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full">
      {showDrummerPov && (
        <DrummerPovBox
          tune={tune}
          selectedPattern={selectedPattern}
          onSelectPattern={setSelectedPattern}
          tempo={tempo}
          onTempoChange={setTempo}
          isPlaying={isPlaying}
          isAudioLoaded={isAudioLoaded}
          currentStep={currentStep}
          onTogglePlayPause={togglePlayPause}
          onStop={stop}
          soloInstrument={soloInstrument}
          onSoloInstrumentChange={setSoloInstrument}
        />
      )}

      <Card className="bg-gray-900 border-gray-700 shadow-2xl overflow-hidden">
        <CardHeader className="px-3 sm:px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-black to-gray-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-red-500 shrink-0" />
              <CardTitle className="street-text text-xl sm:text-2xl text-white">
                D4P Multi-Track Player & Mixer
              </CardTitle>
              <Badge
                variant="outline"
                className="border-gray-700 bg-gray-800/80 text-gray-300 text-xs font-mono"
              >
                {tune.displayName || tune.name}
              </Badge>
            </div>

            {/* Unified Transport, Tempo & Master Volume Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                size="sm"
                onClick={togglePlayPause}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {!isAudioLoaded && isPlaying ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                    Loading...
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="mr-1.5 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4" />
                    Play
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stop}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <OctagonMinus className="mr-1.5 h-4 w-4" />
                Stop
              </Button>

              <div className="flex items-center gap-2 bg-black/80 border border-gray-800 px-2.5 py-1.5 rounded-lg">
                <Gauge className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="text-xs text-gray-400 hidden sm:inline">BPM</span>
                <Slider
                  value={[tempo]}
                  onValueChange={(value) => setTempo(value[0])}
                  min={30}
                  max={180}
                  step={1}
                  className="w-20 sm:w-24"
                />
                <span className="text-xs font-mono font-bold text-white w-12 text-right">
                  {tempo}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-black/80 border border-gray-800 px-2.5 py-1.5 rounded-lg">
                <Volume2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-16 sm:w-20"
                />
                <span className="text-xs font-mono text-gray-300 w-9 text-right">
                  {volume}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Section / Pattern Pills */}
          {patternKeys.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5 text-red-400" />
                Sections:
              </span>
              {patternKeys.map((patternName) => {
                const isSelected = selectedPattern === patternName;
                return (
                  <button
                    key={patternName}
                    type="button"
                    onClick={() => setSelectedPattern(patternName)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-red-600 text-white shadow-sm shadow-red-600/40"
                        : "bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-600 hover:text-white"
                    }`}
                  >
                    {tune.patterns[patternName]?.displayName || patternName}
                  </button>
                );
              })}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 p-3 sm:p-6 bg-gradient-to-b from-black via-gray-950 to-black">
          {/* Pattern Visualization */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
                Full Band Pattern Visualisation ({selectedPattern})
              </h3>
              {pattern.mnemonics?.ls && (
                <div className="text-xs text-amber-300/90 italic bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  "{pattern.mnemonics.ls}"
                </div>
              )}
            </div>
            <PatternVisualizer
              pattern={pattern}
              currentStep={currentStep}
              instrumentStates={effectiveInstrumentStates}
              isPlaying={isPlaying}
              beatsPerBar={pattern.time || tune.time || 4}
            />
          </div>

          {/* Instrument Toggles */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
                Instrument Channels & Levels
              </h3>
              <div className="flex items-center gap-2">
                {soloInstrument && (
                  <button
                    type="button"
                    onClick={() => setSoloInstrument(null)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                  >
                    Solo Active ({soloInstrument.toUpperCase()}) — Restore All
                  </button>
                )}
                <button
                  type="button"
                  onClick={enableAllInstruments}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Enable All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InstrumentToggle
                instrument="ls"
                label="Low Surdo"
                description="Bass drum"
                enabled={effectiveInstrumentStates.ls.enabled}
                volume={instrumentStates.ls.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="ms"
                label="Mid Surdo"
                description="Mid drum"
                enabled={effectiveInstrumentStates.ms.enabled}
                volume={instrumentStates.ms.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="hs"
                label="High Surdo"
                description="High drum"
                enabled={effectiveInstrumentStates.hs.enabled}
                volume={instrumentStates.hs.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="re"
                label="Repi"
                description="Repinique"
                enabled={effectiveInstrumentStates.re.enabled}
                volume={instrumentStates.re.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="sn"
                label="Snare"
                description="Caixa"
                enabled={effectiveInstrumentStates.sn.enabled}
                volume={instrumentStates.sn.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="ta"
                label="Tamborim"
                description="Tam"
                enabled={effectiveInstrumentStates.ta.enabled}
                volume={instrumentStates.ta.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="ag"
                label="Agogô"
                description="Bell"
                enabled={effectiveInstrumentStates.ag.enabled}
                volume={instrumentStates.ag.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
              <InstrumentToggle
                instrument="sh"
                label="Shaker"
                description="Chocalho"
                enabled={effectiveInstrumentStates.sh.enabled}
                volume={instrumentStates.sh.volume}
                onToggle={handleInstrumentToggle}
                onVolumeChange={handleInstrumentVolumeChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Audio Notice moved to the bottom of the page */}
      <AudioContextWarning />
    </div>
  );
}
