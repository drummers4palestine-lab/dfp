import { useState, useMemo } from "react";
import BeatboxPlayer from "@/components/beatbox-player";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { tunes } from "@/data/tunes";
import { Search, Music, Gauge, Layers, Sparkles } from "lucide-react";

export default function Tunes() {
  const [selectedTune, setSelectedTune] = useState(tunes[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTunes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tunes;
    return tunes.filter((tune) =>
      (tune.displayName || tune.name).toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const sectionCount = Object.keys(selectedTune.patterns).length;

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6 py-4 sm:py-10 space-y-4 sm:space-y-6">
        {/* Compact Header + Tune Selector Bar */}
        <div className="bg-gradient-to-b from-gray-900/95 via-gray-950 to-black border border-gray-800 rounded-2xl p-3 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-red-500 shrink-0" />
                <h1 className="street-text font-bold text-xl sm:text-3xl md:text-4xl text-white">
                  Traditional Tunes
                </h1>
                <Badge
                  variant="outline"
                  className="border-red-500/40 bg-red-500/10 text-red-300 text-[11px] sm:text-xs font-mono"
                >
                  {tunes.length} Rhythms
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Tap a tune below to load it in the Drummer POV Trainer and Multi-Track Player
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tunes..."
                className="pl-9 h-9 bg-black/90 border-gray-700 text-white text-xs sm:text-sm rounded-xl focus:border-red-500"
              />
            </div>
          </div>

          {/* Mobile-Friendly Responsive Tune Selector Grid */}
          {filteredTunes.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400 bg-gray-950/60 rounded-xl border border-gray-800/80">
              No tunes match "{searchQuery}".{" "}
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-red-400 underline ml-1"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredTunes.map((tune) => {
                const isSelected = selectedTune.name === tune.name;
                const numSections = Object.keys(tune.patterns).length;
                return (
                  <button
                    key={tune.name}
                    type="button"
                    onClick={() => setSelectedTune(tune)}
                    className={`group relative text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col justify-between min-w-0 ${
                      isSelected
                        ? "bg-gradient-to-br from-red-600/25 via-red-950/40 to-black border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.22)]"
                        : "bg-gray-950/90 border-gray-800/90 hover:border-gray-600 hover:bg-gray-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span
                        className={`font-bold text-xs sm:text-sm leading-tight truncate ${
                          isSelected
                            ? "text-white"
                            : "text-gray-200 group-hover:text-white"
                        }`}
                      >
                        {tune.displayName || tune.name}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                            : "bg-gray-800 group-hover:bg-gray-600"
                        }`}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-red-500/20 text-red-200 font-bold"
                            : "bg-gray-900 text-gray-400"
                        }`}
                      >
                        {tune.speed} BPM
                      </span>
                      <span className="text-gray-400">
                        {numSections} {numSections === 1 ? "part" : "parts"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Tune Info Banner */}
          <div className="pt-2.5 sm:pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {selectedTune.displayName || selectedTune.name}
            </span>

            <div className="flex items-center gap-3 text-[11px] sm:text-xs font-mono text-gray-400 shrink-0">
              <span className="inline-flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-red-400" />
                Default {selectedTune.speed} BPM
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                {sectionCount} {sectionCount === 1 ? "Section" : "Sections"}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Width Drummer POV Trainer + Beatbox Player */}
        <BeatboxPlayer tune={selectedTune} showDrummerPov />
      </div>
    </div>
  );
}
