import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, OctagonMinus } from "lucide-react";
import PatternVisualizer from "./pattern-visualizer";
import InstrumentToggle from "./instrument-toggle";
import { useAudioEngine } from "@/lib/audio-engine";
import type { Tune } from "@/data/tunes";

interface ProtestBeatPlayerProps {
  tune: Tune;
  autoPlay?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface ProtestBeatPlayerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
}

const ProtestBeatPlayer = forwardRef<ProtestBeatPlayerRef, ProtestBeatPlayerProps>(({ tune, autoPlay = false, onPlayStateChange }, ref) => {
  // Automatically select the first available pattern
  const firstPatternName = Object.keys(tune.patterns)[0] || "Tune";
  const [selectedPattern, setSelectedPattern] = useState(firstPatternName);
  const [tempo, setTempo] = useState(tune.speed || 120);
  const [volume, setVolume] = useState(70);
  const [currentStep, setCurrentStep] = useState(0);
  
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

  // Update selected pattern when tune changes
  useEffect(() => {
    const firstPattern = Object.keys(tune.patterns)[0];
    if (firstPattern && !tune.patterns[selectedPattern]) {
      setSelectedPattern(firstPattern);
    }
  }, [tune, selectedPattern]);

  const { isPlaying, isAudioLoaded, play, pause, stop } = useAudioEngine({
    tune,
    pattern: selectedPattern,
    tempo,
    volume,
    instrumentStates,
    onStepChange: setCurrentStep
  });

  // Auto-play when requested and audio is loaded
  useEffect(() => {
    if (autoPlay && isAudioLoaded && !isPlaying) {
      play();
    }
  }, [autoPlay, isAudioLoaded, isPlaying, play]);

  // Notify parent of play state changes
  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    play,
    pause,
    stop,
    isPlaying
  }));

  const handleInstrumentToggle = useCallback((instrument: string, enabled: boolean) => {
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

  const currentPattern = tune.patterns[selectedPattern];
  if (!currentPattern) {
    return <div>Pattern not found</div>;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">{tune.displayName || tune.name}</CardTitle>
        {tune.description && <p className="text-gray-300">{tune.description}</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div>
          <h3 className="street-text font-semibold text-lg mb-3">Controls</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              onClick={togglePlayPause}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {!isAudioLoaded && isPlaying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading Audio...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Play
                </>
              )}
            </Button>
            <Button
              onClick={stop}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <OctagonMinus className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Tempo:</label>
              <Slider
                value={[tempo]}
                onValueChange={(value) => setTempo(value[0])}
                min={40}
                max={160}
                step={1}
                className="w-24"
              />
              <span className="text-sm w-12">{tempo}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Volume:</label>
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-24"
              />
              <span className="text-sm w-12">{volume}%</span>
            </div>
          </div>
        </div>

        {/* Pattern Visualization */}
        <div>
          <h3 className="street-text font-semibold text-lg mb-3">Pattern</h3>
          {Object.keys(tune.patterns).length > 1 && (
            <div className="mb-4">
              <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(tune.patterns).map((patternName) => (
                    <SelectItem key={patternName} value={patternName}>
                      {patternName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <PatternVisualizer 
            pattern={currentPattern} 
            currentStep={currentStep}
            instrumentStates={instrumentStates}
          />
        </div>

        {/* Instruments */}
        <div>
          <h3 className="street-text font-semibold text-lg mb-3">Instruments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InstrumentToggle
              instrument="ls"
              label="Low Surdo"
              description="Bass foundation"
              enabled={instrumentStates.ls.enabled}
              volume={instrumentStates.ls.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="ms"
              label="Mid Surdo"
              description="Rhythmic anchor"
              enabled={instrumentStates.ms.enabled}
              volume={instrumentStates.ms.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="hs"
              label="High Surdo"
              description="Melody rhythm"
              enabled={instrumentStates.hs.enabled}
              volume={instrumentStates.hs.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="re"
              label="Repinique"
              description="Lead drum"
              enabled={instrumentStates.re.enabled}
              volume={instrumentStates.re.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="sn"
              label="Snare"
              description="Sharp accent"
              enabled={instrumentStates.sn.enabled}
              volume={instrumentStates.sn.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="ta"
              label="Tamborim"
              description="High percussion"
              enabled={instrumentStates.ta.enabled}
              volume={instrumentStates.ta.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="ag"
              label="Agogô"
              description="Cowbell melody"
              enabled={instrumentStates.ag.enabled}
              volume={instrumentStates.ag.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
            <InstrumentToggle
              instrument="sh"
              label="Shaker"
              description="Chocalho"
              enabled={instrumentStates.sh.enabled}
              volume={instrumentStates.sh.volume}
              onToggle={handleInstrumentToggle}
              onVolumeChange={handleInstrumentVolumeChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProtestBeatPlayer.displayName = "ProtestBeatPlayer";

export default ProtestBeatPlayer;