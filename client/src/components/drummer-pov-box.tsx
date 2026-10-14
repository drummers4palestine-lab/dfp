import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, OctagonMinus, Gauge, Eye, Hand } from "lucide-react";
import type { Tune, TunePattern } from "@/data/tunes";

export type AllowedDrumInstrument = "sn" | "re" | "ls" | "ms" | "hs";

interface DrummerPovBoxProps {
  tune: Tune;
  selectedPattern: string;
  onSelectPattern: (pattern: string) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  isPlaying: boolean;
  isAudioLoaded: boolean;
  currentStep: number;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onStepSelect?: (step: number) => void;
}

type StrokeKind = "none" | "tap" | "accent" | "flam";

interface ParsedStep {
  index: number;
  rawChar: string;
  hand: "R" | "L";
  stroke: StrokeKind;
  beatNumber: number; // 1-based beat
  subdivisionLabel: string; // '1', 'e', '&', 'a'
}

const DRUM_INSTRUMENTS: Array<{
  key: AllowedDrumInstrument;
  label: string;
  subtitle: string;
}> = [
  { key: "sn", label: "Snare (Caixa)", subtitle: "Accents (X), Ghost Taps (.), Flams (f)" },
  { key: "re", label: "Repinique (Repi)", subtitle: "Accents (X), Rolls/Taps (r/h/.), Flams (f)" },
  { key: "ls", label: "Low Surdo", subtitle: "Primeira bass hits (X/0) & muted taps (s/r)" },
  { key: "ms", label: "Mid Surdo", subtitle: "Segunda counter-rhythm hits (X/0)" },
  { key: "hs", label: "High Surdo", subtitle: "Terceira syncopated cuts & fills (X/0)" },
];

/**
 * Resolves `@ls`, `@ms`, `@re`, etc. references inside a tune pattern
 */
function resolveInstrumentPattern(
  patternObj: TunePattern | undefined,
  instrument: AllowedDrumInstrument
): string {
  if (!patternObj) return "                ";

  let raw = patternObj[instrument];
  let safety = 0;
  while (typeof raw === "string" && raw.startsWith("@") && safety < 5) {
    const refKey = raw.slice(1);
    raw = patternObj[refKey];
    safety++;
  }

  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }

  // Fallback length from other instruments in the pattern
  const fallbackLengths = ["ls", "ms", "hs", "re", "sn"]
    .map((k) => {
      const val = patternObj[k];
      return typeof val === "string" && !val.startsWith("@") ? val.length : 0;
    })
    .filter((n) => n > 0);

  const len = fallbackLengths.length > 0 ? Math.max(...fallbackLengths) : 16;
  return " ".repeat(len);
}

function classifyChar(char: string): StrokeKind {
  if (!char || char === " ") return "none";
  if (char === "f") return "flam";
  if (char === "X" || char === "0") return "accent";
  // '.', 'r', 'h', 's', 'z', 'x', etc. -> tap / low-height stroke
  return "tap";
}

/**
 * Given a continuous step position `continuousStep` in [0, totalSteps),
 * computes the instantaneous height [0..1] and impact intensity [0..1]
 * for a specific hand ("R" or "L").
 */
function evaluateHandMotion(
  hand: "R" | "L",
  continuousStep: number,
  steps: ParsedStep[],
  isPlaying: boolean
): {
  height: number; // 0 = touching head, 0.14 = resting ready, 0.30 = tap peak, 1.0 = accent peak
  impact: number; // 0..1 flash at the moment of contact
  impactKind: StrokeKind;
  phaseLabel: "ACCENT" | "TAP" | "FLAM" | "LIFT" | "READY";
} {
  const N = steps.length;
  if (N === 0) {
    return { height: 0.12, impact: 0, impactKind: "none", phaseLabel: "READY" };
  }

  const baseRestHeight = 0.1;
  const normPos = ((continuousStep % N) + N) % N;

  // If paused, show the pose of the currently selected step
  if (!isPlaying) {
    const idx = Math.floor(normPos) % N;
    const step = steps[idx];
    if (step.hand === hand && step.stroke !== "none") {
      const isAccent = step.stroke === "accent" || step.stroke === "flam";
      return {
        height: isAccent ? 1.0 : 0.25,
        impact: 0.9,
        impactKind: step.stroke,
        phaseLabel:
          step.stroke === "flam"
            ? "FLAM"
            : isAccent
            ? "ACCENT"
            : "TAP",
      };
    }
    if (step.hand !== hand && step.stroke === "flam") {
      // Grace note hand on a flam
      return {
        height: 0.22,
        impact: 0.55,
        impactKind: "tap",
        phaseLabel: "TAP",
      };
    }
    return {
      height: baseRestHeight,
      impact: 0,
      impactKind: "none",
      phaseLabel: "READY",
    };
  }

  let height = baseRestHeight;
  let impact = 0;
  let impactKind: StrokeKind = "none";
  let phaseLabel: "ACCENT" | "TAP" | "FLAM" | "LIFT" | "READY" = "READY";

  // Check nearby steps around normPos for smooth wind-up, strike, and rebound
  for (let i = 0; i < N; i++) {
    const step = steps[i];
    const isMainHandHit = step.hand === hand && step.stroke !== "none";
    const isFlamGraceHand = step.hand !== hand && step.stroke === "flam";

    if (!isMainHandHit && !isFlamGraceHand) continue;

    const effectiveStroke: StrokeKind = isFlamGraceHand ? "tap" : step.stroke;
    const peakLift =
      effectiveStroke === "accent" || effectiveStroke === "flam" ? 1.0 : 0.26;

    // Flam grace note happens slightly earlier (-0.18 step offset)
    const hitCenter = isFlamGraceHand ? i - 0.16 : i;

    // Signed shortest distance on circular pattern: delta = normPos - hitCenter
    // delta < 0 means approaching the hit; delta == 0 is impact; delta > 0 is after impact
    let delta = normPos - hitCenter;
    if (delta > N / 2) delta -= N;
    if (delta < -N / 2) delta += N;

    // Wind-up window: [-1.15, -0.18] steps before hit -> smooth lift to peakLift
    // Strike down window: [-0.18, 0.0] -> rapid snap down from peakLift to 0 (drumhead contact)
    // Rebound window: [0.0, 0.65] -> smooth rebound from 0 back to baseRestHeight
    if (delta >= -1.15 && delta < -0.18) {
      const t = (delta + 1.15) / (1.15 - 0.18); // 0 -> 1
      const smooth = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const liftH = baseRestHeight + (peakLift - baseRestHeight) * smooth;
      if (liftH > height) {
        height = liftH;
        phaseLabel = "LIFT";
      }
    } else if (delta >= -0.18 && delta <= 0.0) {
      const t = (delta + 0.18) / 0.18; // 0 -> 1 (at 1, height = 0 on the drumhead)
      const easeIn = t * t;
      const strikeH = peakLift * (1 - easeIn);
      height = strikeH;
      if (t > 0.65) {
        impact = Math.max(impact, (t - 0.65) / 0.35);
        impactKind = effectiveStroke;
      }
      phaseLabel =
        effectiveStroke === "flam"
          ? "FLAM"
          : effectiveStroke === "accent"
          ? "ACCENT"
          : "TAP";
    } else if (delta > 0.0 && delta <= 0.65) {
      const t = delta / 0.65; // 0 -> 1
      const reboundCurve = Math.sin(t * Math.PI * 0.5);
      const rebH = baseRestHeight * reboundCurve;
      // Blend with any upcoming wind-up if another hit is close
      height = Math.max(rebH, height === baseRestHeight ? rebH : height);
      const fadeImpact = Math.max(0, 1 - delta / 0.38);
      if (fadeImpact > impact) {
        impact = fadeImpact;
        impactKind = effectiveStroke;
        phaseLabel =
          effectiveStroke === "flam"
            ? "FLAM"
            : effectiveStroke === "accent"
            ? "ACCENT"
            : "TAP";
      }
    }
  }

  return { height, impact, impactKind, phaseLabel };
}

export default function DrummerPovBox({
  tune,
  selectedPattern,
  onSelectPattern,
  tempo,
  onTempoChange,
  isPlaying,
  isAudioLoaded,
  currentStep,
  onTogglePlayPause,
  onStop,
}: DrummerPovBoxProps) {
  const [selectedInstrument, setSelectedInstrument] =
    useState<AllowedDrumInstrument>("sn");
  const [leadHand, setLeadHand] = useState<"R" | "L">("R");
  const [inspectedStep, setInspectedStep] = useState<number | null>(null);

  // Continuous step position for 60fps animation
  const [continuousStep, setContinuousStep] = useState<number>(0);
  const stepAnchorRef = useRef<{ step: number; time: number }>({
    step: 0,
    time: performance.now(),
  });

  const patternObj = tune.patterns[selectedPattern];
  const resolvedPatternString = useMemo(
    () => resolveInstrumentPattern(patternObj, selectedInstrument),
    [patternObj, selectedInstrument]
  );

  const SUBDIVISIONS = ["1", "e", "&", "a"];

  // Parse steps with strict 16th-note alternating sticking (R L R L or L R L R)
  const parsedSteps = useMemo<ParsedStep[]>(() => {
    const chars = resolvedPatternString.split("");
    return chars.map((rawChar, index) => {
      const isEven = index % 2 === 0;
      const hand: "R" | "L" =
        leadHand === "R" ? (isEven ? "R" : "L") : isEven ? "L" : "R";
      const stroke = classifyChar(rawChar);
      const beatNumber = Math.floor(index / 4) + 1;
      const subIdx = index % 4;
      const subdivisionLabel =
        subIdx === 0 ? String(beatNumber) : SUBDIVISIONS[subIdx];

      return {
        index,
        rawChar,
        hand,
        stroke,
        beatNumber,
        subdivisionLabel,
      };
    });
  }, [resolvedPatternString, leadHand]);

  const totalSteps = parsedSteps.length || 16;

  // Sync step anchor whenever audio engine advances `currentStep`
  useEffect(() => {
    // Note: in useAudioEngine, onStepChange(nextStep) is called right after playing the sound for (nextStep - 1).
    // Adjusting by -1 aligns the visual impact with the exact audio sound trigger.
    const alignedStep = isPlaying
      ? (currentStep - 1 + totalSteps) % totalSteps
      : currentStep % totalSteps;

    stepAnchorRef.current = {
      step: alignedStep,
      time: performance.now(),
    };
    if (!isPlaying) {
      setContinuousStep(alignedStep);
    }
  }, [currentStep, isPlaying, totalSteps]);

  // When paused and user clicks a step to inspect
  useEffect(() => {
    if (!isPlaying && inspectedStep !== null) {
      setContinuousStep(inspectedStep % totalSteps);
    }
  }, [inspectedStep, isPlaying, totalSteps]);

  // 60fps requestAnimationFrame loop while playing
  useEffect(() => {
    if (!isPlaying) return;
    setInspectedStep(null);

    let rafId: number;
    const tick = (now: number) => {
      const stepDurationMs = ((60 / Math.max(20, tempo)) * 1000) / 4;
      const elapsed = now - stepAnchorRef.current.time;
      const frac = Math.min(0.999, Math.max(0, elapsed / stepDurationMs));
      const pos = (stepAnchorRef.current.step + frac) % totalSteps;
      setContinuousStep(pos);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, tempo, totalSteps]);

  // Evaluate left and right hand states at the current continuous step
  const leftMotion = useMemo(
    () => evaluateHandMotion("L", continuousStep, parsedSteps, isPlaying),
    [continuousStep, parsedSteps, isPlaying]
  );
  const rightMotion = useMemo(
    () => evaluateHandMotion("R", continuousStep, parsedSteps, isPlaying),
    [continuousStep, parsedSteps, isPlaying]
  );

  // Precompute static waveform paths for Left Hand (L) and Right Hand (R) graphs
  const graphData = useMemo(() => {
    const sampleCount = Math.max(128, totalSteps * 10);
    const leftPoints: Array<{ x: number; y: number }> = [];
    const rightPoints: Array<{ x: number; y: number }> = [];

    for (let s = 0; s <= sampleCount; s++) {
      const stepPos = (s / sampleCount) * totalSteps;
      const xPct = (s / sampleCount) * 100;
      const l = evaluateHandMotion("L", stepPos, parsedSteps, true);
      const r = evaluateHandMotion("R", stepPos, parsedSteps, true);
      leftPoints.push({ x: xPct, y: l.height });
      rightPoints.push({ x: xPct, y: r.height });
    }

    const toSvgPath = (pts: Array<{ x: number; y: number }>, heightPx: number) => {
      const padTop = 8;
      const padBottom = 8;
      const usableH = heightPx - padTop - padBottom;
      return pts
        .map((p, idx) => {
          const svgX = (p.x / 100) * 600;
          const svgY = padTop + usableH * (1 - p.y);
          return `${idx === 0 ? "M" : "L"} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
        })
        .join(" ");
    };

    const toAreaPath = (pts: Array<{ x: number; y: number }>, heightPx: number) => {
      const line = toSvgPath(pts, heightPx);
      return `${line} L 600 ${heightPx} L 0 ${heightPx} Z`;
    };

    return {
      leftLine: toSvgPath(leftPoints, 64),
      leftArea: toAreaPath(leftPoints, 64),
      rightLine: toSvgPath(rightPoints, 64),
      rightArea: toAreaPath(rightPoints, 64),
    };
  }, [parsedSteps, totalSteps]);

  const activeStepIndex = Math.floor(((continuousStep % totalSteps) + totalSteps) % totalSteps);
  const activeParsedStep = parsedSteps[activeStepIndex] || parsedSteps[0];
  const baseTuneTempo = tune.speed || 120;

  const currentInstrumentMeta =
    DRUM_INSTRUMENTS.find((d) => d.key === selectedInstrument) ||
    DRUM_INSTRUMENTS[0];

  // Compute top-down stick & hand transforms from height [0..1]
  // Height = 0: tip is at the strike zone on the black drumhead
  // Height = 1 (Accent): hand & stick lift noticeably higher up toward the viewer (larger POV scale, upward Y lift, wrist tilt, and stick foreshortening)
  const leftAccentBoost = Math.pow(leftMotion.height, 1.25);
  const leftScale = 1 + leftMotion.height * 0.28 + leftAccentBoost * 0.2;
  const leftPullBackY = -leftMotion.height * 34 - leftAccentBoost * 24;
  const leftPullBackX = -leftMotion.height * 18;
  const leftRotateDeg = -leftMotion.height * 16;
  const leftTipLiftY = -leftAccentBoost * 28;
  const leftTipLiftX = -leftAccentBoost * 10;

  const rightAccentBoost = Math.pow(rightMotion.height, 1.25);
  const rightScale = 1 + rightMotion.height * 0.28 + rightAccentBoost * 0.2;
  const rightPullBackY = -rightMotion.height * 34 - rightAccentBoost * 24;
  const rightPullBackX = rightMotion.height * 18;
  const rightRotateDeg = rightMotion.height * 16;
  const rightTipLiftY = -rightAccentBoost * 28;
  const rightTipLiftX = rightAccentBoost * 10;

  const playheadXPct = ((continuousStep % totalSteps) / totalSteps) * 100;

  return (
    <Card className="bg-gray-900 border-gray-700 shadow-2xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Eye className="h-5 w-5 text-red-500" />
              <CardTitle className="street-text text-2xl text-white">
                Drummer POV Trainer
              </CardTitle>
              <Badge
                variant="outline"
                className="border-red-500/50 bg-red-500/10 text-red-400 text-xs"
              >
                First-Person Top View
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Look down at your hands & sticks — replicate{" "}
              <span className="text-red-400 font-semibold">high stick lifts for Accents (X)</span>{" "}
              and{" "}
              <span className="text-cyan-400 font-semibold">low wrist motion for Taps (.)</span>
            </p>
          </div>

          {/* Instrument & Sticking Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Instrument Dropdown (Snare, Repi, Low/Mid/High Surdo) */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Instrument:
              </span>
              <Select
                value={selectedInstrument}
                onValueChange={(val) =>
                  setSelectedInstrument(val as AllowedDrumInstrument)
                }
              >
                <SelectTrigger
                  data-testid="pov-instrument-select"
                  className="w-48 bg-black border-gray-700 text-white font-medium h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  {DRUM_INSTRUMENTS.map((inst) => (
                    <SelectItem
                      key={inst.key}
                      value={inst.key}
                      className="text-white hover:bg-gray-800 focus:bg-gray-800"
                    >
                      {inst.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pattern Selector */}
            {Object.keys(tune.patterns).length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Section:
                </span>
                <Select value={selectedPattern} onValueChange={onSelectPattern}>
                  <SelectTrigger className="w-36 bg-black border-gray-700 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {Object.keys(tune.patterns).map((patternName) => (
                      <SelectItem
                        key={patternName}
                        value={patternName}
                        className="text-white hover:bg-gray-800 focus:bg-gray-800"
                      >
                        {patternName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Right / Left Hand Lead Toggle */}
            <div className="flex items-center bg-black border border-gray-700 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setLeadHand("R")}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  leadHand === "R"
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Right-hand lead on the beat (1 e & a = R L R L)"
              >
                R-Lead (RLRL)
              </button>
              <button
                type="button"
                onClick={() => setLeadHand("L")}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  leadHand === "L"
                    ? "bg-cyan-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Left-hand lead on the beat (1 e & a = L R L R)"
              >
                L-Lead (LRLR)
              </button>
            </div>
          </div>
        </div>

        {/* Speed / Playback Bar */}
        <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onTogglePlayPause}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[110px]"
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
              onClick={onStop}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <OctagonMinus className="mr-1.5 h-4 w-4" />
              Stop
            </Button>
            <span className="text-xs text-gray-400 hidden sm:inline ml-2">
              {currentInstrumentMeta.subtitle}
            </span>
          </div>

          {/* Speed Up / Slow Down Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-black/80 border border-gray-800 px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
              <Gauge className="h-3.5 w-3.5 text-red-400" />
              <span>Speed:</span>
            </div>

            {/* Multiplier preset buttons */}
            <div className="flex items-center gap-1">
              {[
                { label: "0.5x", mult: 0.5 },
                { label: "0.75x", mult: 0.75 },
                { label: "1x", mult: 1 },
                { label: "1.25x", mult: 1.25 },
              ].map((preset) => {
                const targetBpm = Math.max(
                  30,
                  Math.min(180, Math.round(baseTuneTempo * preset.mult))
                );
                const isActive = Math.abs(tempo - targetBpm) <= 2;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onTempoChange(targetBpm)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                      isActive
                        ? "bg-red-600 text-white font-bold"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Fine step down / slider / step up */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTempoChange(Math.max(30, tempo - 5))}
                className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono"
                title="Slow down by 5 BPM"
              >
                -5
              </button>
              <Slider
                value={[tempo]}
                onValueChange={(v) => onTempoChange(v[0])}
                min={30}
                max={180}
                step={1}
                className="w-24 sm:w-32"
              />
              <button
                type="button"
                onClick={() => onTempoChange(Math.min(180, tempo + 5))}
                className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono"
                title="Speed up by 5 BPM"
              >
                +5
              </button>
              <span className="text-xs font-mono font-bold text-white min-w-[62px] text-right">
                {tempo} BPM
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6 bg-gradient-to-b from-black via-gray-950 to-black">
        {/* Main Grid: Left = First-Person Top-Down Drum & Translucent Hands | Right = Two Hand Motion Graphs */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN: First-Person Top-Down Plain Black Drum & Translucent Hands */}
          <div className="xl:col-span-6 flex flex-col justify-between bg-[#050507] border border-gray-800/90 rounded-2xl p-4 relative overflow-hidden shadow-inner">
            {/* Top Status Overlay */}
            <div className="flex items-center justify-between z-10 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-gray-900/90 border border-gray-800 text-gray-300">
                  Beat <strong className="text-white">{activeParsedStep?.beatNumber || 1}</strong>{" "}
                  <span className="text-gray-500">•</span> Sub{" "}
                  <strong className="text-yellow-400">
                    {activeParsedStep?.subdivisionLabel || "1"}
                  </strong>
                </span>
                <span className="text-xs font-mono text-gray-500">
                  Step {activeStepIndex + 1}/{totalSteps}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow shadow-cyan-400/50" />
                  Tap (.) Low Stick
                </span>
                <span className="flex items-center gap-1.5 text-red-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow shadow-red-500/50" />
                  Accent (X) High Lift
                </span>
              </div>
            </div>

            {/* SVG First-Person Top-Down Drum & Translucent Hands */}
            <div className="relative w-full max-w-[440px] mx-auto aspect-[11/10] flex items-center justify-center">
              <svg
                viewBox="0 0 500 450"
                className="w-full h-full select-none overflow-visible"
                role="img"
                aria-label="First-person top-down drummer view with left and right translucent hands and drumsticks over a plain black drum"
              >
                <defs>
                  {/* Plain Matte Black Drumhead Gradient */}
                  <radialGradient id="plainBlackDrumHead" cx="50%" cy="48%" r="52%">
                    <stop offset="0%" stopColor="#141419" />
                    <stop offset="62%" stopColor="#09090c" />
                    <stop offset="92%" stopColor="#040406" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>

                  {/* Dark Metallic Rim Gradient */}
                  <linearGradient id="darkDrumRim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2c2c34" />
                    <stop offset="50%" stopColor="#15151a" />
                    <stop offset="100%" stopColor="#26262e" />
                  </linearGradient>

                  {/* Translucent Left Hand Fill (See-through cyan-tinted ghost hand) */}
                  <linearGradient id="leftGhostHand" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.42" />
                    <stop offset="55%" stopColor="#0284c7" stopOpacity="0.26" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.12" />
                  </linearGradient>

                  {/* Translucent Right Hand Fill (See-through warm/red-tinted ghost hand) */}
                  <linearGradient id="rightGhostHand" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.42" />
                    <stop offset="55%" stopColor="#dc2626" stopOpacity="0.26" />
                    <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.12" />
                  </linearGradient>

                  {/* Drumstick Wood/Carbon Gradient */}
                  <linearGradient id="stickBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d6b384" />
                    <stop offset="50%" stopColor="#f5deb3" />
                    <stop offset="100%" stopColor="#b89058" />
                  </linearGradient>

                  {/* Soft glow filter */}
                  <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Subtle Left & Right Vertical Stick Height Gauges beside the drum */}
                {/* Left Hand Height Meter */}
                <g transform="translate(22, 70)">
                  <text
                    x="12"
                    y="-10"
                    textAnchor="middle"
                    className="fill-cyan-400 text-[11px] font-mono font-bold"
                  >
                    L
                  </text>
                  <rect
                    x="6"
                    y="0"
                    width="12"
                    height="210"
                    rx="6"
                    fill="#0d0d12"
                    stroke="#1f2937"
                    strokeWidth="1.5"
                  />
                  {/* Tap threshold tick */}
                  <line
                    x1="2"
                    y1={210 * (1 - 0.3)}
                    x2="22"
                    y2={210 * (1 - 0.3)}
                    stroke="#22d3ee"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Accent threshold tick */}
                  <line
                    x1="2"
                    y1={210 * (1 - 0.9)}
                    x2="22"
                    y2={210 * (1 - 0.9)}
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x="8"
                    y={210 * (1 - Math.min(1, leftMotion.height))}
                    width="8"
                    height={Math.max(4, 210 * Math.min(1, leftMotion.height))}
                    rx="4"
                    fill={leftMotion.height > 0.5 ? "#ef4444" : "#22d3ee"}
                  />
                </g>

                {/* Right Hand Height Meter */}
                <g transform="translate(454, 70)">
                  <text
                    x="12"
                    y="-10"
                    textAnchor="middle"
                    className="fill-red-400 text-[11px] font-mono font-bold"
                  >
                    R
                  </text>
                  <rect
                    x="6"
                    y="0"
                    width="12"
                    height="210"
                    rx="6"
                    fill="#0d0d12"
                    stroke="#1f2937"
                    strokeWidth="1.5"
                  />
                  {/* Tap threshold tick */}
                  <line
                    x1="2"
                    y1={210 * (1 - 0.3)}
                    x2="22"
                    y2={210 * (1 - 0.3)}
                    stroke="#22d3ee"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Accent threshold tick */}
                  <line
                    x1="2"
                    y1={210 * (1 - 0.9)}
                    x2="22"
                    y2={210 * (1 - 0.9)}
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x="8"
                    y={210 * (1 - Math.min(1, rightMotion.height))}
                    width="8"
                    height={Math.max(4, 210 * Math.min(1, rightMotion.height))}
                    rx="4"
                    fill={rightMotion.height > 0.5 ? "#ef4444" : "#f87171"}
                  />
                </g>

                {/* ================= PLAIN BLACK DRUM (TOP-DOWN VIEW) ================= */}
                <g transform="translate(250, 185)">
                  {/* Outer ambient shadow */}
                  <circle cx="0" cy="6" r="158" fill="#000000" opacity="0.85" />

                  {/* Outer Rim / Hoop */}
                  <circle
                    cx="0"
                    cy="0"
                    r="152"
                    fill="url(#darkDrumRim)"
                    stroke="#374151"
                    strokeWidth="2.5"
                  />

                  {/* 8 Tension Lugs around the Drum Rim */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <g key={deg} transform={`rotate(${deg})`}>
                      <rect
                        x="-5"
                        y="-158"
                        width="10"
                        height="9"
                        rx="2"
                        fill="#4b5563"
                        stroke="#111827"
                        strokeWidth="1"
                      />
                    </g>
                  ))}

                  {/* Plain Matte Black Drumhead */}
                  <circle
                    cx="0"
                    cy="0"
                    r="140"
                    fill="url(#plainBlackDrumHead)"
                    stroke="#1f2937"
                    strokeWidth="2"
                  />

                  {/* Subtle Playing Zone Guides on the Black Drumhead */}
                  <circle
                    cx="0"
                    cy="0"
                    r="95"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="46"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.1"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />

                  {/* Left Stick Target Point & Impact Ripples (x = -22, y = -6) */}
                  <circle
                    cx="-22"
                    cy="-6"
                    r="5"
                    fill="#38bdf8"
                    fillOpacity="0.18"
                  />
                  {leftMotion.impact > 0.05 && (
                    <g transform="translate(-22, -6)">
                      <circle
                        cx="0"
                        cy="0"
                        r={
                          (leftMotion.impactKind === "accent" ||
                          leftMotion.impactKind === "flam"
                            ? 48
                            : 24) *
                          (1.15 - leftMotion.impact * 0.4)
                        }
                        fill="none"
                        stroke={
                          leftMotion.impactKind === "accent" ||
                          leftMotion.impactKind === "flam"
                            ? "#ef4444"
                            : "#22d3ee"
                        }
                        strokeWidth={
                          leftMotion.impactKind === "accent" ||
                          leftMotion.impactKind === "flam"
                            ? 3.5
                            : 2
                        }
                        strokeOpacity={leftMotion.impact * 0.9}
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={
                          (leftMotion.impactKind === "accent" ||
                          leftMotion.impactKind === "flam"
                            ? 22
                            : 11) * leftMotion.impact
                        }
                        fill={
                          leftMotion.impactKind === "accent" ||
                          leftMotion.impactKind === "flam"
                            ? "#ef4444"
                            : "#22d3ee"
                        }
                        fillOpacity={leftMotion.impact * 0.45}
                      />
                    </g>
                  )}

                  {/* Right Stick Target Point & Impact Ripples (x = 22, y = -6) */}
                  <circle
                    cx="22"
                    cy="-6"
                    r="5"
                    fill="#f87171"
                    fillOpacity="0.18"
                  />
                  {rightMotion.impact > 0.05 && (
                    <g transform="translate(22, -6)">
                      <circle
                        cx="0"
                        cy="0"
                        r={
                          (rightMotion.impactKind === "accent" ||
                          rightMotion.impactKind === "flam"
                            ? 48
                            : 24) *
                          (1.15 - rightMotion.impact * 0.4)
                        }
                        fill="none"
                        stroke={
                          rightMotion.impactKind === "accent" ||
                          rightMotion.impactKind === "flam"
                            ? "#ef4444"
                            : "#22d3ee"
                        }
                        strokeWidth={
                          rightMotion.impactKind === "accent" ||
                          rightMotion.impactKind === "flam"
                            ? 3.5
                            : 2
                        }
                        strokeOpacity={rightMotion.impact * 0.9}
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={
                          (rightMotion.impactKind === "accent" ||
                          rightMotion.impactKind === "flam"
                            ? 22
                            : 11) * rightMotion.impact
                        }
                        fill={
                          rightMotion.impactKind === "accent" ||
                          rightMotion.impactKind === "flam"
                            ? "#ef4444"
                            : "#22d3ee"
                        }
                        fillOpacity={rightMotion.impact * 0.45}
                      />
                    </g>
                  )}
                </g>

                {/* ================= STICK SHADOWS ON THE BLACK DRUMHEAD ================= */}
                {/* Left Stick Shadow (stays grounded on the drumhead while hand/stick lifts high above it) */}
                <line
                  x1={145 - leftMotion.height * 10}
                  y1={345 + leftMotion.height * 12}
                  x2={228 - leftMotion.height * 6}
                  y2={179 + leftMotion.height * 10}
                  stroke="#000000"
                  strokeWidth={8 + leftMotion.height * 10}
                  strokeLinecap="round"
                  opacity={Math.max(0.14, 0.7 - leftMotion.height * 0.45)}
                />

                {/* Right Stick Shadow */}
                <line
                  x1={355 + rightMotion.height * 10}
                  y1={345 + rightMotion.height * 12}
                  x2={272 + rightMotion.height * 6}
                  y2={179 + rightMotion.height * 10}
                  stroke="#000000"
                  strokeWidth={8 + rightMotion.height * 10}
                  strokeLinecap="round"
                  opacity={Math.max(0.14, 0.7 - rightMotion.height * 0.45)}
                />

                {/* ================= LEFT HAND & DRUMSTICK (SEE-THROUGH POV) ================= */}
                <g
                  transform={`translate(${leftPullBackX}, ${leftPullBackY}) translate(155, 330) rotate(${leftRotateDeg}) scale(${leftScale}) translate(-155, -330)`}
                >
                  {/* Drumstick shaft (from inside grip at 132,372 to tip lifted during accents) */}
                  <line
                    x1="132"
                    y1="372"
                    x2={228 + leftTipLiftX}
                    y2={179 + leftTipLiftY}
                    stroke="url(#stickBodyGrad)"
                    strokeWidth="7.5"
                    strokeLinecap="round"
                  />
                  {/* Tapered stick neck */}
                  <line
                    x1={196 + leftTipLiftX * 0.55}
                    y1={243 + leftTipLiftY * 0.55}
                    x2={228 + leftTipLiftX}
                    y2={179 + leftTipLiftY}
                    stroke="#fef3c7"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Stick Bead / Tip */}
                  <ellipse
                    cx={228 + leftTipLiftX}
                    cy={179 + leftTipLiftY}
                    rx={5.5 + leftAccentBoost * 2}
                    ry={7 + leftAccentBoost * 2.5}
                    transform={`rotate(26, ${228 + leftTipLiftX}, ${179 + leftTipLiftY})`}
                    fill={
                      leftMotion.impact > 0.2 || leftMotion.height > 0.6
                        ? leftMotion.impactKind === "accent" ||
                          leftMotion.impactKind === "flam" ||
                          leftMotion.height > 0.6
                          ? "#ef4444"
                          : "#22d3ee"
                        : "#ffffff"
                    }
                  />

                  {/* See-Through-ish Left Hand (Matched Grip, Top-Down Drummer POV) */}
                  <g
                     transform="translate(152, 334) rotate(26)"
                    className="transition-opacity"
                  >
                    {/* Forearm / Wrist Cuff (semi-transparent) */}
                    <path
                      d="M -26 42 L -20 98 L 24 98 L 28 42 Z"
                      fill="url(#leftGhostHand)"
                      stroke="#38bdf8"
                      strokeOpacity="0.45"
                      strokeWidth="1.5"
                    />
                    {/* Back of Hand / Palm Silhouette (see-through) */}
                    <rect
                      x="-30"
                      y="-18"
                      width="58"
                      height="64"
                      rx="18"
                      fill="url(#leftGhostHand)"
                      stroke="#7dd3fc"
                      strokeOpacity="0.7"
                      strokeWidth="1.8"
                    />
                    {/* Curled Fingers wrapping around the stick (Index, Middle, Ring, Pinky) */}
                    <rect
                      x="-26"
                      y="-28"
                      width="44"
                      height="14"
                      rx="7"
                      fill="url(#leftGhostHand)"
                      stroke="#7dd3fc"
                      strokeOpacity="0.75"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="-28"
                      y="-13"
                      width="46"
                      height="13"
                      rx="6.5"
                      fill="url(#leftGhostHand)"
                      stroke="#7dd3fc"
                      strokeOpacity="0.65"
                      strokeWidth="1.3"
                    />
                    <rect
                      x="-28"
                      y="1"
                      width="44"
                      height="13"
                      rx="6.5"
                      fill="url(#leftGhostHand)"
                      stroke="#7dd3fc"
                      strokeOpacity="0.55"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="-26"
                      y="15"
                      width="40"
                      height="12"
                      rx="6"
                      fill="url(#leftGhostHand)"
                      stroke="#7dd3fc"
                      strokeOpacity="0.45"
                      strokeWidth="1.2"
                    />
                    {/* Thumb pressing along the stick fulcrum (inner right side of left hand) */}
                    <ellipse
                      cx="22"
                      cy="-8"
                      rx="11"
                      ry="24"
                      transform="rotate(-14, 22, -8)"
                      fill="url(#leftGhostHand)"
                      stroke="#bae6fd"
                      strokeOpacity="0.85"
                      strokeWidth="1.8"
                    />
                    {/* Subtle anatomical knuckle/tendon guide lines for x-ray/ghost look */}
                    <line
                      x1="-12"
                      y1="8"
                      x2="-12"
                      y2="38"
                      stroke="#bae6fd"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="0"
                      y1="5"
                      x2="0"
                      y2="38"
                      stroke="#bae6fd"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="8"
                      x2="10"
                      y2="38"
                      stroke="#bae6fd"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    {/* "L" Hand Badge */}
                    <circle
                      cx="0"
                      cy="26"
                      r="11"
                      fill="#082f49"
                      fillOpacity="0.75"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="30"
                      textAnchor="middle"
                      className="fill-cyan-200 text-[11px] font-mono font-bold"
                    >
                      L
                    </text>
                  </g>
                </g>

                {/* ================= RIGHT HAND & DRUMSTICK (SEE-THROUGH POV) ================= */}
                <g
                  transform={`translate(${rightPullBackX}, ${rightPullBackY}) translate(345, 330) rotate(${rightRotateDeg}) scale(${rightScale}) translate(-345, -330)`}
                >
                  {/* Drumstick shaft (from inside grip at 368,372 to tip lifted during accents) */}
                  <line
                    x1="368"
                    y1="372"
                    x2={272 + rightTipLiftX}
                    y2={179 + rightTipLiftY}
                    stroke="url(#stickBodyGrad)"
                    strokeWidth="7.5"
                    strokeLinecap="round"
                  />
                  {/* Tapered stick neck */}
                  <line
                    x1={304 + rightTipLiftX * 0.55}
                    y1={243 + rightTipLiftY * 0.55}
                    x2={272 + rightTipLiftX}
                    y2={179 + rightTipLiftY}
                    stroke="#fef3c7"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Stick Bead / Tip */}
                  <ellipse
                    cx={272 + rightTipLiftX}
                    cy={179 + rightTipLiftY}
                    rx={5.5 + rightAccentBoost * 2}
                    ry={7 + rightAccentBoost * 2.5}
                    transform={`rotate(-26, ${272 + rightTipLiftX}, ${179 + rightTipLiftY})`}
                    fill={
                      rightMotion.impact > 0.2 || rightMotion.height > 0.6
                        ? rightMotion.impactKind === "accent" ||
                          rightMotion.impactKind === "flam" ||
                          rightMotion.height > 0.6
                          ? "#ef4444"
                          : "#22d3ee"
                        : "#ffffff"
                    }
                  />

                  {/* See-Through-ish Right Hand (Matched Grip, Top-Down Drummer POV) */}
                  <g transform="translate(348, 334) rotate(-26)">
                    {/* Forearm / Wrist Cuff (semi-transparent) */}
                    <path
                      d="M -28 42 L -24 98 L 20 98 L 26 42 Z"
                      fill="url(#rightGhostHand)"
                      stroke="#f87171"
                      strokeOpacity="0.45"
                      strokeWidth="1.5"
                    />
                    {/* Back of Hand / Palm Silhouette (see-through) */}
                    <rect
                      x="-28"
                      y="-18"
                      width="58"
                      height="64"
                      rx="18"
                      fill="url(#rightGhostHand)"
                      stroke="#fca5a5"
                      strokeOpacity="0.7"
                      strokeWidth="1.8"
                    />
                    {/* Curled Fingers wrapping around the stick */}
                    <rect
                      x="-18"
                      y="-28"
                      width="44"
                      height="14"
                      rx="7"
                      fill="url(#rightGhostHand)"
                      stroke="#fca5a5"
                      strokeOpacity="0.75"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="-18"
                      y="-13"
                      width="46"
                      height="13"
                      rx="6.5"
                      fill="url(#rightGhostHand)"
                      stroke="#fca5a5"
                      strokeOpacity="0.65"
                      strokeWidth="1.3"
                    />
                    <rect
                      x="-16"
                      y="1"
                      width="44"
                      height="13"
                      rx="6.5"
                      fill="url(#rightGhostHand)"
                      stroke="#fca5a5"
                      strokeOpacity="0.55"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="-14"
                      y="15"
                      width="40"
                      height="12"
                      rx="6"
                      fill="url(#rightGhostHand)"
                      stroke="#fca5a5"
                      strokeOpacity="0.45"
                      strokeWidth="1.2"
                    />
                    {/* Thumb pressing along the stick fulcrum (inner left side of right hand) */}
                    <ellipse
                      cx="-22"
                      cy="-8"
                      rx="11"
                      ry="24"
                      transform="rotate(14, -22, -8)"
                      fill="url(#rightGhostHand)"
                      stroke="#fecaca"
                      strokeOpacity="0.85"
                      strokeWidth="1.8"
                    />
                    {/* Subtle anatomical knuckle/tendon guide lines */}
                    <line
                      x1="-12"
                      y1="8"
                      x2="-10"
                      y2="38"
                      stroke="#fecaca"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="0"
                      y1="5"
                      x2="0"
                      y2="38"
                      stroke="#fecaca"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="8"
                      x2="12"
                      y2="38"
                      stroke="#fecaca"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    {/* "R" Hand Badge */}
                    <circle
                      cx="0"
                      cy="26"
                      r="11"
                      fill="#450a0a"
                      fillOpacity="0.75"
                      stroke="#f87171"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="30"
                      textAnchor="middle"
                      className="fill-red-200 text-[11px] font-mono font-bold"
                    >
                      R
                    </text>
                  </g>
                </g>

                {/* Drummer Perspective Label at Bottom */}
                <text
                  x="250"
                  y="442"
                  textAnchor="middle"
                  className="fill-gray-500 text-[10px] font-mono tracking-widest uppercase"
                >
                  ▲ First-Person Drummer POV (Looking Down) ▲
                </text>
              </svg>
            </div>

            {/* Bottom Live Hand Action Callouts */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-gray-900/90 border border-cyan-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hand className="h-4 w-4 text-cyan-400 -scale-x-100" />
                  <div>
                    <div className="text-xs font-bold text-cyan-300">LEFT HAND (L)</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Lift: {Math.round(leftMotion.height * 100)}%
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    leftMotion.phaseLabel === "ACCENT" ||
                    leftMotion.phaseLabel === "FLAM"
                      ? "bg-red-600 text-white"
                      : leftMotion.phaseLabel === "TAP"
                      ? "bg-cyan-600 text-white"
                      : leftMotion.phaseLabel === "LIFT"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {leftMotion.phaseLabel}
                </span>
              </div>

              <div className="bg-gray-900/90 border border-red-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hand className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="text-xs font-bold text-red-300">RIGHT HAND (R)</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Lift: {Math.round(rightMotion.height * 100)}%
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    rightMotion.phaseLabel === "ACCENT" ||
                    rightMotion.phaseLabel === "FLAM"
                      ? "bg-red-600 text-white"
                      : rightMotion.phaseLabel === "TAP"
                      ? "bg-cyan-600 text-white"
                      : rightMotion.phaseLabel === "LIFT"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {rightMotion.phaseLabel}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Two Hand Motion Graphs (Left Hand Graph + Right Hand Graph) & Sticking Strip */}
          <div className="xl:col-span-6 flex flex-col justify-between space-y-4">
            {/* LEFT HAND (L) MOTION GRAPH */}
            <div className="bg-[#07080d] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h4 className="text-sm font-bold text-cyan-300 tracking-wide uppercase font-mono">
                    Left Hand (L) Stick Height Graph
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400">
                  <span className="text-red-400">High Peak = Accent (X)</span>
                  <span className="text-cyan-400">Low Bump = Tap (.)</span>
                </div>
              </div>

              <div className="relative h-20 w-full bg-black/80 rounded-lg border border-gray-800/80 overflow-hidden">
                <svg
                  viewBox="0 0 600 64"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Accent Height Guide Line */}
                  <line
                    x1="0"
                    y1="12"
                    x2="600"
                    y2="12"
                    stroke="#ef4444"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  {/* Tap Height Guide Line */}
                  <line
                    x1="0"
                    y1="42"
                    x2="600"
                    y2="42"
                    stroke="#22d3ee"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Area under curve */}
                  <path
                    d={graphData.leftArea}
                    fill="#06b6d4"
                    fillOpacity="0.16"
                  />
                  {/* Smooth trajectory curve */}
                  <path
                    d={graphData.leftLine}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.2"
                  />
                </svg>

                {/* Hit markers along the Left Hand graph */}
                <div className="absolute inset-0 pointer-events-none">
                  {parsedSteps.map((st) => {
                    if (st.hand !== "L" || st.stroke === "none") return null;
                    const leftPct = ((st.index + 0.5) / totalSteps) * 100;
                    const isAccent = st.stroke === "accent" || st.stroke === "flam";
                    return (
                      <div
                        key={st.index}
                        style={{ left: `${leftPct}%` }}
                        className="absolute -translate-x-1/2 flex flex-col items-center"
                      >
                        <span
                          className={`mt-1 px-1 rounded text-[9px] font-mono font-bold ${
                            isAccent
                              ? "bg-red-500/90 text-white"
                              : "bg-cyan-500/80 text-black"
                          }`}
                        >
                          {isAccent ? "X" : "."}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Live Playhead Cursor */}
                <div
                  style={{ left: `${playheadXPct}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-300 shadow-[0_0_8px_#22d3ee] pointer-events-none"
                />
              </div>
            </div>

            {/* RIGHT HAND (R) MOTION GRAPH */}
            <div className="bg-[#07080d] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <h4 className="text-sm font-bold text-red-300 tracking-wide uppercase font-mono">
                    Right Hand (R) Stick Height Graph
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400">
                  <span className="text-red-400">High Peak = Accent (X)</span>
                  <span className="text-cyan-400">Low Bump = Tap (.)</span>
                </div>
              </div>

              <div className="relative h-20 w-full bg-black/80 rounded-lg border border-gray-800/80 overflow-hidden">
                <svg
                  viewBox="0 0 600 64"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Accent Height Guide Line */}
                  <line
                    x1="0"
                    y1="12"
                    x2="600"
                    y2="12"
                    stroke="#ef4444"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  {/* Tap Height Guide Line */}
                  <line
                    x1="0"
                    y1="42"
                    x2="600"
                    y2="42"
                    stroke="#22d3ee"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Area under curve */}
                  <path
                    d={graphData.rightArea}
                    fill="#ef4444"
                    fillOpacity="0.16"
                  />
                  {/* Smooth trajectory curve */}
                  <path
                    d={graphData.rightLine}
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2.2"
                  />
                </svg>

                {/* Hit markers along the Right Hand graph */}
                <div className="absolute inset-0 pointer-events-none">
                  {parsedSteps.map((st) => {
                    if (st.hand !== "R" || st.stroke === "none") return null;
                    const leftPct = ((st.index + 0.5) / totalSteps) * 100;
                    const isAccent = st.stroke === "accent" || st.stroke === "flam";
                    return (
                      <div
                        key={st.index}
                        style={{ left: `${leftPct}%` }}
                        className="absolute -translate-x-1/2 flex flex-col items-center"
                      >
                        <span
                          className={`mt-1 px-1 rounded text-[9px] font-mono font-bold ${
                            isAccent
                              ? "bg-red-500/90 text-white"
                              : "bg-cyan-500/80 text-black"
                          }`}
                        >
                          {isAccent ? "X" : "."}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Live Playhead Cursor */}
                <div
                  style={{ left: `${playheadXPct}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400 shadow-[0_0_8px_#ef4444] pointer-events-none"
                />
              </div>
            </div>

            {/* STEP-BY-STEP STICKING BREAKDOWN (1 e & a / R L R L) */}
            <div className="bg-[#07080d] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
                  Sticking & Stroke Grid ({currentInstrumentMeta.label})
                </h4>
                <span className="text-[11px] text-gray-400">
                  Click any step while paused to inspect hand position
                </span>
              </div>

              <div className="overflow-x-auto pb-1">
                <div
                  className="grid gap-1 min-w-[460px]"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(16, totalSteps)}, minmax(0, 1fr))`,
                  }}
                >
                  {parsedSteps.map((st) => {
                    const isCurrent = st.index === activeStepIndex;
                    const isAccent = st.stroke === "accent" || st.stroke === "flam";
                    const isTap = st.stroke === "tap";
                    const isBeatStart = st.index % 4 === 0;

                    return (
                      <button
                        key={st.index}
                        type="button"
                        onClick={() => setInspectedStep(st.index)}
                        className={`flex flex-col items-center py-1.5 px-1 rounded-lg border transition-all ${
                          isCurrent
                            ? "bg-red-600/25 border-red-500 scale-105 shadow-md shadow-red-500/20"
                            : isBeatStart
                            ? "bg-gray-900/90 border-gray-700 hover:border-gray-500"
                            : "bg-gray-950/80 border-gray-800/80 hover:border-gray-700"
                        }`}
                        title={`Step ${st.index + 1} (${st.subdivisionLabel}) — Hand: ${st.hand} — ${
                          isAccent ? "Accent (X)" : isTap ? "Tap (.)" : "Rest"
                        }`}
                      >
                        {/* Subdivision Count (1, e, &, a) */}
                        <span
                          className={`text-[10px] font-mono ${
                            isBeatStart
                              ? "text-yellow-400 font-bold"
                              : "text-gray-500"
                          }`}
                        >
                          {st.subdivisionLabel}
                        </span>

                        {/* Visual Bar Height Indicator (Tall for Accent, Short for Tap, Dash for Rest) */}
                        <div className="h-7 flex items-end justify-center my-1">
                          {isAccent ? (
                            <div className="w-2.5 h-6 rounded-sm bg-red-500 shadow shadow-red-500/50" />
                          ) : isTap ? (
                            <div className="w-2 h-2.5 rounded-full bg-cyan-400 shadow shadow-cyan-400/50" />
                          ) : (
                            <div className="w-1.5 h-0.5 bg-gray-700 rounded" />
                          )}
                        </div>

                        {/* Notation Character */}
                        <span
                          className={`text-xs font-mono font-bold ${
                            isAccent
                              ? "text-red-400"
                              : isTap
                              ? "text-cyan-300"
                              : "text-gray-600"
                          }`}
                        >
                          {st.rawChar === " " ? "·" : st.rawChar}
                        </span>

                        {/* Hand Assignment (R / L) */}
                        <span
                          className={`text-[10px] font-mono font-bold mt-0.5 px-1 rounded ${
                            st.stroke === "none"
                              ? "text-gray-600"
                              : st.hand === "R"
                              ? "text-red-300 bg-red-950/60"
                              : "text-cyan-300 bg-cyan-950/60"
                          }`}
                        >
                          {st.hand}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {patternObj?.mnemonics?.[selectedInstrument] && (
                <div className="mt-3 pt-2.5 border-t border-gray-800/80 text-xs text-gray-300 flex items-center gap-2">
                  <span className="text-gray-500 font-mono uppercase">Chant/Mnemonic:</span>
                  <span className="italic text-yellow-300/90">
                    "{patternObj.mnemonics[selectedInstrument]}"
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
