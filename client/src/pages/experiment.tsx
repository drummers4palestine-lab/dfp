import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeatboxPlayer from "@/components/beatbox-player";
import { renderAuthenticAudio, useAudioEngine } from "@/lib/audio-engine";
import { RotateCcw, Download, Play, Pause } from "lucide-react";

export default function Experiment() {
  const [tuneName, setTuneName] = useState("My Custom Beat");
  const [tempo, setTempo] = useState(120);
  const [patternLength, setPatternLength] = useState(16);
  const [currentStep, setCurrentStep] = useState(0);
  const [instrumentStates, setInstrumentStates] = useState({
    ls: { enabled: true, volume: 80 },
    ms: { enabled: true, volume: 75 },
    hs: { enabled: true, volume: 70 },
    re: { enabled: true, volume: 85 },
    sn: { enabled: true, volume: 90 },
    ta: { enabled: true, volume: 75 },
    ag: { enabled: true, volume: 25 },
    sh: { enabled: true, volume: 60 }
  });
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

  // Audio engine for play functionality
  const { play, stop, isPlaying, isAudioLoaded } = useAudioEngine({
    tune: experimentTune,
    pattern: 'Custom',
    tempo: tempo,
    volume: 100,
    instrumentStates: instrumentStates,
    onStepChange: setCurrentStep
  });

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
          <div className="space-y-2">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-between overflow-x-auto px-2 sm:px-4">
                {row.map((beatIndex) => {
                  return (
                    <div key={beatIndex} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">{beatIndex + 1}</div>
                      <button
                        className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border rounded-full text-xs font-bold transition-all duration-200 ${
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
                  );
                })}
              </div>
            ))}
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
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="w-full max-w-none mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="street-text font-bold text-3xl sm:text-4xl md:text-5xl mb-4">Create Your Own Beat</h1>
          <p className="text-lg sm:text-xl text-gray-300">Design custom rhythms for Palestinian solidarity</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <Label htmlFor="tune-name" className="text-white mb-2">Beat Name</Label>
            <Input
              id="tune-name"
              value={tuneName}
              onChange={(e) => setTuneName(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter beat name"
            />
          </div>
          
          <div>
            <Label htmlFor="pattern-length" className="text-white mb-2">Pattern Length</Label>
            <Select value={patternLength.toString()} onValueChange={(value) => updatePatternLength(parseInt(value))}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 beats</SelectItem>
                <SelectItem value="16">16 beats</SelectItem>
                <SelectItem value="24">24 beats</SelectItem>
                <SelectItem value="32">32 beats</SelectItem>
                <SelectItem value="40">40 beats</SelectItem>
                <SelectItem value="48">48 beats</SelectItem>
                <SelectItem value="56">56 beats</SelectItem>
                <SelectItem value="64">64 beats</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="tempo" className="text-white mb-2">Tempo (BPM)</Label>
            <Input
              id="tempo"
              type="number"
              min="40"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Button 
            onClick={isPlaying ? stop : play}
            disabled={!isAudioLoaded}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600"
          >
            {!isAudioLoaded ? (
              <>Loading...</>
            ) : isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>
          
          <Button 
            onClick={resetAll}
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All
          </Button>
          
          <Button 
            onClick={downloadAsMP3}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Audio
          </Button>
        </div>

        {/* Pattern Editors */}
        <div className="space-y-6 mb-8">
          {instruments.map((instrument) => (
            <PatternEditor key={instrument.key} instrument={instrument} />
          ))}
        </div>

        {/* Beatbox Player */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6">
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-4 text-center">Play Your Beat</h2>
          <BeatboxPlayer tune={experimentTune} />
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="street-text text-xl font-bold mb-4">How to Use</h3>
          <div className="space-y-4 text-gray-300">
            <p><strong>Pattern Length:</strong> Choose how many beats your pattern should have (8, 16, 24, 32, 40, 48, 56, or 64).</p>
            <p><strong>Pattern Grid:</strong> Each row represents an instrument, and each column represents a beat. Click circles to toggle beats on/off.</p>
            <p><strong>Agogo:</strong> Has two sounds - 'a' for low bell and 'o' for high bell.</p>
            <p><strong>Snare:</strong> Has two sounds - '.' for ghost notes and 'X' for accent hits.</p>
            <p><strong>Other Instruments:</strong> Click to toggle between hit (X) and rest (•).</p>
            <p><strong>Download:</strong> Save your beat as an audio file to share with others.</p>
          </div>
        </div>
      </div>
    </div>
  );
}