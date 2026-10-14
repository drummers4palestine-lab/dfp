import { useEffect, useMemo, useRef } from "react";
import { VolumeX } from "lucide-react";

interface PatternVisualizerProps {
  pattern: any;
  currentStep: number;
  instrumentStates: Record<string, { enabled: boolean; volume: number }>;
  isPlaying?: boolean;
  beatsPerBar?: number;
}

interface InstrumentConfig {
  key: string;
  name: string;
  shortName: string;
  role: string;
  color: string;
  bgActive: string;
  bgGhost: string;
  borderActive: string;
  textColor: string;
  glowColor: string;
}

const INSTRUMENTS: InstrumentConfig[] = [
  {
    key: "ls",
    name: "Low Surdo",
    shortName: "LOW",
    role: "Bass Foundation",
    color: "#10b981",
    bgActive: "bg-emerald-500 text-black border-emerald-300",
    bgGhost: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
    borderActive: "border-emerald-400",
    textColor: "text-emerald-400",
    glowColor: "shadow-[0_0_12px_rgba(16,185,129,0.75)]",
  },
  {
    key: "ms",
    name: "Mid Surdo",
    shortName: "MID",
    role: "Mid Counter",
    color: "#f59e0b",
    bgActive: "bg-amber-500 text-black border-amber-300",
    bgGhost: "bg-amber-500/25 text-amber-300 border-amber-500/40",
    borderActive: "border-amber-400",
    textColor: "text-amber-400",
    glowColor: "shadow-[0_0_12px_rgba(245,158,11,0.75)]",
  },
  {
    key: "hs",
    name: "High Surdo",
    shortName: "HIGH",
    role: "High Cut",
    color: "#a855f7",
    bgActive: "bg-purple-500 text-white border-purple-300",
    bgGhost: "bg-purple-500/25 text-purple-300 border-purple-500/40",
    borderActive: "border-purple-400",
    textColor: "text-purple-400",
    glowColor: "shadow-[0_0_12px_rgba(168,85,247,0.75)]",
  },
  {
    key: "re",
    name: "Repinique",
    shortName: "REPI",
    role: "Lead / Calls",
    color: "#f43f5e",
    bgActive: "bg-rose-500 text-white border-rose-300",
    bgGhost: "bg-rose-500/25 text-rose-300 border-rose-500/40",
    borderActive: "border-rose-400",
    textColor: "text-rose-400",
    glowColor: "shadow-[0_0_12px_rgba(244,63,94,0.75)]",
  },
  {
    key: "sn",
    name: "Snare",
    shortName: "SNARE",
    role: "Caixa Groove",
    color: "#06b6d4",
    bgActive: "bg-cyan-400 text-black border-cyan-200",
    bgGhost: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    borderActive: "border-cyan-400",
    textColor: "text-cyan-400",
    glowColor: "shadow-[0_0_12px_rgba(6,182,212,0.8)]",
  },
  {
    key: "ta",
    name: "Tamborim",
    shortName: "TAM",
    role: "Sharp Clave",
    color: "#f97316",
    bgActive: "bg-orange-500 text-white border-orange-300",
    bgGhost: "bg-orange-500/25 text-orange-300 border-orange-500/40",
    borderActive: "border-orange-400",
    textColor: "text-orange-400",
    glowColor: "shadow-[0_0_12px_rgba(249,115,22,0.75)]",
  },
  {
    key: "ag",
    name: "Agogô",
    shortName: "AGOGO",
    role: "Two-Tone Bell",
    color: "#eab308",
    bgActive: "bg-yellow-400 text-black border-yellow-200",
    bgGhost: "bg-yellow-500/25 text-yellow-300 border-yellow-500/40",
    borderActive: "border-yellow-400",
    textColor: "text-yellow-400",
    glowColor: "shadow-[0_0_12px_rgba(234,179,8,0.75)]",
  },
  {
    key: "sh",
    name: "Shaker",
    shortName: "SHAKE",
    role: "Chocalho",
    color: "#14b8a6",
    bgActive: "bg-teal-400 text-black border-teal-200",
    bgGhost: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    borderActive: "border-teal-400",
    textColor: "text-teal-400",
    glowColor: "shadow-[0_0_12px_rgba(20,184,166,0.75)]",
  },
  {
    key: "ot",
    name: "Calls / Whistle",
    shortName: "CALL",
    role: "Whistle / Vocal",
    color: "#ec4899",
    bgActive: "bg-pink-500 text-white border-pink-300",
    bgGhost: "bg-pink-500/25 text-pink-300 border-pink-500/40",
    borderActive: "border-pink-400",
    textColor: "text-pink-400",
    glowColor: "shadow-[0_0_12px_rgba(236,72,153,0.75)]",
  },
];

function resolvePatternString(pattern: any, instrumentKey: string): string {
  if (!pattern) return "";
  let val = pattern[instrumentKey];
  let guard = 0;
  while (typeof val === "string" && val.startsWith("@") && guard < 6) {
    const targetKey = val.slice(1).trim();
    val = pattern[targetKey];
    guard++;
  }
  return typeof val === "string" ? val : "";
}

function getStrokeMeta(instrumentKey: string, char: string) {
  if (!char || char === " ") {
    return { type: "rest" as const, label: "", title: "Rest" };
  }
  if (char === ".") {
    return {
      type: "ghost" as const,
      label: "•",
      title: "Tap / Ghost Note",
    };
  }
  if (instrumentKey === "ag") {
    if (char === "a") {
      return {
        type: "high-bell" as const,
        label: "a",
        title: "High Agogô Bell",
      };
    }
    if (char === "o") {
      return {
        type: "low-bell" as const,
        label: "o",
        title: "Low Agogô Bell",
      };
    }
  }
  if (char === "f") {
    return { type: "special" as const, label: "f", title: "Flam" };
  }
  if (char === "r") {
    return { type: "special" as const, label: "r", title: "Rim Shot" };
  }
  if (char === "h") {
    return { type: "special" as const, label: "h", title: "Hand Hit" };
  }
  if (char === "s") {
    return { type: "special" as const, label: "s", title: "Slap / Dampened" };
  }
  if (char === "0") {
    return { type: "special" as const, label: "0", title: "Muted Hit" };
  }
  if (char === "z") {
    return { type: "special" as const, label: "z", title: "Buzz Roll" };
  }
  return {
    type: "accent" as const,
    label: char === "X" ? "X" : char,
    title: char === "X" ? "Accent Hit" : `Hit (${char})`,
  };
}

export default function PatternVisualizer({
  pattern,
  currentStep,
  instrumentStates,
  isPlaying = false,
  beatsPerBar = 4,
}: PatternVisualizerProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stepHeaderRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const resolvedTracks = useMemo(() => {
    const tracks = INSTRUMENTS.map((inst) => {
      const raw = resolvePatternString(pattern, inst.key);
      const hasNotes = raw.split("").some((c) => c !== " ");
      const state = instrumentStates[inst.key];
      const enabled = inst.key === "ot" ? true : (state?.enabled ?? true);
      const volume = state?.volume ?? 100;
      const mnemonic = pattern?.mnemonics?.[inst.key] as string | undefined;
      return {
        ...inst,
        raw,
        hasNotes,
        enabled,
        volume,
        mnemonic,
      };
    });

    return tracks.filter((t) => t.hasNotes);
  }, [pattern, instrumentStates]);

  const patternLength = useMemo(() => {
    if (resolvedTracks.length === 0) return 16;
    return Math.max(...resolvedTracks.map((t) => t.raw.length), 16);
  }, [resolvedTracks]);

  const stepsPerBeat = beatsPerBar === 3 ? 3 : 4;
  const stepsPerBar = 16;
  const totalBars = Math.ceil(patternLength / stepsPerBar);
  const activeBarIndex = Math.floor(currentStep / stepsPerBar);

  const prevStepRef = useRef<number>(currentStep);

  // Auto-scroll horizontal container to follow the active step smoothly,
  // and teleport instantly back to the start when looping or resetting
  useEffect(() => {
    const container = scrollContainerRef.current;
    const stepEl = stepHeaderRefs.current[currentStep];
    if (!container || !stepEl) return;

    const didWrapBack = currentStep === 0 || currentStep < prevStepRef.current;
    prevStepRef.current = currentStep;

    if (didWrapBack) {
      container.scrollLeft = 0;
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const stepRect = stepEl.getBoundingClientRect();
    // Account for the sticky left instrument label column (~140px)
    const stickyColumnWidth = 148;
    const visibleWidth = containerRect.width - stickyColumnWidth;
    const stepCenterRelativeToViewport =
      stepRect.left - containerRect.left - stickyColumnWidth + stepRect.width / 2;

    // Keep the playhead comfortably centered in the scrollable timeline area
    const targetOffset =
      container.scrollLeft + stepCenterRelativeToViewport - visibleWidth * 0.42;

    container.scrollTo({
      left: Math.max(0, targetOffset),
      behavior: isPlaying ? "smooth" : "auto",
    });
  }, [currentStep, isPlaying]);

  if (!pattern || resolvedTracks.length === 0) {
    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-6 text-center text-gray-400 text-sm">
        No active instrument notes in this pattern. Add beats above to see the multi-layered visualizer.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-3 sm:p-5 rounded-xl shadow-2xl border border-gray-800 space-y-4">
      {/* Top Header Bar: Live Status + Active Instrument Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying
                  ? "bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-xs font-mono font-bold text-gray-200">
              STEP {String(currentStep + 1).padStart(2, "0")} / {patternLength}
            </span>
            {totalBars > 1 && (
              <span className="text-xs font-mono text-amber-400 border-l border-gray-700 pl-2">
                BAR {activeBarIndex + 1} OF {totalBars}
              </span>
            )}
          </div>

          {/* Active Instrument Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {resolvedTracks.map((track) => {
              const char =
                track.raw[currentStep % Math.max(track.raw.length, 1)] || " ";
              const isFiring = track.enabled && char !== " ";
              return (
                <span
                  key={track.key}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all duration-100 ${
                    !track.enabled
                      ? "border-gray-800 text-gray-600 bg-gray-900/40 line-through"
                      : isFiring
                      ? "border-white/60 text-white scale-105"
                      : "border-gray-800 text-gray-400 bg-gray-900/70"
                  }`}
                  style={{
                    backgroundColor: isFiring ? `${track.color}33` : undefined,
                    borderColor: isFiring ? track.color : undefined,
                  }}
                >
                  {track.shortName}
                </span>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] font-mono text-gray-400">
          Auto-Scrolling Timeline
        </div>
      </div>

      {/* Full Auto-Scrolling Horizontal Timeline View */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/80 p-2 sm:p-3"
      >
        <div className="inline-flex flex-col min-w-full space-y-1.5">
          {/* Bar & Step Header Row */}
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <div className="sticky left-0 z-20 w-28 sm:w-36 shrink-0 bg-gray-950/95 backdrop-blur-sm py-1.5 px-2 rounded-l border-r border-gray-800 text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Instrument
            </div>
            <div className="flex gap-1 sm:gap-1.5 pr-4">
              {Array.from({ length: patternLength }, (_, stepIndex) => {
                const isPlayhead = stepIndex === currentStep;
                const isBarStart = stepIndex % stepsPerBar === 0;
                const isBeatStart = stepIndex % stepsPerBeat === 0;
                const barNum = Math.floor(stepIndex / stepsPerBar) + 1;
                const beatNum =
                  Math.floor((stepIndex % stepsPerBar) / stepsPerBeat) + 1;

                return (
                  <div
                    key={stepIndex}
                    ref={(el) => {
                      stepHeaderRefs.current[stepIndex] = el;
                    }}
                    className={`relative w-8 sm:w-9 h-8 flex flex-col items-center justify-center font-mono rounded-md shrink-0 transition-all duration-100 ${
                      isBarStart && stepIndex > 0
                        ? "ml-3 before:content-[''] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-amber-500/40"
                        : isBeatStart && stepIndex > 0
                        ? "ml-1"
                        : ""
                    } ${
                      isPlayhead
                        ? "bg-red-500 text-white font-bold shadow-md shadow-red-500/50 scale-105"
                        : isBarStart
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                        : isBeatStart
                        ? "bg-gray-800/90 text-amber-200/90 font-bold"
                        : "bg-gray-900/60 text-gray-500"
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] leading-none">
                      {stepIndex + 1}
                    </span>
                    {isBarStart ? (
                      <span
                        className={`text-[8px] leading-none mt-0.5 font-extrabold ${
                          isPlayhead ? "text-white" : "text-amber-400"
                        }`}
                      >
                        BAR {barNum}
                      </span>
                    ) : isBeatStart ? (
                      <span
                        className={`text-[8px] leading-none mt-0.5 ${
                          isPlayhead ? "text-red-100" : "text-gray-400"
                        }`}
                      >
                        B{beatNum}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Track Instrument Rows */}
          {resolvedTracks.map((track) => {
            const isCurrentStepHit =
              track.enabled &&
              track.raw[currentStep % Math.max(track.raw.length, 1)] &&
              track.raw[currentStep % Math.max(track.raw.length, 1)] !== " ";

            return (
              <div
                key={track.key}
                className={`flex items-center gap-2 sm:gap-3 py-1 rounded-lg transition-colors ${
                  !track.enabled
                    ? "opacity-40 bg-gray-900/30"
                    : isCurrentStepHit
                    ? "bg-gray-800/70"
                    : "bg-gray-900/40 hover:bg-gray-800/40"
                }`}
              >
                {/* Sticky Left Instrument Badge */}
                <div className="sticky left-0 z-20 w-28 sm:w-36 shrink-0 bg-gray-950/95 backdrop-blur-sm py-1.5 px-2.5 rounded-l flex items-center justify-between border-r border-gray-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-100 ${
                        isCurrentStepHit ? "scale-150" : "scale-100"
                      }`}
                      style={{
                        backgroundColor: track.color,
                        boxShadow: isCurrentStepHit
                          ? `0 0 10px ${track.color}`
                          : "none",
                      }}
                    />
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                        {track.name}
                      </div>
                      <div className="text-[10px] text-gray-500 hidden sm:block truncate">
                        {track.role}
                      </div>
                    </div>
                  </div>
                  {!track.enabled && (
                    <span
                      title="Instrument Muted"
                      className="text-gray-500 shrink-0 ml-1"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Step Cells */}
                <div className="flex gap-1 sm:gap-1.5 pr-4 items-center">
                  {Array.from({ length: patternLength }, (_, stepIndex) => {
                    const trackLen = track.raw.length || 16;
                    const char = track.raw[stepIndex % trackLen] || " ";
                    const stroke = getStrokeMeta(track.key, char);
                    const isPlayhead = stepIndex === currentStep;
                    const isBarStart = stepIndex % stepsPerBar === 0;
                    const isBeatStart = stepIndex % stepsPerBeat === 0;

                    return (
                      <div
                        key={stepIndex}
                        title={`${track.name} • Step ${stepIndex + 1}: ${stroke.title}`}
                        className={`relative w-8 sm:w-9 h-8 sm:h-9 rounded-md flex items-center justify-center select-none shrink-0 transition-all duration-100 ${
                          isBarStart && stepIndex > 0
                            ? "ml-3 before:content-[''] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-amber-500/25"
                            : isBeatStart && stepIndex > 0
                            ? "ml-1"
                            : ""
                        } ${
                          isPlayhead
                            ? "ring-2 ring-red-500 z-10 bg-red-500/20"
                            : "bg-gray-950/80"
                        }`}
                      >
                        {/* Subtle beat downbeat tick */}
                        {isBeatStart && stroke.type === "rest" && (
                          <div className="w-1 h-1 rounded-full bg-gray-700/80" />
                        )}

                        {/* Rest dot */}
                        {!isBeatStart && stroke.type === "rest" && (
                          <div className="w-0.5 h-0.5 rounded-full bg-gray-800" />
                        )}

                        {/* Ghost / Tap Note ('.') */}
                        {stroke.type === "ghost" && (
                          <div
                            className={`w-4/5 h-4 rounded flex items-center justify-center text-[10px] font-bold border transition-transform ${
                              track.bgGhost
                            } ${
                              isPlayhead && track.enabled
                                ? "scale-110 brightness-125"
                                : ""
                            }`}
                          >
                            •
                          </div>
                        )}

                        {/* Agogô High Bell ('o') vs Low Bell ('a') */}
                        {stroke.type === "high-bell" && (
                          <div
                            className={`w-full h-4.5 self-start rounded-t-md rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-extrabold border ${
                              track.bgActive
                            } ${
                              isPlayhead && track.enabled
                                ? `${track.glowColor} scale-110`
                                : ""
                            }`}
                          >
                            o
                          </div>
                        )}

                        {stroke.type === "low-bell" && (
                          <div
                            className={`w-full h-4.5 self-end rounded-b-md rounded-t-sm flex items-center justify-center text-[10px] sm:text-xs font-extrabold border ${
                              track.bgActive
                            } opacity-90 ${
                              isPlayhead && track.enabled
                                ? `${track.glowColor} scale-110`
                                : ""
                            }`}
                          >
                            a
                          </div>
                        )}

                        {/* Special Stroke (flam 'f', rim 'r', hand 'h', slap 's', muted '0', buzz 'z') */}
                        {stroke.type === "special" && (
                          <div
                            className={`w-full h-7 rounded-md flex items-center justify-center text-[11px] sm:text-xs font-black uppercase border-2 border-dashed ${
                              track.bgGhost
                            } ${
                              isPlayhead && track.enabled
                                ? `${track.glowColor} scale-110 brightness-125`
                                : ""
                            }`}
                          >
                            {stroke.label}
                          </div>
                        )}

                        {/* Full Accent Hit ('X') */}
                        {stroke.type === "accent" && (
                          <div
                            className={`w-full h-full rounded-md flex items-center justify-center text-[11px] sm:text-xs font-extrabold border transition-transform ${
                              track.bgActive
                            } ${
                              isPlayhead && track.enabled
                                ? `${track.glowColor} scale-110 brightness-110`
                                : "shadow-sm"
                            }`}
                          >
                            {stroke.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Layer Count Footer */}
      <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Notation:
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-500 text-black font-extrabold text-[10px] flex items-center justify-center">
              X
            </span>
            <span>Accent / Hit</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-3 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center justify-center">
              •
            </span>
            <span>Ghost Tap (.)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-dashed border-rose-400 bg-rose-500/20 text-rose-300 font-bold text-[10px] flex items-center justify-center">
              f/r
            </span>
            <span>Flam / Rim / Hand</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-yellow-400 text-black font-extrabold text-[10px] flex items-center justify-center">
              o/a
            </span>
            <span>High / Low Bell</span>
          </span>
        </div>

        <div className="text-[11px] text-gray-500">
          {resolvedTracks.length} active instrument
          {resolvedTracks.length === 1 ? "" : "s"} layered
        </div>
      </div>
    </div>
  );
}
