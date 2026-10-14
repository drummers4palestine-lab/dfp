import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";

interface InstrumentToggleProps {
  instrument: string;
  label: string;
  description: string;
  enabled: boolean;
  volume: number;
  onToggle: (instrument: string, enabled: boolean) => void;
  onVolumeChange: (instrument: string, volume: number) => void;
}

const INSTRUMENT_ACCENTS: Record<
  string,
  { dot: string; border: string; badge: string }
> = {
  ls: {
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    badge: "text-emerald-400",
  },
  ms: {
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    border: "border-amber-500/30 hover:border-amber-500/50",
    badge: "text-amber-400",
  },
  hs: {
    dot: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    border: "border-purple-500/30 hover:border-purple-500/50",
    badge: "text-purple-400",
  },
  re: {
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
    border: "border-rose-500/30 hover:border-rose-500/50",
    badge: "text-rose-400",
  },
  sn: {
    dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]",
    border: "border-cyan-500/30 hover:border-cyan-500/50",
    badge: "text-cyan-400",
  },
  ta: {
    dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]",
    border: "border-orange-500/30 hover:border-orange-500/50",
    badge: "text-orange-400",
  },
  ag: {
    dot: "bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]",
    border: "border-yellow-500/30 hover:border-yellow-500/50",
    badge: "text-yellow-400",
  },
  sh: {
    dot: "bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]",
    border: "border-teal-500/30 hover:border-teal-500/50",
    badge: "text-teal-400",
  },
};

export default function InstrumentToggle({
  instrument,
  label,
  description,
  enabled,
  volume,
  onToggle,
  onVolumeChange,
}: InstrumentToggleProps) {
  const accent = INSTRUMENT_ACCENTS[instrument] || {
    dot: "bg-red-500",
    border: "border-gray-700",
    badge: "text-gray-300",
  };

  return (
    <Card
      className={`transition-all duration-150 ${
        enabled
          ? `bg-gray-900/90 ${accent.border}`
          : "bg-gray-950/60 border-gray-800/80 opacity-60"
      }`}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                enabled ? accent.dot : "bg-gray-600"
              }`}
            />
            <div className="min-w-0">
              <div className="font-bold text-sm text-white leading-tight truncate">
                {label}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {description}
              </div>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => onToggle(instrument, checked)}
            className="instrument-toggle shrink-0"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {enabled ? (
            <Volume2 className={`w-3.5 h-3.5 shrink-0 ${accent.badge}`} />
          ) : (
            <VolumeX className="w-3.5 h-3.5 shrink-0 text-gray-600" />
          )}
          <Slider
            value={[volume]}
            onValueChange={(value) => onVolumeChange(instrument, value[0])}
            min={0}
            max={100}
            step={1}
            className="w-full"
            disabled={!enabled}
          />
          <span className="text-[11px] font-mono text-gray-400 w-8 text-right shrink-0">
            {volume}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
