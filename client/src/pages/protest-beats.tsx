import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProtestBeatPlayer, { ProtestBeatPlayerRef } from "@/components/protest-beat-player";
import { protestBeats } from "@/data/protest-beats";

export default function ProtestBeats() {
  const [selectedBeat, setSelectedBeat] = useState(protestBeats[0]);
  const [playingBeat, setPlayingBeat] = useState<string | null>(null);
  const beatboxPlayerRef = useRef<ProtestBeatPlayerRef>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  
  // Convert protest beat to tune format for the player
  const convertBeatToTune = (beat: any) => ({
    name: beat.id,
    displayName: beat.name,
    categories: ["protest"],
    speed: beat.tempo,
    time: 4,
    description: beat.fullDescription,
    patterns: {
      Beat: {
        loop: true,
        ls: beat.pattern,
        ms: beat.pattern,
        hs: beat.pattern,
        re: beat.pattern,
        sn: beat.pattern,
        ta: beat.pattern,
        ag: beat.pattern,
        sh: beat.pattern,
        mnemonics: {}
      }
    }
  });

  // Handle beat selection and play/pause
  const handleBeatClick = (beat: any) => {
    if (playingBeat === beat.id) {
      // If this beat is playing, stop it
      setPlayingBeat(null);
      if (beatboxPlayerRef.current) {
        beatboxPlayerRef.current.pause();
      }
    } else {
      // If different beat or not playing, start this beat
      setSelectedBeat(beat);
      setPlayingBeat(beat.id);
      // The autoPlay prop will trigger play when the component updates
      
      // Auto-scroll to player section after a brief delay to allow state update
      setTimeout(() => {
        if (playerSectionRef.current) {
          playerSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  };

  // Stop playing when beat changes
  useEffect(() => {
    if (playingBeat && playingBeat !== selectedBeat.id) {
      setPlayingBeat(null);
    }
  }, [selectedBeat.id, playingBeat]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="street-text font-bold text-3xl sm:text-4xl md:text-5xl mb-4">Protest Beats</h1>
          <p className="text-lg sm:text-xl text-gray-300">Rhythms of resistance and solidarity for Palestinian freedom</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-start justify-center">
          <div className="md:col-span-1">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Select Beat</h2>
            <div className="space-y-2 sm:space-y-3">
              {protestBeats.map((beat) => (
                <Button
                  key={beat.id}
                  variant={selectedBeat.id === beat.id ? "default" : "outline"}
                  className={`w-full p-3 sm:p-4 h-auto text-left justify-start text-sm sm:text-base ${
                    playingBeat === beat.id
                      ? "bg-green-600 hover:bg-green-700 text-white animate-pulse"
                      : selectedBeat.id === beat.id
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600"
                  }`}
                  onClick={() => handleBeatClick(beat)}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="font-semibold">{beat.name}</div>
                    <div className="text-xs sm:text-sm opacity-75">{beat.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          beat.difficulty === "Easy"
                            ? "bg-green-600" 
                            : beat.difficulty === "Medium" 
                            ? "bg-yellow-600" 
                            : "bg-red-600"
                        }`}
                      >
                        {beat.difficulty}
                      </Badge>
                      <span className="text-xs text-gray-400">{beat.tempo} BPM</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2" ref={playerSectionRef}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="street-text text-2xl sm:text-3xl font-bold mb-2">{selectedBeat.name}</h2>
                <p className="text-gray-300 text-base sm:text-lg mb-2">{selectedBeat.description}</p>
                <p className="text-gray-400 text-sm sm:text-base">{selectedBeat.fullDescription}</p>
              </div>

              <div className="bg-black p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Pattern Visualization:</h4>
                
                {/* First row: beats 1-8 */}
                <div className="flex items-center justify-between mb-2">
                  {Array.from({ length: 8 }, (_, i) => {
                    const shouldShowSeparator = i % 4 === 0 && i > 0;
                    return (
                      <div key={i} className="flex items-center">
                        {shouldShowSeparator && (
                          <div className="w-0.5 h-4 sm:h-6 bg-yellow-400 mx-1 shadow-lg shadow-yellow-400/50"></div>
                        )}
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            selectedBeat.pattern[i] && selectedBeat.pattern[i] !== ' ' 
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                              : 'bg-gray-700 text-gray-400'
                          }`}
                          title={`Beat ${i + 1}`}
                        >
                          {i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Second row: beats 9-16 */}
                <div className="flex items-center justify-between mb-4">
                  {Array.from({ length: 8 }, (_, i) => {
                    const beatIndex = i + 8;
                    const shouldShowSeparator = i % 4 === 0 && i > 0;
                    return (
                      <div key={beatIndex} className="flex items-center">
                        {shouldShowSeparator && (
                          <div className="w-0.5 h-4 sm:h-6 bg-yellow-400 mx-1 shadow-lg shadow-yellow-400/50"></div>
                        )}
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            selectedBeat.pattern[beatIndex] && selectedBeat.pattern[beatIndex] !== ' ' 
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                              : 'bg-gray-700 text-gray-400'
                          }`}
                          title={`Beat ${beatIndex + 1}`}
                        >
                          {beatIndex + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-gray-400 text-xs sm:text-sm">
                  Pattern: <span className="font-mono text-xs sm:text-sm">{selectedBeat.pattern}</span>
                </div>
              </div>

              <ProtestBeatPlayer 
                ref={beatboxPlayerRef}
                tune={convertBeatToTune(selectedBeat)} 
                autoPlay={playingBeat === selectedBeat.id}
                onPlayStateChange={(isPlaying) => {
                  if (!isPlaying && playingBeat === selectedBeat.id) {
                    setPlayingBeat(null);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}