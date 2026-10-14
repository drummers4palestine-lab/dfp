import { useState } from "react";
import BeatboxPlayer from "@/components/beatbox-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tunes } from "@/data/tunes";

export default function Tunes() {
  const [selectedTune, setSelectedTune] = useState(tunes[0]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="street-text font-bold text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">Traditional Tunes</h1>
          <p className="text-base sm:text-xl text-gray-300">Master the classics of samba resistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Tune Selection */}
          <div className="lg:col-span-1 min-w-0">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="py-4 sm:py-6">
                <CardTitle className="street-text text-xl">Select Tune</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {tunes.map((tune) => (
                  <button
                    key={tune.name}
                    onClick={() => setSelectedTune(tune)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTune.name === tune.name
                        ? "bg-red-600 border-2 border-red-500"
                        : "bg-black hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-semibold">{tune.displayName || tune.name}</div>
                    <div className="text-sm text-gray-400">
                      {tune.categories?.join(" • ")} • {tune.speed} BPM
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Beatbox Player */}
          <div className="lg:col-span-3 min-w-0">
            <BeatboxPlayer tune={selectedTune} showDrummerPov />
          </div>
        </div>
      </div>
    </div>
  );
}
