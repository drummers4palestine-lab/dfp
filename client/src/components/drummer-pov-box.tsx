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
import {
  Play,
  Pause,
  OctagonMinus,
  Gauge,
  Eye,
  Hand,
  Layers,
  Headphones,
  Users,
  Bell,
} from "lucide-react";
import type { Tune, TunePattern } from "@/data/tunes";

export type AllowedDrumInstrument =
  | "sn"
  | "re"
  | "ls"
  | "ms"
  | "hs"
  | "ta"
  | "ag";
type CameraViewMode = "top" | "side";

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
  soloInstrument: AllowedDrumInstrument | null;
  onSoloInstrumentChange: (instrument: AllowedDrumInstrument | null) => void;
  onStepSelect?: (step: number) => void;
}

type StrokeKind = "none" | "tap" | "accent" | "flam" | "highBell" | "lowBell";

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
  {
    key: "sn",
    label: "Snare (Caixa)",
    subtitle: "Accents (X), Ghost Taps (.), Flams (f)",
  },
  {
    key: "re",
    label: "Repinique (Repi)",
    subtitle: "Accents (X), Rolls/Taps (r/h/.), Flams (f)",
  },
  {
    key: "ls",
    label: "Low Surdo",
    subtitle: "Primeira bass hits (X/0) & muted taps (s/r)",
  },
  {
    key: "ms",
    label: "Mid Surdo",
    subtitle: "Segunda counter-rhythm hits (X/0)",
  },
  {
    key: "hs",
    label: "High Surdo",
    subtitle: "Terceira syncopated cuts & fills (X/0)",
  },
  {
    key: "ta",
    label: "Tamborim",
    subtitle: "Right / Left hand hits (X) on high-tension head",
  },
  {
    key: "ag",
    label: "Agogô Bell",
    subtitle: "Up = High Bell (a) • Down = Low Bell (o)",
  },
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
  const fallbackLengths = ["ls", "ms", "hs", "re", "sn", "ta", "ag"]
    .map((k) => {
      const val = patternObj[k];
      return typeof val === "string" && !val.startsWith("@") ? val.length : 0;
    })
    .filter((n) => n > 0);

  const len = fallbackLengths.length > 0 ? Math.max(...fallbackLengths) : 16;
  return " ".repeat(len);
}

function classifyChar(
  char: string,
  instrument: AllowedDrumInstrument
): StrokeKind {
  if (!char || char === " ") return "none";
  if (instrument === "ag") {
    // In RoR / DFP audio: 'a' (ag_61.mp3, 1315 Hz) = High Bell, 'o' (ag_6f.mp3, 985 Hz) = Low Bell
    if (char === "a") return "highBell";
    if (char === "o") return "lowBell";
    if (char === ".") return "tap";
    return "lowBell";
  }
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
  height: number; // 0 = touching head, 0.10 = resting ready, 0.25 = tap peak, 1.0 = accent peak
  impact: number; // 0..1 flash at the moment of contact
  impactKind: StrokeKind;
  phaseLabel: "ACCENT" | "TAP" | "FLAM" | "LIFT" | "READY";
} {
  const N = steps.length;
  if (N === 0) {
    return { height: 0.1, impact: 0, impactKind: "none", phaseLabel: "READY" };
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
          step.stroke === "flam" ? "FLAM" : isAccent ? "ACCENT" : "TAP",
      };
    }
    if (step.hand !== hand && step.stroke === "flam") {
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

    const hitCenter = isFlamGraceHand ? i - 0.16 : i;

    let delta = normPos - hitCenter;
    if (delta > N / 2) delta -= N;
    if (delta < -N / 2) delta += N;

    if (delta >= -1.15 && delta < -0.18) {
      const t = (delta + 1.15) / (1.15 - 0.18);
      const smooth = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const liftH = baseRestHeight + (peakLift - baseRestHeight) * smooth;
      if (liftH > height) {
        height = liftH;
        phaseLabel = "LIFT";
      }
    } else if (delta >= -0.18 && delta <= 0.0) {
      const t = (delta + 0.18) / 0.18;
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
      const t = delta / 0.65;
      const reboundCurve = Math.sin(t * Math.PI * 0.5);
      const rebH = baseRestHeight * reboundCurve;
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

/**
 * Evaluates Agogô Up/Down stick motion:
 * - PitchAxis in [-1..+1]: -1 = UP (striking the High Bell 'a'), +1 = DOWN (striking the Low Bell 'o'), 0 = neutral center
 * - StrikeDepth in [0..1]: 1 = stick contacting the bell rim, 0 = pulled back ready
 */
function evaluateAgogoMotion(
  continuousStep: number,
  steps: ParsedStep[],
  isPlaying: boolean
): {
  pitchAxis: number; // -1 = UP (High Bell 'a'), +1 = DOWN (Low Bell 'o'), 0 = neutral
  strikeDepth: number; // 0 = ready, 1 = touching bell
  highImpact: number; // 0..1 glow on High Bell ('a')
  lowImpact: number; // 0..1 glow on Low Bell ('o')
  phaseLabel: "UP • HIGH BELL (a)" | "DOWN • LOW BELL (o)" | "READY";
} {
  const N = steps.length;
  if (N === 0) {
    return {
      pitchAxis: 0,
      strikeDepth: 0,
      highImpact: 0,
      lowImpact: 0,
      phaseLabel: "READY",
    };
  }

  const normPos = ((continuousStep % N) + N) % N;

  if (!isPlaying) {
    const idx = Math.floor(normPos) % N;
    const step = steps[idx];
    if (step.stroke === "highBell") {
      return {
        pitchAxis: -1,
        strikeDepth: 1,
        highImpact: 0.95,
        lowImpact: 0,
        phaseLabel: "UP • HIGH BELL (a)",
      };
    }
    if (step.stroke === "lowBell" || step.stroke === "accent" || step.stroke === "tap") {
      return {
        pitchAxis: 1,
        strikeDepth: 1,
        highImpact: 0,
        lowImpact: 0.95,
        phaseLabel: "DOWN • LOW BELL (o)",
      };
    }
    return {
      pitchAxis: 0,
      strikeDepth: 0,
      highImpact: 0,
      lowImpact: 0,
      phaseLabel: "READY",
    };
  }

  let pitchAxis = 0;
  let strikeDepth = 0;
  let highImpact = 0;
  let lowImpact = 0;
  let phaseLabel: "UP • HIGH BELL (a)" | "DOWN • LOW BELL (o)" | "READY" =
    "READY";
  let bestWeight = 0;

  for (let i = 0; i < N; i++) {
    const step = steps[i];
    if (step.stroke === "none") continue;

    const isHigh = step.stroke === "highBell";
    const targetPitch = isHigh ? -1 : 1; // -1 = UP, +1 = DOWN

    let delta = normPos - i;
    if (delta > N / 2) delta -= N;
    if (delta < -N / 2) delta += N;

    // Approach window [-0.95, 0]: move stick UP or DOWN toward the target bell and strike at delta=0
    if (delta >= -0.95 && delta <= 0.0) {
      const t = (delta + 0.95) / 0.95; // 0 -> 1
      const smooth = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const strike = delta >= -0.22 ? (delta + 0.22) / 0.22 : smooth * 0.4;
      if (smooth > bestWeight) {
        bestWeight = smooth;
        pitchAxis = targetPitch * smooth;
        strikeDepth = Math.min(1, strike);
        phaseLabel = isHigh ? "UP • HIGH BELL (a)" : "DOWN • LOW BELL (o)";
      }
      if (delta >= -0.12) {
        const imp = (delta + 0.12) / 0.12;
        if (isHigh) highImpact = Math.max(highImpact, imp);
        else lowImpact = Math.max(lowImpact, imp);
      }
    } else if (delta > 0.0 && delta <= 0.55) {
      // Rebound window [0, 0.55]
      const fade = 1 - delta / 0.55;
      if (fade > bestWeight) {
        bestWeight = fade;
        pitchAxis = targetPitch * fade;
        strikeDepth = fade * 0.65;
        phaseLabel = isHigh ? "UP • HIGH BELL (a)" : "DOWN • LOW BELL (o)";
      }
      const impFade = Math.max(0, 1 - delta / 0.35);
      if (isHigh) highImpact = Math.max(highImpact, impFade);
      else lowImpact = Math.max(lowImpact, impFade);
    }
  }

  return { pitchAxis, strikeDepth, highImpact, lowImpact, phaseLabel };
}

/**
 * Evaluates Tamborim single-hand stick (baqueta) motion:
 * One hand holds the Tamborim while the stick hand (Right or Left) strikes every hit.
 */
function evaluateTamborimStickMotion(
  continuousStep: number,
  steps: ParsedStep[],
  isPlaying: boolean
): {
  height: number; // 0 = stick on drumhead, 1 = stick lifted back ready to strike
  impact: number; // 0..1 glow on drumhead
  phaseLabel: "STICK HIT!" | "LIFT" | "READY";
} {
  const N = steps.length;
  if (N === 0) {
    return { height: 0.25, impact: 0, phaseLabel: "READY" };
  }

  const normPos = ((continuousStep % N) + N) % N;
  const baseRestHeight = 0.22;

  if (!isPlaying) {
    const idx = Math.floor(normPos) % N;
    const step = steps[idx];
    if (step.stroke !== "none") {
      return {
        height: 0.02,
        impact: 0.95,
        phaseLabel: "STICK HIT!",
      };
    }
    return {
      height: baseRestHeight,
      impact: 0,
      phaseLabel: "READY",
    };
  }

  let height = baseRestHeight;
  let impact = 0;
  let phaseLabel: "STICK HIT!" | "LIFT" | "READY" = "READY";

  for (let i = 0; i < N; i++) {
    const step = steps[i];
    if (step.stroke === "none") continue;

    const peakLift = step.stroke === "tap" ? 0.45 : 0.92;

    let delta = normPos - i;
    if (delta > N / 2) delta -= N;
    if (delta < -N / 2) delta += N;

    // Tight 1-step wind-up and strike so even rapid 16th-note Tamborim patterns clearly lift & hit every note
    if (delta >= -0.92 && delta < -0.18) {
      const t = (delta + 0.92) / (0.92 - 0.18);
      const liftCurve = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const candidateH = baseRestHeight + (peakLift - baseRestHeight) * liftCurve;
      if (candidateH > height) {
        height = candidateH;
        if (impact < 0.15) phaseLabel = "LIFT";
      }
    } else if (delta >= -0.18 && delta <= 0.0) {
      const t = (delta + 0.18) / 0.18; // 0 -> 1 downstroke into head
      const downCurve = 1 - Math.pow(t, 1.7);
      height = peakLift * downCurve;
      if (delta >= -0.09) {
        impact = Math.max(impact, 1 - Math.abs(delta) / 0.09);
      }
      phaseLabel = "STICK HIT!";
    } else if (delta > 0.0 && delta <= 0.42) {
      const t = delta / 0.42;
      const rebH = baseRestHeight * Math.sin(t * Math.PI * 0.5);
      height = Math.max(height, rebH);
      const fadeImpact = Math.max(0, 1 - delta / 0.32);
      if (fadeImpact > impact) {
        impact = fadeImpact;
        phaseLabel = "STICK HIT!";
      }
    }
  }

  return { height, impact, phaseLabel };
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
  soloInstrument,
  onSoloInstrumentChange,
}: DrummerPovBoxProps) {
  const [selectedInstrument, setSelectedInstrument] =
    useState<AllowedDrumInstrument>("sn");
  const [leadHand, setLeadHand] = useState<"R" | "L">("R");
  const [cameraView, setCameraView] = useState<CameraViewMode>("top");
  const [inspectedStep, setInspectedStep] = useState<number | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const prevGridStepRef = useRef<number>(0);

  const isSolo = soloInstrument !== null;
  const isAgogo = selectedInstrument === "ag";
  const isTamborim = selectedInstrument === "ta";

  const handleInstrumentChange = (val: AllowedDrumInstrument) => {
    setSelectedInstrument(val);
    if (soloInstrument !== null) {
      onSoloInstrumentChange(val);
    }
  };

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

  // Parse steps with 16th-note alternating sticking (R L R L or L R L R),
  // or single-stick hand (R or L) for Tamborim where one hand holds the drum and the other hits with a stick
  const parsedSteps = useMemo<ParsedStep[]>(() => {
    const chars = resolvedPatternString.split("");
    return chars.map((rawChar, index) => {
      const isEven = index % 2 === 0;
      const hand: "R" | "L" =
        selectedInstrument === "ta"
          ? leadHand
          : leadHand === "R"
          ? isEven
            ? "R"
            : "L"
          : isEven
          ? "L"
          : "R";
      const stroke = classifyChar(rawChar, selectedInstrument);
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
  }, [resolvedPatternString, leadHand, selectedInstrument]);

  const totalSteps = parsedSteps.length || 16;

  // Sync step anchor whenever audio engine advances `currentStep`
  useEffect(() => {
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
  const stepSubdivision = tune.stepSubdivision || 4;
  useEffect(() => {
    if (!isPlaying) return;
    setInspectedStep(null);

    let rafId: number;
    const tick = (now: number) => {
      const stepDurationMs = ((60 / Math.max(20, tempo)) * 1000) / stepSubdivision;
      const elapsed = now - stepAnchorRef.current.time;
      const frac = Math.min(0.999, Math.max(0, elapsed / stepDurationMs));
      const pos = (stepAnchorRef.current.step + frac) % totalSteps;
      setContinuousStep(pos);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, tempo, totalSteps, stepSubdivision]);

  // Evaluate left and right hand states at the current continuous step
  const leftMotion = useMemo(
    () => evaluateHandMotion("L", continuousStep, parsedSteps, isPlaying),
    [continuousStep, parsedSteps, isPlaying]
  );
  const rightMotion = useMemo(
    () => evaluateHandMotion("R", continuousStep, parsedSteps, isPlaying),
    [continuousStep, parsedSteps, isPlaying]
  );

  // Evaluate Agogô Up/Down motion
  const agogoMotion = useMemo(
    () => evaluateAgogoMotion(continuousStep, parsedSteps, isPlaying),
    [continuousStep, parsedSteps, isPlaying]
  );

  // Evaluate Tamborim one-handed stick (baqueta) motion
  const tamborimMotion = useMemo(
    () => evaluateTamborimStickMotion(continuousStep, parsedSteps, isPlaying),
    [continuousStep, parsedSteps, isPlaying]
  );

  const activeStepIndex = Math.floor(
    ((continuousStep % totalSteps) + totalSteps) % totalSteps
  );
  const activeParsedStep = parsedSteps[activeStepIndex] || parsedSteps[0];
  const baseTuneTempo = tune.speed || 120;

  // Auto-scroll the horizontal Sticking & Stroke Grid without ever scrolling the page vertically
  useEffect(() => {
    const container = gridScrollRef.current;
    if (!container) return;

    const didWrap =
      activeStepIndex === 0 || activeStepIndex < prevGridStepRef.current;
    prevGridStepRef.current = activeStepIndex;

    if (didWrap) {
      container.scrollLeft = 0;
      return;
    }

    const stepWidth = 36; // w-8 (32px) + gap-1 (4px)
    const targetLeft =
      activeStepIndex * stepWidth - container.clientWidth * 0.45;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: isPlaying ? "smooth" : "auto",
    });
  }, [activeStepIndex, isPlaying]);

  const currentInstrumentMeta =
    DRUM_INSTRUMENTS.find((d) => d.key === selectedInstrument) ||
    DRUM_INSTRUMENTS[0];

  // Top-Down POV transforms from height [0..1]
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

  // Side-Angle View transforms
  const leftSideAngleDeg = -leftMotion.height * 64;
  const rightSideAngleDeg = rightMotion.height * 64;
  const leftSideWristLiftY = -leftMotion.height * 22;
  const rightSideWristLiftY = -rightMotion.height * 22;

  return (
    <Card className="bg-gray-900 border-gray-700 shadow-2xl overflow-hidden w-full max-w-full">
      <CardHeader className="p-3 sm:p-6 pb-3 sm:pb-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <Eye className="h-5 w-5 text-red-500 shrink-0" />
              <CardTitle className="street-text text-xl sm:text-2xl text-white">
                Drummer POV Trainer
              </CardTitle>
              <Badge
                variant="outline"
                className="border-red-500/50 bg-red-500/10 text-red-400 text-[11px] sm:text-xs"
              >
                {isAgogo
                  ? "Up / Down Bell View"
                  : isTamborim
                  ? "Right / Left Hand View"
                  : cameraView === "top"
                  ? "First-Person Top View"
                  : "Side Height Angle"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {isAgogo ? (
                <>
                  Watch the Agogô stick move{" "}
                  <span className="text-yellow-300 font-semibold">
                    UP for High Bell (a)
                  </span>{" "}
                  and{" "}
                  <span className="text-amber-500 font-semibold">
                    DOWN for Low Bell (o)
                  </span>
                </>
              ) : isTamborim ? (
                <>
                  Brazilian Tamborim:{" "}
                  <span className="text-cyan-400 font-semibold">
                    {leadHand === "R" ? "Left Hand (L)" : "Right Hand (R)"} holds the drum
                  </span>{" "}
                  while{" "}
                  <span className="text-red-400 font-semibold">
                    {leadHand === "R" ? "Right Hand (R)" : "Left Hand (L)"} hits it with a stick (baqueta)
                  </span>
                </>
              ) : (
                <>
                  Look at your hands & sticks — replicate{" "}
                  <span className="text-red-400 font-semibold">
                    high stick lifts for Accents (X)
                  </span>{" "}
                  and{" "}
                  <span className="text-cyan-400 font-semibold">
                    low wrist motion for Taps (.)
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Instrument & Sticking Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Instrument Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Instrument:
              </span>
              <Select
                value={selectedInstrument}
                onValueChange={(val) =>
                  handleInstrumentChange(val as AllowedDrumInstrument)
                }
              >
                <SelectTrigger
                  data-testid="pov-instrument-select"
                  className="w-40 sm:w-48 bg-black border-gray-700 text-white font-medium h-9 text-xs sm:text-sm"
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Section:
                </span>
                <Select value={selectedPattern} onValueChange={onSelectPattern}>
                  <SelectTrigger className="w-32 sm:w-36 bg-black border-gray-700 text-white h-9 text-xs sm:text-sm">
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

            {/* Right / Left Hand Lead Toggle (Hidden for Agogô since Agogô is Up/Down) */}
            {!isAgogo && (
              <div className="flex items-center bg-black border border-gray-700 rounded-md p-0.5 max-w-full">
                <button
                  type="button"
                  onClick={() => setLeadHand("R")}
                  className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded transition-colors ${
                    leadHand === "R"
                      ? "bg-red-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={
                    isTamborim
                      ? "Hold Tamborim in Left hand (L), hit with stick in Right hand (R)"
                      : "Right-hand lead on the beat (1 e & a = R L R L)"
                  }
                >
                  {isTamborim ? "R-Hand Stick (Hold L)" : "R-Lead (RLRL)"}
                </button>
                <button
                  type="button"
                  onClick={() => setLeadHand("L")}
                  className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded transition-colors ${
                    leadHand === "L"
                      ? "bg-cyan-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={
                    isTamborim
                      ? "Hold Tamborim in Right hand (R), hit with stick in Left hand (L)"
                      : "Left-hand lead on the beat (1 e & a = L R L R)"
                  }
                >
                  {isTamborim ? "L-Hand Stick (Hold R)" : "L-Lead (LRLR)"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Speed / Playback Bar */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              onClick={onTogglePlayPause}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[88px] sm:min-w-[100px]"
            >
              {!isAudioLoaded && isPlaying ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
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

            {/* Audio Mode Toggle: Full Band vs Solo This Drum */}
            <div className="flex items-center bg-black border border-gray-700 rounded-md p-0.5">
              <button
                type="button"
                data-testid="audio-mode-full-band"
                onClick={() => onSoloInstrumentChange(null)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded transition-colors ${
                  !isSolo
                    ? "bg-red-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Play with all instruments enabled"
              >
                <Users className="h-3.5 w-3.5" />
                Full Band
              </button>
              <button
                type="button"
                data-testid="audio-mode-solo-drum"
                onClick={() => onSoloInstrumentChange(selectedInstrument)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded transition-colors ${
                  isSolo
                    ? "bg-amber-500 text-black font-bold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title={`Solo only ${currentInstrumentMeta.label}`}
              >
                <Headphones className="h-3.5 w-3.5" />
                Solo {currentInstrumentMeta.label.split(" ")[0]}
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onStop}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 px-2.5 sm:px-3"
            >
              <OctagonMinus className="mr-1 h-4 w-4" />
              Stop
            </Button>
          </div>

          {/* Speed Up / Slow Down Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-black/80 border border-gray-800 px-2.5 sm:px-3 py-1.5 rounded-lg w-full sm:w-auto justify-between sm:justify-start">
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
                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono transition-colors ${
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
            <div className="flex items-center gap-1.5 sm:gap-2">
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
                className="w-20 sm:w-32"
              />
              <button
                type="button"
                onClick={() => onTempoChange(Math.min(180, tempo + 5))}
                className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono"
                title="Speed up by 5 BPM"
              >
                +5
              </button>
              <span className="text-xs font-mono font-bold text-white min-w-[56px] sm:min-w-[62px] text-right">
                {tempo} BPM
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2.5 sm:p-6 space-y-4 sm:space-y-5 bg-gradient-to-b from-black via-gray-950 to-black">
        {/* MAIN DRUM / AGOGO / TAMBORIM ANIMATION BOX */}
        <div className="bg-[#050507] border border-gray-800/90 rounded-2xl p-2.5 sm:p-4 relative overflow-hidden shadow-inner">
          {/* Top Bar inside Drum Box: Left = Beat/Step Status | Right = View Toggle Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded bg-gray-900/90 border border-gray-800 text-gray-300">
                Beat{" "}
                <strong className="text-white">
                  {activeParsedStep?.beatNumber || 1}
                </strong>{" "}
                <span className="text-gray-500">•</span> Sub{" "}
                <strong className="text-yellow-400">
                  {activeParsedStep?.subdivisionLabel || "1"}
                </strong>
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-gray-500">
                Step {activeStepIndex + 1}/{totalSteps}
              </span>
            </div>

            {/* Toggle Button to swap between Top View (POV) and Side Angle View (for standard drums) */}
            {!isAgogo && !isTamborim && (
              <div className="flex items-center bg-gray-900/90 border border-gray-700 rounded-lg p-0.5">
                <button
                  type="button"
                  data-testid="toggle-top-view"
                  onClick={() => setCameraView("top")}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
                    cameraView === "top"
                      ? "bg-red-600 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Top View
                </button>
                <button
                  type="button"
                  data-testid="toggle-side-view"
                  onClick={() => setCameraView("side")}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
                    cameraView === "side"
                      ? "bg-red-600 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Side View
                </button>
              </div>
            )}
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full max-w-[460px] max-h-[340px] mx-auto aspect-[11/9] flex items-center justify-center overflow-hidden">
            <svg
              viewBox="0 0 500 430"
              className="w-full h-full select-none overflow-hidden"
              role="img"
              aria-label={
                isAgogo
                  ? "Agogô two-tone bell animation showing Up for High Bell (a) and Down for Low Bell (o)"
                  : isTamborim
                  ? "Tamborim animation showing holding in one hand and hitting with a stick in the other"
                  : cameraView === "top"
                  ? "First-person top-down drummer view with left and right translucent hands and drumsticks over a plain black drum"
                  : "Angled side view showing vertical drumstick height for taps and accents over a plain black drum"
              }
            >
              <defs>
                {/* Plain Matte Black Drumhead Gradient */}
                <radialGradient id="plainBlackDrumHead" cx="50%" cy="48%" r="52%">
                  <stop offset="0%" stopColor="#141419" />
                  <stop offset="62%" stopColor="#09090c" />
                  <stop offset="92%" stopColor="#040406" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>

                {/* Side View Drum Shell Body Gradient */}
                <linearGradient
                  id="sideBlackDrumShell"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#050507" />
                  <stop offset="22%" stopColor="#16161d" />
                  <stop offset="50%" stopColor="#0d0d12" />
                  <stop offset="78%" stopColor="#16161d" />
                  <stop offset="100%" stopColor="#050507" />
                </linearGradient>

                {/* Dark Metallic Rim Gradient */}
                <linearGradient
                  id="darkDrumRim"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#2c2c34" />
                  <stop offset="50%" stopColor="#15151a" />
                  <stop offset="100%" stopColor="#26262e" />
                </linearGradient>

                {/* Agogo Metallic Gold / Steel Bell Gradients */}
                <linearGradient
                  id="agogoHighBellGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="45%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#713f12" />
                </linearGradient>

                <linearGradient
                  id="agogoLowBellGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#ca8a04" />
                  <stop offset="100%" stopColor="#422006" />
                </linearGradient>

                {/* Translucent Left Hand Fill */}
                <linearGradient
                  id="leftGhostHand"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.42" />
                  <stop offset="55%" stopColor="#0284c7" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.12" />
                </linearGradient>

                {/* Translucent Right Hand Fill */}
                <linearGradient
                  id="rightGhostHand"
                  x1="100%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f87171" stopOpacity="0.42" />
                  <stop offset="55%" stopColor="#dc2626" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.12" />
                </linearGradient>

                {/* Drumstick Wood Gradient */}
                <linearGradient
                  id="stickBodyGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#d6b384" />
                  <stop offset="50%" stopColor="#f5deb3" />
                  <stop offset="100%" stopColor="#b89058" />
                </linearGradient>
              </defs>

              {isAgogo ? (
                /* =====================================================================
                   AGOGÔ ANIMATION: UP (HIGH BELL 'a') & DOWN (LOW BELL 'o')
                   ===================================================================== */
                <>
                  {/* Left Vertical UP / DOWN Indicator Gauge */}
                  <g transform="translate(22, 65)">
                    <text
                      x="16"
                      y="-12"
                      textAnchor="middle"
                      className="fill-yellow-300 text-[10px] font-mono font-bold"
                    >
                      UP (a)
                    </text>
                    <rect
                      x="10"
                      y="0"
                      width="12"
                      height="230"
                      rx="6"
                      fill="#0d0d12"
                      stroke="#374151"
                      strokeWidth="1.5"
                    />
                    {/* Center neutral line */}
                    <line
                      x1="4"
                      y1="115"
                      x2="28"
                      y2="115"
                      stroke="#6b7280"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    {/* Moving Up/Down indicator pill */}
                    <circle
                      cx="16"
                      cy={115 + agogoMotion.pitchAxis * 88}
                      r="8"
                      fill={
                        agogoMotion.pitchAxis < -0.15
                          ? "#fef08a"
                          : agogoMotion.pitchAxis > 0.15
                          ? "#f59e0b"
                          : "#6b7280"
                      }
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                    <text
                      x="16"
                      y="248"
                      textAnchor="middle"
                      className="fill-amber-500 text-[10px] font-mono font-bold"
                    >
                      DOWN (o)
                    </text>
                  </g>

                  {/* AGOGÔ U-BRACKET & LEFT HOLDING HAND */}
                  <g transform="translate(95, 200)">
                    {/* Translucent Left Hand holding the Agogô handle */}
                    <g transform="translate(-15, 0)">
                      <path
                        d="M -45 -22 L 5 -22 L 5 22 L -45 26 Z"
                        fill="url(#leftGhostHand)"
                        stroke="#38bdf8"
                        strokeOpacity="0.5"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="-8"
                        y="-28"
                        width="44"
                        height="56"
                        rx="14"
                        fill="url(#leftGhostHand)"
                        stroke="#7dd3fc"
                        strokeOpacity="0.8"
                        strokeWidth="1.8"
                      />
                    </g>

                    {/* Metal U-Spring Handle connecting High Bell (TOP) and Low Bell (BOTTOM) */}
                    <path
                      d="M 28 0 C -18 0, -18 -85, 65 -92"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 28 0 C -18 0, -18 85, 55 96"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="10"
                      cy="0"
                      r="10"
                      fill="#4b5563"
                      stroke="#d1d5db"
                      strokeWidth="2"
                    />

                    {/* TOP CONE: HIGH BELL ('a' - Smaller, Higher Pitch 1315 Hz) */}
                    <g
                      transform={`translate(65, -95) scale(${
                        1 + agogoMotion.highImpact * 0.08
                      })`}
                    >
                      <path
                        d="M 0 -18 L 118 -46 C 128 -25, 128 25, 118 46 L 0 18 Z"
                        fill="url(#agogoHighBellGrad)"
                        stroke={
                          agogoMotion.highImpact > 0.1 ? "#fef08a" : "#a16207"
                        }
                        strokeWidth={agogoMotion.highImpact > 0.1 ? "3.5" : "2"}
                      />
                      {/* Bell opening ellipse */}
                      <ellipse
                        cx="118"
                        cy="0"
                        rx="12"
                        ry="46"
                        fill="#1c1917"
                        stroke="#fde047"
                        strokeWidth="2"
                      />
                      <text
                        x="62"
                        y="6"
                        textAnchor="middle"
                        className="fill-black text-sm font-mono font-extrabold uppercase"
                      >
                        HIGH (a)
                      </text>

                      {/* Impact Rings when High Bell is struck */}
                      {agogoMotion.highImpact > 0.05 && (
                        <g transform="translate(88, 0)">
                          <circle
                            cx="0"
                            cy="0"
                            r={32 + (1 - agogoMotion.highImpact) * 26}
                            fill="none"
                            stroke="#fef08a"
                            strokeWidth="3.5"
                            strokeOpacity={agogoMotion.highImpact}
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r={18 * agogoMotion.highImpact}
                            fill="#fef08a"
                            fillOpacity={agogoMotion.highImpact * 0.55}
                          />
                        </g>
                      )}
                    </g>

                    {/* BOTTOM CONE: LOW BELL ('o' - Larger, Deeper Pitch 985 Hz) */}
                    <g
                      transform={`translate(55, 95) scale(${
                        1 + agogoMotion.lowImpact * 0.08
                      })`}
                    >
                      <path
                        d="M 0 -22 L 142 -58 C 155 -30, 155 30, 142 58 L 0 22 Z"
                        fill="url(#agogoLowBellGrad)"
                        stroke={
                          agogoMotion.lowImpact > 0.1 ? "#f59e0b" : "#78350f"
                        }
                        strokeWidth={agogoMotion.lowImpact > 0.1 ? "3.5" : "2"}
                      />
                      {/* Bell opening ellipse */}
                      <ellipse
                        cx="142"
                        cy="0"
                        rx="15"
                        ry="58"
                        fill="#1c1917"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      <text
                        x="76"
                        y="6"
                        textAnchor="middle"
                        className="fill-black text-sm font-mono font-extrabold uppercase"
                      >
                        LOW (o)
                      </text>

                      {/* Impact Rings when Low Bell is struck */}
                      {agogoMotion.lowImpact > 0.05 && (
                        <g transform="translate(105, 0)">
                          <circle
                            cx="0"
                            cy="0"
                            r={38 + (1 - agogoMotion.lowImpact) * 28}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3.5"
                            strokeOpacity={agogoMotion.lowImpact}
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r={22 * agogoMotion.lowImpact}
                            fill="#f59e0b"
                            fillOpacity={agogoMotion.lowImpact * 0.55}
                          />
                        </g>
                      )}
                    </g>
                  </g>

                  {/* RIGHT HAND & STICK MOVING UP (HIGH BELL) AND DOWN (LOW BELL) */}
                  {(() => {
                    const handY = 200 + agogoMotion.pitchAxis * 82;
                    const handX = 415 - agogoMotion.strikeDepth * 24;
                    const stickAngle = agogoMotion.pitchAxis * -14;
                    return (
                      <g
                        transform={`translate(${handX}, ${handY}) rotate(${stickAngle})`}
                      >
                        {/* Wooden Stick */}
                        <line
                          x1="25"
                          y1="0"
                          x2="-155"
                          y2="0"
                          stroke="url(#stickBodyGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="-155"
                          cy="0"
                          r="7"
                          fill={
                            agogoMotion.highImpact > 0.1
                              ? "#fef08a"
                              : agogoMotion.lowImpact > 0.1
                              ? "#f59e0b"
                              : "#ffffff"
                          }
                        />

                        {/* Right Hand gripping stick */}
                        <path
                          d="M 48 -14 L 12 -16 L 12 18 L 48 22 Z"
                          fill="url(#rightGhostHand)"
                          stroke="#f87171"
                          strokeOpacity="0.5"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M 16 -22 Q -12 -24 -26 -8 Q -30 8 -18 20 Q 2 22 16 18 Z"
                          fill="url(#rightGhostHand)"
                          stroke="#fca5a5"
                          strokeOpacity="0.85"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="10"
                          fill="#450a0a"
                          stroke="#f87171"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          className="fill-red-200 text-[10px] font-mono font-bold"
                        >
                          R
                        </text>
                      </g>
                    );
                  })()}

                  <text
                    x="250"
                    y="422"
                    textAnchor="middle"
                    className="fill-gray-400 text-[10px] font-mono tracking-widest uppercase"
                  >
                    ▲ Agogô Bell Trainer: UP = High Bell (a) • DOWN = Low Bell (o) ▲
                  </text>
                </>
              ) : isTamborim ? (
                /* =====================================================================
                   BRAZILIAN TAMBORIM ANIMATION:
                   Hold the Tamborim in one hand, hit it with a stick (baqueta) with the other!
                   (leadHand === "R": Left hand holds drum, Right hand hits with stick;
                    leadHand === "L": Right hand holds drum, Left hand hits with stick)
                   ===================================================================== */
                <>
                  {/* Stick Lift Gauge on the striking side */}
                  <g
                    transform={`translate(${
                      leadHand === "R" ? 452 : 24
                    }, 70)`}
                  >
                    <text
                      x="12"
                      y="-10"
                      textAnchor="middle"
                      className={`text-[10px] font-mono font-bold ${
                        leadHand === "R" ? "fill-red-400" : "fill-cyan-400"
                      }`}
                    >
                      STICK ({leadHand})
                    </text>
                    <rect
                      x="6"
                      y="0"
                      width="12"
                      height="200"
                      rx="6"
                      fill="#0d0d12"
                      stroke="#1f2937"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="8"
                      y={200 * (1 - Math.min(1, tamborimMotion.height))}
                      width="8"
                      height={Math.max(
                        6,
                        200 * Math.min(1, tamborimMotion.height)
                      )}
                      rx="4"
                      fill={
                        tamborimMotion.impact > 0.1
                          ? "#fb923c"
                          : leadHand === "R"
                          ? "#ef4444"
                          : "#22d3ee"
                      }
                    />
                  </g>

                  {/* HOLDING HAND + BRAZILIAN TAMBORIM DRUM (Stationary center, no downward screen shift) */}
                  <g transform="translate(250, 185)">
                    {/* Fingers of the Holding Hand underneath the Tamborim head (supporting & dampening from below) */}
                    <g
                      transform={`scale(${leadHand === "R" ? 1 : -1}, 1)`}
                      opacity="0.45"
                    >
                      <rect
                        x="-85"
                        y="-28"
                        width="58"
                        height="13"
                        rx="6.5"
                        fill={
                          leadHand === "R"
                            ? "url(#leftGhostHand)"
                            : "url(#rightGhostHand)"
                        }
                        stroke={leadHand === "R" ? "#38bdf8" : "#f87171"}
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                      />
                      <rect
                        x="-82"
                        y="-10"
                        width="64"
                        height="13"
                        rx="6.5"
                        fill={
                          leadHand === "R"
                            ? "url(#leftGhostHand)"
                            : "url(#rightGhostHand)"
                        }
                        stroke={leadHand === "R" ? "#38bdf8" : "#f87171"}
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                      />
                      <rect
                        x="-85"
                        y="8"
                        width="56"
                        height="13"
                        rx="6.5"
                        fill={
                          leadHand === "R"
                            ? "url(#leftGhostHand)"
                            : "url(#rightGhostHand)"
                        }
                        stroke={leadHand === "R" ? "#38bdf8" : "#f87171"}
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                      />
                    </g>

                    {/* Compact 6-inch Brazilian Tamborim Shell & Rim */}
                    <circle
                      cx="0"
                      cy="6"
                      r="110"
                      fill="#000000"
                      opacity="0.85"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="104"
                      fill="url(#darkDrumRim)"
                      stroke="#fb923c"
                      strokeOpacity="0.7"
                      strokeWidth="3"
                    />
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                      (deg) => (
                        <g key={deg} transform={`rotate(${deg})`}>
                          <rect
                            x="-3.5"
                            y="-109"
                            width="7"
                            height="7"
                            rx="1.5"
                            fill="#d1d5db"
                            stroke="#111827"
                            strokeWidth="1"
                          />
                        </g>
                      )
                    )}
                    {/* High-Tension Synthetic Tamborim Head */}
                    <circle
                      cx="0"
                      cy="0"
                      r="94"
                      fill="url(#plainBlackDrumHead)"
                      stroke="#374151"
                      strokeWidth="2"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="48"
                      fill="none"
                      stroke="#fb923c"
                      strokeOpacity="0.22"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* HOLDING HAND (Left Hand when R-stick, Right Hand when L-stick) gripping the Tamborim frame */}
                    <g transform={`scale(${leadHand === "R" ? 1 : -1}, 1)`}>
                      {/* Forearm & Wrist holding the Tamborim from the side/bottom */}
                      <path
                        d="M -185 88 L -116 28 L -96 62 L -155 122 Z"
                        fill={
                          leadHand === "R"
                            ? "url(#leftGhostHand)"
                            : "url(#rightGhostHand)"
                        }
                        stroke={leadHand === "R" ? "#38bdf8" : "#f87171"}
                        strokeOpacity="0.6"
                        strokeWidth="1.6"
                      />
                      {/* Palm gripping the outer Tamborim shell */}
                      <path
                        d="M -126 -24 Q -142 15 -114 55 Q -95 62 -86 35 L -92 -20 Z"
                        fill={
                          leadHand === "R"
                            ? "url(#leftGhostHand)"
                            : "url(#rightGhostHand)"
                        }
                        stroke={leadHand === "R" ? "#7dd3fc" : "#fca5a5"}
                        strokeOpacity="0.9"
                        strokeWidth="2"
                      />
                      {/* Thumb wrapped over the top rim to hold & balance the Tamborim */}
                      <ellipse
                        cx="-94"
                        cy="-24"
                        rx="18"
                        ry="9"
                        transform="rotate(-25, -94, -24)"
                        fill={
                          leadHand === "R"
                            ? "url(#leftGhostHand)"
                            : "url(#rightGhostHand)"
                        }
                        stroke={leadHand === "R" ? "#bae6fd" : "#fecaca"}
                        strokeWidth="1.8"
                      />
                      {/* Badge on the Holding Hand */}
                      <circle
                        cx="-118"
                        cy="18"
                        r="13"
                        fill={leadHand === "R" ? "#082f49" : "#450a0a"}
                        stroke={leadHand === "R" ? "#38bdf8" : "#f87171"}
                        strokeWidth="1.5"
                      />
                      <text
                        x="-118"
                        y="22"
                        textAnchor="middle"
                        transform={`scale(${leadHand === "R" ? 1 : -1}, 1)`}
                        style={{
                          transformBox: "fill-box",
                          transformOrigin: "center",
                        }}
                        className={`text-xs font-mono font-bold ${
                          leadHand === "R" ? "fill-cyan-200" : "fill-red-200"
                        }`}
                      >
                        {leadHand === "R" ? "L" : "R"}
                      </text>
                      <text
                        x="-135"
                        y="-42"
                        textAnchor="middle"
                        transform={`scale(${leadHand === "R" ? 1 : -1}, 1)`}
                        style={{
                          transformBox: "fill-box",
                          transformOrigin: "center",
                        }}
                        className={`text-[9px] font-mono font-bold uppercase ${
                          leadHand === "R" ? "fill-cyan-300" : "fill-red-300"
                        }`}
                      >
                        HOLDING DRUM ({leadHand === "R" ? "L" : "R"})
                      </text>
                    </g>

                    {/* Stick Impact Flash on Center of Tamborim */}
                    {tamborimMotion.impact > 0.05 && (
                      <g>
                        <circle
                          cx="0"
                          cy="0"
                          r={52 * (1.15 - tamborimMotion.impact * 0.35)}
                          fill="none"
                          stroke={leadHand === "R" ? "#ef4444" : "#22d3ee"}
                          strokeWidth="4"
                          strokeOpacity={tamborimMotion.impact}
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r={26 * tamborimMotion.impact}
                          fill="#fb923c"
                          fillOpacity={tamborimMotion.impact * 0.55}
                        />
                        <text
                          x="0"
                          y="-58"
                          textAnchor="middle"
                          className="fill-orange-300 text-xs font-mono font-extrabold tracking-wider"
                        >
                          {leadHand === "R"
                            ? "RIGHT STICK HIT!"
                            : "LEFT STICK HIT!"}
                        </text>
                      </g>
                    )}
                  </g>

                  {/* STRIKING HAND HOLDING THE BRAZILIAN TAMBORIM BAQUETA (3-PRONG WHIP STICK) */}
                  {(() => {
                    const isRightStick = leadHand === "R";
                    const dir = isRightStick ? 1 : -1;
                    const lift = tamborimMotion.height;
                    // Pivot wrist at bottom-right (or bottom-left) and swing stick onto the center of the Tamborim (250, 185)
                    const wristX = 250 + dir * (135 + lift * 26);
                    const wristY = 290 - (1 - lift) * 18 + lift * 22;
                    const stickAngleDeg = dir * (lift * 28 - 4);
                    const scale = 1 + lift * 0.16;

                    return (
                      <g
                        transform={`translate(${wristX}, ${wristY}) rotate(${stickAngleDeg}) scale(${scale})`}
                      >
                        {/* Tamborim Baqueta (Multi-rod 3-pronged flexible samba stick) */}
                        <g>
                          {/* Stick Handle Shaft */}
                          <line
                            x1={dir * 18}
                            y1="18"
                            x2={dir * -62}
                            y2="-52"
                            stroke="url(#stickBodyGrad)"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          {/* Colored Grip Tape Wrap */}
                          <line
                            x1={dir * 14}
                            y1="14"
                            x2={dir * -24}
                            y2="-19"
                            stroke={isRightStick ? "#ef4444" : "#06b6d4"}
                            strokeWidth="9"
                            strokeLinecap="round"
                          />
                          {/* 3 Flexible Prongs (Whip Baqueta Tips) */}
                          <line
                            x1={dir * -62}
                            y1="-52"
                            x2={dir * -135}
                            y2="-112"
                            stroke="#fef3c7"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <line
                            x1={dir * -62}
                            y1="-52"
                            x2={dir * -142}
                            y2="-102"
                            stroke="#fef08a"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <line
                            x1={dir * -62}
                            y1="-52"
                            x2={dir * -126}
                            y2="-120"
                            stroke="#fef3c7"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          {/* Tip Impact Glow */}
                          <circle
                            cx={dir * -135}
                            cy="-111"
                            r={tamborimMotion.impact > 0.1 ? 9 : 5}
                            fill={
                              tamborimMotion.impact > 0.1
                                ? "#fb923c"
                                : isRightStick
                                ? "#ef4444"
                                : "#22d3ee"
                            }
                          />
                        </g>

                        {/* Striking Hand gripping the Baqueta */}
                        <g transform={`scale(${dir}, 1)`}>
                          {/* Forearm */}
                          <path
                            d="M 8 28 L 42 92 L 82 74 L 38 10 Z"
                            fill={
                              isRightStick
                                ? "url(#rightGhostHand)"
                                : "url(#leftGhostHand)"
                            }
                            stroke={isRightStick ? "#f87171" : "#38bdf8"}
                            strokeOpacity="0.55"
                            strokeWidth="1.5"
                          />
                          {/* Fist / Fingers wrapped around stick handle */}
                          <path
                            d="M -20 -12 Q 8 -28 32 -6 Q 42 16 18 32 Q -8 30 -20 12 Z"
                            fill={
                              isRightStick
                                ? "url(#rightGhostHand)"
                                : "url(#leftGhostHand)"
                            }
                            stroke={isRightStick ? "#fca5a5" : "#7dd3fc"}
                            strokeOpacity="0.9"
                            strokeWidth="2"
                          />
                          <circle
                            cx="8"
                            cy="8"
                            r="13"
                            fill={isRightStick ? "#450a0a" : "#082f49"}
                            stroke={isRightStick ? "#f87171" : "#38bdf8"}
                            strokeWidth="1.5"
                          />
                          <text
                            x="8"
                            y="12"
                            textAnchor="middle"
                            transform={`scale(${dir}, 1)`}
                            style={{
                              transformBox: "fill-box",
                              transformOrigin: "center",
                            }}
                            className={`text-xs font-mono font-bold ${
                              isRightStick ? "fill-red-200" : "fill-cyan-200"
                            }`}
                          >
                            {leadHand}
                          </text>
                        </g>
                      </g>
                    );
                  })()}

                  <text
                    x="250"
                    y="422"
                    textAnchor="middle"
                    className="fill-gray-400 text-[10px] font-mono tracking-widest uppercase"
                  >
                    ▲ Brazilian Tamborim: Hold in{" "}
                    {leadHand === "R" ? "Left Hand (L)" : "Right Hand (R)"} •
                    Hit with Stick in{" "}
                    {leadHand === "R" ? "Right Hand (R)" : "Left Hand (L)"} ▲
                  </text>
                </>
              ) : (
                /* =====================================================================
                   STANDARD DRUMS (SNARE, REPI, SURDOS)
                   ===================================================================== */
                <>
                  {/* Left & Right Vertical Stick Height Gauges */}
                  <g transform="translate(18, 65)">
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
                    <line
                      x1="2"
                      y1={210 * (1 - 0.26)}
                      x2="22"
                      y2={210 * (1 - 0.26)}
                      stroke="#22d3ee"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1="2"
                      y1={210 * (1 - 0.92)}
                      x2="22"
                      y2={210 * (1 - 0.92)}
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

                  <g transform="translate(458, 65)">
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
                    <line
                      x1="2"
                      y1={210 * (1 - 0.26)}
                      x2="22"
                      y2={210 * (1 - 0.26)}
                      stroke="#22d3ee"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1="2"
                      y1={210 * (1 - 0.92)}
                      x2="22"
                      y2={210 * (1 - 0.92)}
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x="8"
                      y={210 * (1 - Math.min(1, rightMotion.height))}
                      width="8"
                      height={Math.max(
                        4,
                        210 * Math.min(1, rightMotion.height)
                      )}
                      rx="4"
                      fill={rightMotion.height > 0.5 ? "#ef4444" : "#f87171"}
                    />
                  </g>

                  {cameraView === "top" ? (
                    /* MODE 1: TOP-DOWN FIRST-PERSON VIEW (POV) */
                    <>
                      <g transform="translate(250, 175)">
                        <circle
                          cx="0"
                          cy="6"
                          r="156"
                          fill="#000000"
                          opacity="0.85"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="150"
                          fill="url(#darkDrumRim)"
                          stroke="#374151"
                          strokeWidth="2.5"
                        />
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                          <g key={deg} transform={`rotate(${deg})`}>
                            <rect
                              x="-5"
                              y="-156"
                              width="10"
                              height="9"
                              rx="2"
                              fill="#4b5563"
                              stroke="#111827"
                              strokeWidth="1"
                            />
                          </g>
                        ))}
                        <circle
                          cx="0"
                          cy="0"
                          r="138"
                          fill="url(#plainBlackDrumHead)"
                          stroke="#1f2937"
                          strokeWidth="2"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="94"
                          fill="none"
                          stroke="#ffffff"
                          strokeOpacity="0.06"
                          strokeWidth="1"
                          strokeDasharray="4 6"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="45"
                          fill="none"
                          stroke="#ffffff"
                          strokeOpacity="0.1"
                          strokeWidth="1"
                          strokeDasharray="3 4"
                        />

                        {/* Left Target & Impact Ripple */}
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

                        {/* Right Target & Impact Ripple */}
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

                      {/* STICK SHADOWS ON THE BLACK DRUMHEAD */}
                      <line
                        x1={145 - leftMotion.height * 10}
                        y1={335 + leftMotion.height * 12}
                        x2={228 - leftMotion.height * 6}
                        y2={169 + leftMotion.height * 10}
                        stroke="#000000"
                        strokeWidth={8 + leftMotion.height * 10}
                        strokeLinecap="round"
                        opacity={Math.max(0.14, 0.7 - leftMotion.height * 0.45)}
                      />
                      <line
                        x1={355 + rightMotion.height * 10}
                        y1={335 + rightMotion.height * 12}
                        x2={272 + rightMotion.height * 6}
                        y2={169 + rightMotion.height * 10}
                        stroke="#000000"
                        strokeWidth={8 + rightMotion.height * 10}
                        strokeLinecap="round"
                        opacity={Math.max(
                          0.14,
                          0.7 - rightMotion.height * 0.45
                        )}
                      />

                      {/* LEFT HAND & DRUMSTICK */}
                      <g
                        transform={`translate(${leftPullBackX}, ${leftPullBackY}) translate(155, 320) rotate(${leftRotateDeg}) scale(${leftScale}) translate(-155, -320)`}
                      >
                        <line
                          x1="132"
                          y1="362"
                          x2={228 + leftTipLiftX}
                          y2={169 + leftTipLiftY}
                          stroke="url(#stickBodyGrad)"
                          strokeWidth="7.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1={196 + leftTipLiftX * 0.55}
                          y1={233 + leftTipLiftY * 0.55}
                          x2={228 + leftTipLiftX}
                          y2={169 + leftTipLiftY}
                          stroke="#fef3c7"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        <ellipse
                          cx={228 + leftTipLiftX}
                          cy={169 + leftTipLiftY}
                          rx={5.5 + leftAccentBoost * 2}
                          ry={7 + leftAccentBoost * 2.5}
                          transform={`rotate(26, ${228 + leftTipLiftX}, ${
                            169 + leftTipLiftY
                          })`}
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

                        <g transform="translate(152, 324) rotate(26)">
                          <path
                            d="M -26 42 L -20 92 L 24 92 L 28 42 Z"
                            fill="url(#leftGhostHand)"
                            stroke="#38bdf8"
                            strokeOpacity="0.45"
                            strokeWidth="1.5"
                          />
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

                      {/* RIGHT HAND & DRUMSTICK */}
                      <g
                        transform={`translate(${rightPullBackX}, ${rightPullBackY}) translate(345, 320) rotate(${rightRotateDeg}) scale(${rightScale}) translate(-345, -320)`}
                      >
                        <line
                          x1="368"
                          y1="362"
                          x2={272 + rightTipLiftX}
                          y2={169 + rightTipLiftY}
                          stroke="url(#stickBodyGrad)"
                          strokeWidth="7.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1={304 + rightTipLiftX * 0.55}
                          y1={233 + rightTipLiftY * 0.55}
                          x2={272 + rightTipLiftX}
                          y2={169 + rightTipLiftY}
                          stroke="#fef3c7"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        <ellipse
                          cx={272 + rightTipLiftX}
                          cy={169 + rightTipLiftY}
                          rx={5.5 + rightAccentBoost * 2}
                          ry={7 + rightAccentBoost * 2.5}
                          transform={`rotate(-26, ${272 + rightTipLiftX}, ${
                            169 + rightTipLiftY
                          })`}
                          fill={
                            rightMotion.impact > 0.2 ||
                            rightMotion.height > 0.6
                              ? rightMotion.impactKind === "accent" ||
                                rightMotion.impactKind === "flam" ||
                                rightMotion.height > 0.6
                                ? "#ef4444"
                                : "#22d3ee"
                              : "#ffffff"
                          }
                        />

                        <g transform="translate(348, 324) rotate(-26)">
                          <path
                            d="M -28 42 L -24 92 L 20 92 L 26 42 Z"
                            fill="url(#rightGhostHand)"
                            stroke="#f87171"
                            strokeOpacity="0.45"
                            strokeWidth="1.5"
                          />
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

                      <text
                        x="250"
                        y="422"
                        textAnchor="middle"
                        className="fill-gray-500 text-[10px] font-mono tracking-widest uppercase"
                      >
                        ▲ First-Person Drummer POV (Looking Down) ▲
                      </text>
                    </>
                  ) : (
                    /* MODE 2: SIDE-ANGLE PROFILE VIEW */
                    <>
                      <g>
                        <line
                          x1="60"
                          y1="88"
                          x2="440"
                          y2="88"
                          stroke="#ef4444"
                          strokeOpacity="0.45"
                          strokeWidth="1.2"
                          strokeDasharray="5 5"
                        />
                        <rect
                          x="185"
                          y="73"
                          width="130"
                          height="16"
                          rx="4"
                          fill="#180808"
                          stroke="#ef4444"
                          strokeOpacity="0.5"
                        />
                        <text
                          x="250"
                          y="84"
                          textAnchor="middle"
                          className="fill-red-400 text-[9px] font-mono font-bold tracking-wider uppercase"
                        >
                          Accent Lift Height (X)
                        </text>
                      </g>

                      <g>
                        <line
                          x1="60"
                          y1="226"
                          x2="440"
                          y2="226"
                          stroke="#22d3ee"
                          strokeOpacity="0.45"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <rect
                          x="192"
                          y="211"
                          width="116"
                          height="16"
                          rx="4"
                          fill="#061820"
                          stroke="#22d3ee"
                          strokeOpacity="0.5"
                        />
                        <text
                          x="250"
                          y="222"
                          textAnchor="middle"
                          className="fill-cyan-300 text-[9px] font-mono font-bold tracking-wider uppercase"
                        >
                          Tap Height (.) Low
                        </text>
                      </g>

                      <path
                        d="M 232 282 A 145 145 0 0 0 158 100"
                        fill="none"
                        stroke="#38bdf8"
                        strokeOpacity="0.2"
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                      />
                      <path
                        d="M 268 282 A 145 145 0 0 1 342 100"
                        fill="none"
                        stroke="#f87171"
                        strokeOpacity="0.2"
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                      />

                      <g transform="translate(250, 285)">
                        <ellipse
                          cx="0"
                          cy="96"
                          rx="164"
                          ry="26"
                          fill="#000000"
                          opacity="0.9"
                        />
                        <path
                          d="M -154 0 L -154 82 A 154 26 0 0 0 154 82 L 154 0 Z"
                          fill="url(#sideBlackDrumShell)"
                          stroke="#1f2937"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M -156 78 A 156 26 0 0 0 156 78 L 156 86 A 156 26 0 0 1 -156 86 Z"
                          fill="url(#darkDrumRim)"
                          stroke="#374151"
                          strokeWidth="1.5"
                        />
                        {[-130, -82, -28, 28, 82, 130].map((xPos) => (
                          <g key={xPos}>
                            <line
                              x1={xPos}
                              y1="14"
                              x2={xPos}
                              y2="82"
                              stroke="#374151"
                              strokeWidth="2.5"
                            />
                            <rect
                              x={xPos - 4}
                              y="38"
                              width="8"
                              height="16"
                              rx="2"
                              fill="#1f2937"
                              stroke="#4b5563"
                              strokeWidth="1"
                            />
                          </g>
                        ))}
                        <ellipse
                          cx="0"
                          cy="3"
                          rx="158"
                          ry="28"
                          fill="url(#darkDrumRim)"
                          stroke="#4b5563"
                          strokeWidth="2"
                        />
                        <ellipse
                          cx="0"
                          cy="0"
                          rx="148"
                          ry="23"
                          fill="url(#plainBlackDrumHead)"
                          stroke="#1f2937"
                          strokeWidth="1.5"
                        />
                        <ellipse
                          cx="0"
                          cy="0"
                          rx="65"
                          ry="10"
                          fill="none"
                          stroke="#ffffff"
                          strokeOpacity="0.12"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />

                        {leftMotion.impact > 0.05 && (
                          <g transform="translate(-18, -1)">
                            <ellipse
                              cx="0"
                              cy="0"
                              rx={
                                (leftMotion.impactKind === "accent" ||
                                leftMotion.impactKind === "flam"
                                  ? 52
                                  : 26) *
                                (1.15 - leftMotion.impact * 0.35)
                              }
                              ry={
                                (leftMotion.impactKind === "accent" ||
                                leftMotion.impactKind === "flam"
                                  ? 12
                                  : 6) *
                                (1.15 - leftMotion.impact * 0.35)
                              }
                              fill="none"
                              stroke={
                                leftMotion.impactKind === "accent" ||
                                leftMotion.impactKind === "flam"
                                  ? "#ef4444"
                                  : "#22d3ee"
                              }
                              strokeWidth="3"
                              strokeOpacity={leftMotion.impact * 0.95}
                            />
                          </g>
                        )}

                        {rightMotion.impact > 0.05 && (
                          <g transform="translate(18, -1)">
                            <ellipse
                              cx="0"
                              cy="0"
                              rx={
                                (rightMotion.impactKind === "accent" ||
                                rightMotion.impactKind === "flam"
                                  ? 52
                                  : 26) *
                                (1.15 - rightMotion.impact * 0.35)
                              }
                              ry={
                                (rightMotion.impactKind === "accent" ||
                                rightMotion.impactKind === "flam"
                                  ? 12
                                  : 6) *
                                (1.15 - rightMotion.impact * 0.35)
                              }
                              fill="none"
                              stroke={
                                rightMotion.impactKind === "accent" ||
                                rightMotion.impactKind === "flam"
                                  ? "#ef4444"
                                  : "#22d3ee"
                              }
                              strokeWidth="3"
                              strokeOpacity={rightMotion.impact * 0.95}
                            />
                          </g>
                        )}
                      </g>

                      <g
                        transform={`translate(0, ${leftSideWristLiftY}) translate(92, 275) rotate(${leftSideAngleDeg}) translate(-92, -275)`}
                      >
                        <line
                          x1="62"
                          y1="277"
                          x2="232"
                          y2="282"
                          stroke="url(#stickBodyGrad)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="175"
                          y1="280"
                          x2="232"
                          y2="282"
                          stroke="#fef3c7"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                        <ellipse
                          cx="232"
                          cy="282"
                          rx="7"
                          ry="5"
                          fill={
                            leftMotion.height > 0.55 ||
                            leftMotion.impactKind === "accent" ||
                            leftMotion.impactKind === "flam"
                              ? "#ef4444"
                              : "#22d3ee"
                          }
                        />
                        <g transform="translate(92, 275)">
                          <path
                            d="M -52 -14 L -12 -16 L -12 18 L -52 22 Z"
                            fill="url(#leftGhostHand)"
                            stroke="#38bdf8"
                            strokeOpacity="0.5"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M -16 -20 Q 12 -24 26 -8 Q 30 6 18 18 Q -2 22 -16 16 Z"
                            fill="url(#leftGhostHand)"
                            stroke="#7dd3fc"
                            strokeOpacity="0.8"
                            strokeWidth="1.8"
                          />
                          <ellipse
                            cx="12"
                            cy="8"
                            rx="12"
                            ry="6"
                            fill="url(#leftGhostHand)"
                            stroke="#bae6fd"
                            strokeOpacity="0.7"
                            strokeWidth="1.3"
                          />
                          <ellipse
                            cx="6"
                            cy="14"
                            rx="10"
                            ry="5.5"
                            fill="url(#leftGhostHand)"
                            stroke="#bae6fd"
                            strokeOpacity="0.6"
                            strokeWidth="1.2"
                          />
                          <circle
                            cx="-4"
                            cy="-2"
                            r="10"
                            fill="#082f49"
                            fillOpacity="0.8"
                            stroke="#38bdf8"
                            strokeWidth="1.2"
                          />
                          <text
                            x="-4"
                            y="2"
                            textAnchor="middle"
                            className="fill-cyan-200 text-[10px] font-mono font-bold"
                          >
                            L
                          </text>
                        </g>
                      </g>

                      <g
                        transform={`translate(0, ${rightSideWristLiftY}) translate(408, 275) rotate(${rightSideAngleDeg}) translate(-408, -275)`}
                      >
                        <line
                          x1="438"
                          y1="277"
                          x2="268"
                          y2="282"
                          stroke="url(#stickBodyGrad)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="325"
                          y1="280"
                          x2="268"
                          y2="282"
                          stroke="#fef3c7"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                        <ellipse
                          cx="268"
                          cy="282"
                          rx="7"
                          ry="5"
                          fill={
                            rightMotion.height > 0.55 ||
                            rightMotion.impactKind === "accent" ||
                            rightMotion.impactKind === "flam"
                              ? "#ef4444"
                              : "#22d3ee"
                          }
                        />
                        <g transform="translate(408, 275)">
                          <path
                            d="M 52 -14 L 12 -16 L 12 18 L 52 22 Z"
                            fill="url(#rightGhostHand)"
                            stroke="#f87171"
                            strokeOpacity="0.5"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M 16 -20 Q -12 -24 -26 -8 Q -30 6 -18 18 Q 2 22 16 16 Z"
                            fill="url(#rightGhostHand)"
                            stroke="#fca5a5"
                            strokeOpacity="0.8"
                            strokeWidth="1.8"
                          />
                          <ellipse
                            cx="-12"
                            cy="8"
                            rx="12"
                            ry="6"
                            fill="url(#rightGhostHand)"
                            stroke="#fecaca"
                            strokeOpacity="0.7"
                            strokeWidth="1.3"
                          />
                          <ellipse
                            cx="-6"
                            cy="14"
                            rx="10"
                            ry="5.5"
                            fill="url(#rightGhostHand)"
                            stroke="#fecaca"
                            strokeOpacity="0.6"
                            strokeWidth="1.2"
                          />
                          <circle
                            cx="4"
                            cy="-2"
                            r="10"
                            fill="#450a0a"
                            fillOpacity="0.8"
                            stroke="#f87171"
                            strokeWidth="1.2"
                          />
                          <text
                            x="4"
                            y="2"
                            textAnchor="middle"
                            className="fill-red-200 text-[10px] font-mono font-bold"
                          >
                            R
                          </text>
                        </g>
                      </g>

                      <text
                        x="250"
                        y="422"
                        textAnchor="middle"
                        className="fill-gray-500 text-[10px] font-mono tracking-widest uppercase"
                      >
                        ▲ 20° Side-Elevation View (Stick Lift & Stroke Arc) ▲
                      </text>
                    </>
                  )}
                </>
              )}
            </svg>
          </div>

          {/* Bottom Live Hand / Bell Action Callouts */}
          {isAgogo ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 max-w-xl mx-auto">
              <div
                className={`rounded-xl px-2 sm:px-3 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 border transition-colors ${
                  agogoMotion.highImpact > 0.1
                    ? "bg-yellow-400/25 border-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.35)]"
                    : "bg-gray-900/90 border-yellow-400/30"
                }`}
              >
                <Bell
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                    agogoMotion.highImpact > 0.1
                      ? "text-yellow-200"
                      : "text-yellow-300"
                  }`}
                />
                <div
                  className={`text-[11px] sm:text-xs font-bold truncate ${
                    agogoMotion.highImpact > 0.1
                      ? "text-white"
                      : "text-yellow-200"
                  }`}
                >
                  UP • HIGH BELL (a)
                </div>
              </div>

              <div
                className={`rounded-xl px-2 sm:px-3 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 border transition-colors ${
                  agogoMotion.lowImpact > 0.1
                    ? "bg-amber-500/25 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)]"
                    : "bg-gray-900/90 border-amber-500/30"
                }`}
              >
                <Bell
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                    agogoMotion.lowImpact > 0.1
                      ? "text-amber-200"
                      : "text-amber-500"
                  }`}
                />
                <div
                  className={`text-[11px] sm:text-xs font-bold truncate ${
                    agogoMotion.lowImpact > 0.1
                      ? "text-white"
                      : "text-amber-300"
                  }`}
                >
                  DOWN • LOW BELL (o)
                </div>
              </div>
            </div>
          ) : isTamborim ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 max-w-xl mx-auto">
              <div className="bg-gray-900/90 border border-cyan-500/30 rounded-xl px-2.5 sm:px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Hand className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 -scale-x-100 shrink-0" />
                  <div className="text-[11px] sm:text-xs font-bold text-cyan-300 truncate">
                    LEFT HAND (L)
                  </div>
                </div>
                {leadHand === "R" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 shrink-0">
                    HOLDING DRUM
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold border shrink-0 ${
                      tamborimMotion.phaseLabel === "STICK HIT!"
                        ? "bg-cyan-500 text-black border-cyan-400"
                        : tamborimMotion.phaseLabel === "LIFT"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-gray-800 text-gray-400 border-transparent"
                    }`}
                  >
                    {tamborimMotion.phaseLabel}
                  </span>
                )}
              </div>

              <div className="bg-gray-900/90 border border-red-500/30 rounded-xl px-2.5 sm:px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Hand className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 shrink-0" />
                  <div className="text-[11px] sm:text-xs font-bold text-red-300 truncate">
                    RIGHT HAND (R)
                  </div>
                </div>
                {leadHand === "L" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold bg-red-950/70 text-red-300 border border-red-500/30 shrink-0">
                    HOLDING DRUM
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold border shrink-0 ${
                      tamborimMotion.phaseLabel === "STICK HIT!"
                        ? "bg-red-600 text-white border-red-500"
                        : tamborimMotion.phaseLabel === "LIFT"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-gray-800 text-gray-400 border-transparent"
                    }`}
                  >
                    {tamborimMotion.phaseLabel}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 max-w-xl mx-auto">
              <div className="bg-gray-900/90 border border-cyan-500/30 rounded-xl px-2.5 sm:px-3 py-2 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Hand className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 -scale-x-100 shrink-0" />
                  <div className="text-[11px] sm:text-xs font-bold text-cyan-300 truncate">
                    LEFT (L)
                  </div>
                </div>
                <span
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold border shrink-0 ${
                    leftMotion.phaseLabel === "ACCENT" ||
                    leftMotion.phaseLabel === "FLAM"
                      ? "bg-cyan-500 text-black border-cyan-400"
                      : leftMotion.phaseLabel === "TAP"
                      ? "bg-cyan-600 text-white border-cyan-500"
                      : leftMotion.phaseLabel === "LIFT"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-gray-800 text-gray-400 border-transparent"
                  }`}
                >
                  {leftMotion.phaseLabel}
                </span>
              </div>

              <div className="bg-gray-900/90 border border-red-500/30 rounded-xl px-2.5 sm:px-3 py-2 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Hand className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 shrink-0" />
                  <div className="text-[11px] sm:text-xs font-bold text-red-300 truncate">
                    RIGHT (R)
                  </div>
                </div>
                <span
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold border shrink-0 ${
                    rightMotion.phaseLabel === "ACCENT" ||
                    rightMotion.phaseLabel === "FLAM"
                      ? "bg-red-600 text-white border-red-500"
                      : rightMotion.phaseLabel === "TAP"
                      ? "bg-cyan-600 text-white border-cyan-500"
                      : rightMotion.phaseLabel === "LIFT"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-gray-800 text-gray-400 border-transparent"
                  }`}
                >
                  {rightMotion.phaseLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* STEP-BY-STEP STICKING BREAKDOWN (Single Compact Horizontal Row so it never pushes the screen down) */}
        <div className="bg-[#07080d] border border-gray-800 rounded-2xl p-2.5 sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
            <h4 className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
              {isAgogo
                ? "Up / Down Bell Grid (Agogô)"
                : `Sticking & Stroke Grid (${currentInstrumentMeta.label})`}
            </h4>
            <span className="text-[10px] sm:text-[11px] text-gray-400">
              Tap step while paused to inspect
            </span>
          </div>

          <div ref={gridScrollRef} className="overflow-x-auto pb-1">
            <div className="flex gap-1 min-w-max py-0.5">
              {parsedSteps.map((st) => {
                const isCurrent = st.index === activeStepIndex;
                const isHighBell = st.stroke === "highBell";
                const isLowBell = st.stroke === "lowBell";
                const isAccent =
                  st.stroke === "accent" ||
                  st.stroke === "flam" ||
                  isHighBell ||
                  isLowBell;
                const isTap = st.stroke === "tap";
                const isBeatStart = st.index % 4 === 0;

                return (
                  <button
                    key={st.index}
                    type="button"
                    onClick={() => setInspectedStep(st.index)}
                    className={`w-8 shrink-0 flex flex-col items-center py-1 px-0.5 rounded-lg border transition-colors ${
                      isCurrent
                        ? "bg-red-600/25 border-red-500 shadow-sm shadow-red-500/20"
                        : isBeatStart
                        ? "bg-gray-900/90 border-gray-700 hover:border-gray-500"
                        : "bg-gray-950/80 border-gray-800/80 hover:border-gray-700"
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

                    {/* Visual Indicator */}
                    <div className="h-7 flex items-center justify-center my-1">
                      {isAgogo ? (
                        isHighBell ? (
                          <div className="w-3.5 h-3.5 rounded-t-full bg-yellow-300 self-start shadow shadow-yellow-300/50" />
                        ) : isLowBell ? (
                          <div className="w-3.5 h-3.5 rounded-b-full bg-amber-500 self-end shadow shadow-amber-500/50" />
                        ) : (
                          <div className="w-1.5 h-0.5 bg-gray-700 rounded" />
                        )
                      ) : isAccent ? (
                        <div className="w-2.5 h-6 rounded-sm bg-red-500 shadow shadow-red-500/50 self-end" />
                      ) : isTap ? (
                        <div className="w-2 h-2.5 rounded-full bg-cyan-400 shadow shadow-cyan-400/50 self-end" />
                      ) : (
                        <div className="w-1.5 h-0.5 bg-gray-700 rounded self-end" />
                      )}
                    </div>

                    {/* Notation Character */}
                    <span
                      className={`text-xs font-mono font-bold ${
                        isHighBell
                          ? "text-yellow-300"
                          : isLowBell
                          ? "text-amber-400"
                          : isAccent
                          ? "text-red-400"
                          : isTap
                          ? "text-cyan-300"
                          : "text-gray-600"
                      }`}
                    >
                      {st.rawChar === " " ? "·" : st.rawChar}
                    </span>

                    {/* Hand or Up/Down Assignment */}
                    <span
                      className={`text-[10px] font-mono font-bold mt-0.5 px-1 rounded ${
                        st.stroke === "none"
                          ? "text-gray-600"
                          : isAgogo
                          ? isHighBell
                            ? "text-yellow-200 bg-yellow-950/70"
                            : "text-amber-300 bg-amber-950/70"
                          : st.hand === "R"
                          ? "text-red-300 bg-red-950/60"
                          : "text-cyan-300 bg-cyan-950/60"
                      }`}
                    >
                      {isAgogo
                        ? isHighBell
                          ? "UP"
                          : isLowBell
                          ? "DN"
                          : "·"
                        : st.hand}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {patternObj?.mnemonics?.[selectedInstrument] && (
            <div className="mt-3 pt-2.5 border-t border-gray-800/80 text-xs text-gray-300 flex items-center gap-2">
              <span className="text-gray-500 font-mono uppercase">
                Chant/Mnemonic:
              </span>
              <span className="italic text-yellow-300/90">
                "{patternObj.mnemonics[selectedInstrument]}"
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
