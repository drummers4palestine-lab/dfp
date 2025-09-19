import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TimeSignatureToolProps {}

export default function TimeSignatureTool({}: TimeSignatureToolProps) {
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBackgroundBeat, setCurrentBackgroundBeat] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartBeats, setDragStartBeats] = useState(4);
  const [metronomeVolume, setMetronomeVolume] = useState(0.3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  // Initialize AudioContext on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a beep sound
  const playBeep = useCallback((isAccent: boolean = false) => {
    const audioContext = initAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for accent vs normal beats
    oscillator.frequency.setValueAtTime(isAccent ? 800 : 400, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Volume and envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(isAccent ? 0.15 : 0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, [initAudioContext]);

  // Play metronome click (subtle background count)
  const playMetronomeClick = useCallback((beatNumber: number) => {
    if (metronomeVolume === 0) return;
    
    const audioContext = initAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different pitch for beat 1 vs others
    oscillator.frequency.value = beatNumber === 0 ? 1200 : 600;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(metronomeVolume * 0.15, audioContext.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  }, [initAudioContext, metronomeVolume]);

  // Start playing the pattern
  const startPlaying = useCallback(() => {
    if (intervalRef.current || backgroundIntervalRef.current) return;
    
    setIsPlaying(true);
    setCurrentBeat(0);
    setCurrentBackgroundBeat(0);
    
    // Play first beat immediately (accent)
    playBeep(true);
    
    let beatCount = 0;
    let backgroundBeatCount = 0;
    
    // Fixed bar duration (2 seconds) divided by beats per bar for tempo
    const beatInterval = 2000 / beatsPerBar; // Same time per bar regardless of beat count
    const backgroundInterval = 500; // Background always at 120 BPM (4/4)
    
    // Main pattern interval (variable speed)
    intervalRef.current = setInterval(() => {
      beatCount = (beatCount + 1) % beatsPerBar;
      setCurrentBeat(beatCount);
      
      // Beat 1 is accented, others are not
      playBeep(beatCount === 0);
    }, beatInterval);
    
    // Background 4/4 reference (constant speed)
    backgroundIntervalRef.current = setInterval(() => {
      backgroundBeatCount = (backgroundBeatCount + 1) % 4;
      setCurrentBackgroundBeat(backgroundBeatCount);
      
      // Play metronome click for background count
      playMetronomeClick(backgroundBeatCount);
    }, backgroundInterval);
  }, [beatsPerBar, playBeep, playMetronomeClick]);

  // Stop playing
  const stopPlaying = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
      backgroundIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentBackgroundBeat(0);
  }, []);

  // Reset to 4/4
  const reset = useCallback(() => {
    stopPlaying();
    setBeatsPerBar(4);
  }, [stopPlaying]);

  // Handle mouse/touch start on slider
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setIsDragging(true);
    setDragStartX(clientX);
    setDragStartBeats(beatsPerBar);
    stopPlaying(); // Stop playback when starting drag
  }, [beatsPerBar, stopPlaying]);

  // Handle drag (mouse and touch)
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    e.preventDefault(); // Prevent scrolling during drag
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartX;
    const sliderWidth = sliderRef.current.offsetWidth - 40; // Account for thumb width
    const deltaBeats = Math.round((deltaX / sliderWidth) * 9); // 9 = max - min
    
    const newBeats = Math.max(1, Math.min(10, dragStartBeats + deltaBeats));
    setBeatsPerBar(newBeats);
  }, [isDragging, dragStartX, dragStartBeats]);

  // Handle pointer up (mouse and touch)
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global pointer event listeners (mouse and touch)
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePointerMove as EventListener);
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove as EventListener, { passive: false });
      document.addEventListener('touchend', handlePointerUp);
      
      return () => {
        document.removeEventListener('mousemove', handlePointerMove as EventListener);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove as EventListener);
        document.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlaying();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopPlaying]);

  // Generate beat circles for visualization
  const beatCircles = Array.from({ length: beatsPerBar }, (_, i) => (
    <div
      key={i}
      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg transition-all duration-150 ${
        currentBeat === i && isPlaying
          ? i === 0 
            ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110' 
            : 'bg-green-500 shadow-lg shadow-green-500/50 scale-110'
          : i === 0
          ? 'bg-red-600/70'
          : 'bg-gray-600'
      }`}
    >
      {i + 1}
    </div>
  ));

  return (
    <Card className="bg-gray-800 border-gray-700 mt-8">
      <CardHeader>
        <CardTitle className="text-xl text-red-400">Interactive Time Signature Tool</CardTitle>
        <p className="text-gray-400 text-sm">Drag to adjust beats per bar (1-10) and hear different time signatures</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 overflow-x-hidden">
          
          {/* Slider Control */}
          <div className="space-y-4 w-full max-w-full">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>1 beat</span>
              <span className="text-white font-bold">{beatsPerBar}/4 Time Signature</span>
              <span>10 beats</span>
            </div>
            
            {/* Custom Slider */}
            <div 
              ref={sliderRef}
              className="relative h-8 bg-gray-700 rounded-full cursor-pointer touch-none"
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-green-600 rounded-full opacity-30"></div>
              <div 
                className={`absolute top-1 w-6 h-6 bg-red-500 rounded-full shadow-lg transition-all duration-150 ${
                  isDragging ? 'scale-110' : ''
                }`}
                style={{
                  left: `${((beatsPerBar - 1) / 9) * (100 - 6)}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              />
            </div>
          </div>

          {/* Beat Visualization */}
          <div className="bg-black p-6 rounded-lg border border-gray-600">
            {/* Background 4/4 Reference */}
            <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700">
              <p className="text-center text-gray-500 text-xs mb-3">Background 4/4 Reference (Constant Tempo)</p>
              <div className="flex justify-center items-center gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-100 ${
                      currentBackgroundBeat === i && isPlaying
                        ? 'bg-gray-500 text-white scale-105' 
                        : 'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main Pattern */}
            <div>
              <p className="text-center text-gray-400 text-sm mb-4">{beatsPerBar}/4 Time Signature</p>
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center items-center min-h-[60px] sm:min-h-[80px]">
                {beatCircles}
              </div>
              <div className="text-center mt-4 text-gray-400 text-sm">
                {isPlaying ? `Playing ${beatsPerBar} beats over 2 seconds` : `${beatsPerBar} beats per bar`}
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="bg-gray-800 p-4 rounded border border-gray-600">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-300 min-w-[120px]">Metronome Volume:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-400 min-w-[30px] text-right">
                {Math.round(metronomeVolume * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Background count to help hear how the time signatures fit together</p>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={isPlaying ? stopPlaying : startPlaying}
              className={`${
                isPlaying 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play 4 Bars
                </>
              )}
            </Button>
            
            <Button 
              onClick={reset}
              variant="outline" 
              className="border-gray-600 hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to 4/4
            </Button>
          </div>

          {/* Information */}
          <div className="text-center text-gray-400 text-sm">
            <p>Red circle = strong beat (1), others = weaker beats</p>
            <p>Higher pitch = beat 1, lower pitch = other beats</p>
            <p>Metronome clicks help you hear how the patterns line up</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}