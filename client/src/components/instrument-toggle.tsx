import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface InstrumentToggleProps {
  instrument: string;
  label: string;
  description: string;
  enabled: boolean;
  volume: number;
  onToggle: (instrument: string, enabled: boolean) => void;
  onVolumeChange: (instrument: string, volume: number) => void;
}

export default function InstrumentToggle({
  instrument,
  label,
  description,
  enabled,
  volume,
  onToggle,
  onVolumeChange
}: InstrumentToggleProps) {
  return (
    <Card className="bg-black border-gray-600">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-sm">{label}</div>
            <div className="text-xs text-gray-400">{description}</div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => onToggle(instrument, checked)}
            className="instrument-toggle"
          />
        </div>
        <div>
          <Slider
            value={[volume]}
            onValueChange={(value) => onVolumeChange(instrument, value[0])}
            min={0}
            max={100}
            step={1}
            className="w-full"
            disabled={!enabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
