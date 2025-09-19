import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeatboxPlayer from "@/components/beatbox-player";
import { renderAuthenticAudio } from "@/lib/audio-engine";
import { RotateCcw, Download } from "lucide-react";

export default function Experiment() {
  const [tuneName, setTuneName] = useState("My Custom Beat");
  const [tempo, setTempo] = useState(120);
  const [patternLength, setPatternLength] = useState(16);
  const [patterns, setPatterns] = useState({
    ls: "X   X   X   X   ", // Low Surdo
    ms: "  X   X   X   X ", // Mid Surdo
    hs: "    X       X   ", // High Surdo
    re: "  X   X   X   X ", // Repi
    sn: ". X . X . X . X ", // Snare
    ta: "X X X X X X X X ", // Tamborim
    ag: "a   o   a   o   ", // Agogo
    sh: ". . . . . . . . "  // Shaker
  });

  const instruments = [
    { key: 'ls', name: 'Low Surdo', description: 'Deep bass drum' },
    { key: 'ms', name: 'Mid Surdo', description: 'Medium bass drum' },
    { key: 'hs', name: 'High Surdo', description: 'High bass drum' },
    { key: 're', name: 'Repi', description: 'Snare-like drum' },
    { key: 'sn', name: 'Snare', description: 'Sharp snare drum' },
    { key: 'ta', name: 'Tamborim', description: 'Small high-pitched drum' },
    { key: 'ag', name: 'Agogo', description: 'Two-tone bell (a=low, o=high)' },
    { key: 'sh', name: 'Shaker', description: 'Percussion shaker' }
  ];

  const updatePattern = useCallback((instrument: string, index: number, value: string) => {
    setPatterns(prev => {
      const key = instrument as keyof typeof patterns;
      return {
        ...prev,
        [key]: prev[key].substring(0, index) + value + prev[key].substring(index + 1)
      };
    });
  }, []);

  const clearPattern = useCallback((instrument: string) => {
    setPatterns(prev => {
      const key = instrument as keyof typeof patterns;
      return {
        ...prev,
        [key]: " ".repeat(patternLength)
      };
    });
  }, [patternLength]);

  const resetAll = useCallback(() => {
    const basePattern = " ".repeat(patternLength);
    setPatterns({
      ls: basePattern,
      ms: basePattern,
      hs: basePattern,
      re: basePattern,
      sn: basePattern,
      ta: basePattern,
      ag: basePattern,
      sh: basePattern
    });
    setTempo(120);
    setTuneName("My Custom Beat");
  }, [patternLength]);

  const updatePatternLength = useCallback((newLength: number) => {
    setPatternLength(newLength);
    setPatterns(prev => {
      const result: any = {};
      Object.keys(prev).forEach(key => {
        const currentPattern = prev[key as keyof typeof prev];
        if (newLength > currentPattern.length) {
          // Extend pattern with spaces
          result[key] = currentPattern + " ".repeat(newLength - currentPattern.length);
        } else {
          // Truncate pattern
          result[key] = currentPattern.substring(0, newLength);
        }
      });
      return result;
    });
  }, []);

  // Convert experiment to tune format for the player
  const experimentTune = useMemo(() => ({
    name: "experiment",
    displayName: tuneName,
    categories: ["custom"],
    speed: tempo,
    time: 4,
    description: "Your custom experimental beat",
    patterns: {
      Custom: {
        loop: true,
        ...patterns,
        mnemonics: {}
      }
    }
  }), [tuneName, tempo, patterns]);

  const downloadAsMP3 = useCallback(async () => {
    try {
      // Create instrument states for the authentic audio renderer
      const instrumentStates = {
        ls: { enabled: true, volume: 80 },
        ms: { enabled: true, volume: 75 },
        hs: { enabled: true, volume: 70 },
        re: { enabled: true, volume: 85 },
        sn: { enabled: true, volume: 90 },
        ta: { enabled: true, volume: 75 },
        ag: { enabled: true, volume: 25 }, // Low agogo volume
        sh: { enabled: true, volume: 60 }
      };
      
      // Use the same authentic audio rendering as the play button
      const renderedBuffer = await renderAuthenticAudio(
        experimentTune,
        'Custom',
        tempo,
        instrumentStates,
        8 // 8 seconds duration
      );
      
      // Convert to WAV format
      const wavData = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tuneName.replace(/[^a-zA-Z0-9]/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Error generating audio file. Please try again.');
    }
  }, [tuneName, tempo, experimentTune]);

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  const PatternEditor = ({ instrument }: { instrument: any }) => {
    const pattern = patterns[instrument.key as keyof typeof patterns];
    
    // Create rows of 8 beats each
    const rows = [];
    for (let i = 0; i < patternLength; i += 8) {
      rows.push(Array.from({ length: Math.min(8, patternLength - i) }, (_, j) => i + j));
    }
    
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{instrument.name}</CardTitle>
              <p className="text-sm text-gray-400">{instrument.description}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => clearPattern(instrument.key)}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pattern grid with 8 beats per row */}
          <div className="space-y-3">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center gap-0.5 md:gap-1 overflow-x-auto">
                {row.map((beatIndex) => {
                  const shouldShowSeparator = beatIndex % 4 === 0 && beatIndex > 0 && beatIndex % 8 !== 0;
                  return (
                    <div key={beatIndex} className="flex items-center">
                      {shouldShowSeparator && (
                        <div className="w-0.5 h-4 bg-yellow-400 mx-0.5 shadow-lg shadow-yellow-400/50"></div>
                      )}
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">{beatIndex + 1}</div>
                        <button
                          className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border rounded-full text-xs font-bold transition-all duration-200 ${
                            pattern[beatIndex] === ' '
                              ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-400'
                              : 'border-green-400 bg-green-500 text-white shadow-lg shadow-green-500/30'
                          } focus:ring-2 focus:ring-white focus:outline-none`}
                          onClick={() => {
                            const currentChar = pattern[beatIndex];
                            let nextChar = ' ';
                            
                            if (instrument.key === 'ag') {
                              if (currentChar === ' ') nextChar = 'a';
                              else if (currentChar === 'a') nextChar = 'o';
                              else nextChar = ' ';
                            } else if (instrument.key === 'sn') {
                              if (currentChar === ' ') nextChar = '.';
                              else if (currentChar === '.') nextChar = 'X';
                              else nextChar = ' ';
                            } else {
                              nextChar = currentChar === 'X' ? ' ' : 'X';
                            }
                            
                            updatePattern(instrument.key, beatIndex, nextChar);
                          }}
                        >
                          {pattern[beatIndex] === ' ' ? '·' : pattern[beatIndex]}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          
          <div className="mt-3 text-xs text-gray-500 text-center">
            {instrument.key === 'ag' ? 'Click: • → a → o → •' : 
             instrument.key === 'sn' ? 'Click: • → . → X → •' : 
             'Click: • → X → •'}
          </div>
        </CardContent>
      </Card>
    );
  };
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, i) => {
                const index = i + 4;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                    <button
                      className={`w-6 h-6 md:w-8 md:h-8 border rounded-full text-xs font-bold transition-all duration-200 ${
                        pattern[index] === ' '
                          ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-400'
                          : 'border-green-400 bg-green-500 text-white shadow-lg shadow-green-500/30'
                      } focus:ring-2 focus:ring-white focus:outline-none`}
                      onClick={() => {
                        const currentChar = pattern[index];
                        let nextChar = ' ';
                        
                        if (instrument.key === 'ag') {
                          if (currentChar === ' ') nextChar = 'a';
                          else if (currentChar === 'a') nextChar = 'o';
                          else nextChar = ' ';
                        } else if (instrument.key === 'sn') {
                          if (currentChar === ' ') nextChar = '.';
                          else if (currentChar === '.') nextChar = 'X';
                          else nextChar = ' ';
                        } else {
                          nextChar = currentChar === 'X' ? ' ' : 'X';
                        }
                        
                        updatePattern(instrument.key, index, nextChar);
                      }}
                    >
                      {pattern[index] === ' ' ? '·' : pattern[index]}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Vertical separator */}
            <div className="w-0.5 h-8 bg-yellow-400 mx-1 shadow-lg shadow-yellow-400/50"></div>
            
            {/* Group 3 (beats 9-12) */}
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, i) => {
                const index = i + 8;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                    <button
                      className={`w-6 h-6 md:w-8 md:h-8 border rounded-full text-xs font-bold transition-all duration-200 ${
                        pattern[index] === ' '
                          ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-400'
                          : 'border-green-400 bg-green-500 text-white shadow-lg shadow-green-500/30'
                      } focus:ring-2 focus:ring-white focus:outline-none`}
                      onClick={() => {
                        const currentChar = pattern[index];
                        let nextChar = ' ';
                        
                        if (instrument.key === 'ag') {
                          if (currentChar === ' ') nextChar = 'a';
                          else if (currentChar === 'a') nextChar = 'o';
                          else nextChar = ' ';
                        } else if (instrument.key === 'sn') {
                          if (currentChar === ' ') nextChar = '.';
                          else if (currentChar === '.') nextChar = 'X';
                          else nextChar = ' ';
                        } else {
                          nextChar = currentChar === 'X' ? ' ' : 'X';
                        }
                        
                        updatePattern(instrument.key, index, nextChar);
                      }}
                    >
                      {pattern[index] === ' ' ? '·' : pattern[index]}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Vertical separator */}
            <div className="w-0.5 h-8 bg-yellow-400 mx-1 shadow-lg shadow-yellow-400/50"></div>
            
            {/* Group 4 (beats 13-16) */}
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, i) => {
                const index = i + 12;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                    <button
                      className={`w-6 h-6 md:w-8 md:h-8 border rounded-full text-xs font-bold transition-all duration-200 ${
                        pattern[index] === ' '
                          ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-400'
                          : 'border-green-400 bg-green-500 text-white shadow-lg shadow-green-500/30'
                      } focus:ring-2 focus:ring-white focus:outline-none`}
                      onClick={() => {
                        const currentChar = pattern[index];
                        let nextChar = ' ';
                        
                        if (instrument.key === 'ag') {
                          if (currentChar === ' ') nextChar = 'a';
                          else if (currentChar === 'a') nextChar = 'o';
                          else nextChar = ' ';
                        } else if (instrument.key === 'sn') {
                          if (currentChar === ' ') nextChar = '.';
                          else if (currentChar === '.') nextChar = 'X';
                          else nextChar = ' ';
                        } else {
                          nextChar = currentChar === 'X' ? ' ' : 'X';
                        }
                        
                        updatePattern(instrument.key, index, nextChar);
                      }}
                    >
                      {pattern[index] === ' ' ? '·' : pattern[index]}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Beat counter labels */}
          <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold mt-2">
            <div className="text-center" style={{ width: '100px' }}>1-2-3-4</div>
            <div className="w-0.5 mx-1"></div>
            <div className="text-center" style={{ width: '100px' }}>1-2-3-4</div>
            <div className="w-0.5 mx-1"></div>
            <div className="text-center" style={{ width: '100px' }}>1-2-3-4</div>
            <div className="w-0.5 mx-1"></div>
            <div className="text-center" style={{ width: '100px' }}>1-2-3-4</div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 text-center">
            {instrument.key === 'ag' ? 'Click: • → a → o → •' : 
             instrument.key === 'sn' ? 'Click: • → . → X → •' : 
             'Click: • → X → •'}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="street-text font-bold text-4xl md:text-5xl mb-4">Create Your Own</h1>
          <p className="text-xl text-gray-300">Experiment with patterns and create custom rhythms</p>
        </div>

        {/* Controls */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle>Beat Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="tune-name">Beat Name</Label>
                <Input
                  id="tune-name"
                  value={tuneName}
                  onChange={(e) => setTuneName(e.target.value)}
                  className="bg-black border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="tempo">Tempo: {tempo} BPM</Label>
                <Slider
                  id="tempo"
                  min={40}
                  max={200}
                  step={5}
                  value={[tempo]}
                  onValueChange={(value) => setTempo(value[0])}
                  className="mt-2"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Go to Player
                  </Button>
                  <Button 
                    onClick={downloadAsMP3}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={resetAll} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset All
                  </Button>
                  <Button 
                    onClick={() => setIsPinned(!isPinned)}
                    variant="outline"
                    className={isPinned ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  >
                    {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                    {isPinned ? "Unpin" : "Pin"} Player
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pattern Editors */}
        <div className="space-y-6 mb-8">
          {instruments.map((instrument) => (
            <PatternEditor key={instrument.key} instrument={instrument} />
          ))}
        </div>

        {/* Player */}
        <div className={isPinned ? "fixed bottom-0 left-0 right-0 z-50 shadow-2xl" : ""}>
          <Card className={`bg-gray-800 border-gray-700 ${isPinned ? "rounded-none border-t" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Test Your Beat
                </div>
                {isPinned && (
                  <Button 
                    onClick={() => setIsPinned(false)}
                    variant="outline"
                    size="sm"
                  >
                    <PinOff className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BeatboxPlayer 
                tune={experimentTune} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className={`bg-gray-800 border-gray-700 mt-8 ${isPinned ? "mb-32" : ""}`}>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-300">
              <p><strong>Pattern Grid:</strong> Each row represents an instrument, and each column represents a beat (1-16).</p>
              <p><strong>Clicking Boxes:</strong> Click on any box to cycle through available sounds for that instrument.</p>
              <p><strong>Symbols:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>X</strong> = Hit/Strike</li>
                <li><strong>.</strong> = Ghost note (soft hit - for snare)</li>
                <li><strong>a</strong> = Low bell (agogo)</li>
                <li><strong>o</strong> = High bell (agogo)</li>
                <li><strong>·</strong> = Silence</li>
              </ul>
              <p><strong>Tips:</strong> Start with simple patterns and build complexity. Try syncopated rhythms by offsetting different instruments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}