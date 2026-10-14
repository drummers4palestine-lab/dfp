import { useState, useEffect, useRef, useCallback } from "react";
import type { Tune } from "@/data/tunes";

// Global audio cache to store loaded audio files across all tunes
const globalAudioCache = new Map<string, AudioBuffer>();
const loadingPromises = new Map<string, Promise<AudioBuffer | null>>();

interface AudioEngineOptions {
  tune: Tune;
  pattern: string;
  tempo: number;
  volume: number;
  instrumentStates: Record<string, { enabled: boolean; volume: number }>;
  onStepChange: (step: number) => void;
}

export function useAudioEngine({
  tune,
  pattern: patternName,
  tempo,
  volume,
  instrumentStates,
  onStepChange,
}: AudioEngineOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundsRef = useRef<Record<string, AudioBuffer>>({});
  const audioLoadedRef = useRef<boolean>(false);
  const currentStepRef = useRef<number>(0);



  // Function to determine which audio files a tune actually needs
  // Always include core samples for all instruments so dynamic pattern editing
  // (e.g. on the Experimental page) never falls back to synthetic sounds.
  const getRequiredAudioFiles = useCallback((tune: Tune) => {
    const requiredFiles = new Set<string>([
      // Core Surdos
      "ls_73",
      "ls_58",
      "ls_30",
      "ls_72",
      "ms_73",
      "ms_58",
      "ms_30",
      "ms_72",
      "hs_74",
      "hs_73",
      "hs_58",
      "hs_30",
      "hs_72",
      // Core Repinique strokes
      "re_58",
      "re_2e",
      "re_66",
      "re_68",
      "re_72",
      "re_73",
      "re_7a",
      // Core Snare strokes (Accent, Ghost/Tap, Flam, Rim)
      "sn_58",
      "sn_2e",
      "sn_66",
      "sn_72",
      // Core Tamborim, Agogo, Shaker
      "ta_58",
      "ta_66",
      "ta_72",
      "ag_61",
      "ag_6f",
      "ag_2e",
      "ag_72",
      "sh_58",
      "sh_2e",
      "ot_77",
    ]);

    return Array.from(requiredFiles);
  }, []);

  // Cached audio file loader with global cache
  const loadAudioFile = useCallback(
    async (url: string, filename: string): Promise<AudioBuffer | null> => {
      // Check if already in cache
      if (globalAudioCache.has(filename)) {
        return globalAudioCache.get(filename)!;
      }

      // Check if already loading
      if (loadingPromises.has(filename)) {
        return await loadingPromises.get(filename)!;
      }

      // Start loading
      const loadPromise = (async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            throw new Error("Empty audio file");
          }
          const buffer =
            await audioContextRef.current!.decodeAudioData(arrayBuffer);
          globalAudioCache.set(filename, buffer);
          return buffer;
        } catch (error) {
          console.warn(`Failed to load audio file: ${url}`, error);
          return null;
        } finally {
          loadingPromises.delete(filename);
        }
      })();

      loadingPromises.set(filename, loadPromise);
      return await loadPromise;
    },
    [],
  );

  // Load only the audio samples needed for this specific tune
  const loadAudioSamples = useCallback(async () => {
    if (!audioContextRef.current) return;

    const requiredFiles = getRequiredAudioFiles(tune);
    console.log(
      `Loading ${requiredFiles.length} audio files for ${tune.name}:`,
      requiredFiles,
    );

    // Get the base URL for direct audio access
    const getAudioBaseUrl = () => {
      if (typeof window !== "undefined") {
        // In production, use the deployment URL directly
        if (window.location.hostname.includes("replit.app")) {
          return window.location.origin + "/audio/";
        }
        // In development, use the local URL
        return window.location.origin + "/audio/";
      }
      return "/audio/";
    };

    const audioBaseUrl = getAudioBaseUrl();

    // Audio files mapping - using direct URLs for faster loading
    const audioFiles = {
      // Low Surdo variants
      ls_30: audioBaseUrl + "ls_30.mp3",
      ls_58: audioBaseUrl + "ls_58.mp3",
      ls_68: audioBaseUrl + "ls_68.mp3",
      ls_72: audioBaseUrl + "ls_72.mp3",
      ls_73: audioBaseUrl + "ls_73.mp3",
      ls_74: audioBaseUrl + "ls_74.mp3",
      // Mid Surdo variants
      ms_30: audioBaseUrl + "ms_30.mp3",
      ms_58: audioBaseUrl + "ms_58.mp3",
      ms_68: audioBaseUrl + "ms_68.mp3",
      ms_72: audioBaseUrl + "ms_72.mp3",
      ms_73: audioBaseUrl + "ms_73.mp3",
      ms_74: audioBaseUrl + "ms_74.mp3",
      // High Surdo variants
      hs_30: audioBaseUrl + "hs_30.mp3",
      hs_58: audioBaseUrl + "hs_58.mp3",
      hs_68: audioBaseUrl + "hs_68.mp3",
      hs_72: audioBaseUrl + "hs_72.mp3",
      hs_73: audioBaseUrl + "hs_73.mp3",
      hs_74: audioBaseUrl + "hs_74.mp3",
      // Snare variants
      sn_2e: audioBaseUrl + "sn_2e.mp3", // Ghost note
      sn_58: audioBaseUrl + "sn_58.mp3", // Accent
      sn_66: audioBaseUrl + "sn_66.mp3",
      sn_72: audioBaseUrl + "sn_72.mp3",
      // Repi variants
      re_2e: audioBaseUrl + "re_2e.mp3",
      re_58: audioBaseUrl + "re_58.mp3",
      re_66: audioBaseUrl + "re_66.mp3",
      re_68: audioBaseUrl + "re_68.mp3",
      re_72: audioBaseUrl + "re_72.mp3",
      re_73: audioBaseUrl + "re_73.mp3",
      re_7a: audioBaseUrl + "re_7a.mp3",
      // Agogo variants
      ag_2e: audioBaseUrl + "ag_2e.mp3",
      ag_61: audioBaseUrl + "ag_61.mp3", // Low bell
      ag_6f: audioBaseUrl + "ag_6f.mp3", // High bell
      ag_72: audioBaseUrl + "ag_72.mp3",
      // Tamborim variants
      ta_58: audioBaseUrl + "ta_58.mp3",
      ta_66: audioBaseUrl + "ta_66.mp3",
      ta_72: audioBaseUrl + "ta_72.mp3",
      // Shaker variants
      sh_2e: audioBaseUrl + "sh_2e.mp3",
      sh_58: audioBaseUrl + "sh_58.mp3",
      // Other percussion
      ot_32: audioBaseUrl + "ot_32.mp3",
      ot_33: audioBaseUrl + "ot_33.mp3",
      ot_34: audioBaseUrl + "ot_34.mp3",
      ot_35: audioBaseUrl + "ot_35.mp3",
      ot_36: audioBaseUrl + "ot_36.mp3",
      ot_41: audioBaseUrl + "ot_41.mp3",
      ot_42: audioBaseUrl + "ot_42.mp3",
      ot_43: audioBaseUrl + "ot_43.mp3",
      ot_44: audioBaseUrl + "ot_44.mp3",
      ot_45: audioBaseUrl + "ot_45.mp3",
      ot_46: audioBaseUrl + "ot_46.mp3",
      ot_47: audioBaseUrl + "ot_47.mp3",
      ot_48: audioBaseUrl + "ot_48.mp3",
      ot_49: audioBaseUrl + "ot_49.mp3",
      ot_4a: audioBaseUrl + "ot_4a.mp3",
      ot_4b: audioBaseUrl + "ot_4b.mp3",
      ot_77: audioBaseUrl + "ot_77.mp3",
      ot_79: audioBaseUrl + "ot_79.mp3",
    };

    const audioBuffers: Record<string, AudioBuffer | null> = {};

    // Load only the required audio files for this tune
    for (const filename of requiredFiles) {
      if (audioFiles[filename as keyof typeof audioFiles]) {
        audioBuffers[filename] = await loadAudioFile(
          audioFiles[filename as keyof typeof audioFiles],
          filename,
        );
      }
    }

    // Map to instruments using best available sounds with fallback to synthetic
    const getFallbackSound = (
      audioBuffer: AudioBuffer | null,
      freq: number,
      dur: number,
      type: "kick" | "snare" | "hihat" | "bell",
    ): AudioBuffer => {
      return audioBuffer || createFallbackSound(freq, dur, type)!;
    };

    soundsRef.current = {
      // Low Surdo - prefer ls_73 or ls_74 for main sound
      ls: getFallbackSound(
        audioBuffers.ls_73 || audioBuffers.ls_74,
        100,
        0.5,
        "kick",
      ),
      // Mid Surdo - prefer ms_73 or ms_74
      ms: getFallbackSound(
        audioBuffers.ms_73 || audioBuffers.ms_74,
        80,
        0.4,
        "kick",
      ),
      // High Surdo - prefer hs_74 or hs_73
      hs: getFallbackSound(
        audioBuffers.hs_74 || audioBuffers.hs_73,
        100,
        0.3,
        "kick",
      ),
      // Repi - prefer re_58
      re: getFallbackSound(audioBuffers.re_58, 200, 0.2, "snare"),
      // Snare - prefer sn_58 for general use
      sn: getFallbackSound(audioBuffers.sn_58, 150, 0.2, "snare"),
      // Tamborim - use ta_58 if available
      ta: getFallbackSound(audioBuffers.ta_58, 300, 0.1, "hihat"),
      // Agogo - use ag_61 for general use
      ag: getFallbackSound(audioBuffers.ag_61, 800, 0.3, "bell"),
      // Shaker - use sh_58 if available
      sh: getFallbackSound(audioBuffers.sh_58, 5000, 0.1, "hihat"),
      // Other percussion - use ot_42 as default
      ot: getFallbackSound(audioBuffers.ot_42, 400, 0.2, "bell"),
    };

    // Store individual agogo sounds for pattern-specific playback
    soundsRef.current.ag_low = audioBuffers.ag_61 || soundsRef.current.ag; // 'a' character
    soundsRef.current.ag_high = audioBuffers.ag_6f || soundsRef.current.ag; // 'o' character
    soundsRef.current.ag_ghost = audioBuffers.ag_2e || soundsRef.current.ag; // '.' character
    soundsRef.current.ag_rim = audioBuffers.ag_72 || soundsRef.current.ag; // 'r' character

    // Store individual snare sounds for pattern-specific playback
    soundsRef.current.sn_accent = audioBuffers.sn_58 || soundsRef.current.sn; // 'X' character
    soundsRef.current.sn_ghost = audioBuffers.sn_2e || soundsRef.current.sn; // '.' character
    soundsRef.current.sn_flam = audioBuffers.sn_66 || soundsRef.current.sn; // 'f' character
    soundsRef.current.sn_rim = audioBuffers.sn_72 || soundsRef.current.sn; // 'r' character

    // Store individual repi sounds for pattern-specific playback
    soundsRef.current.re_accent = audioBuffers.re_58 || soundsRef.current.re; // 'X' character
    soundsRef.current.re_ghost = audioBuffers.re_2e || soundsRef.current.re; // '.' character
    soundsRef.current.re_flam = audioBuffers.re_66 || soundsRef.current.re; // 'f' character
    soundsRef.current.re_hand = audioBuffers.re_68 || soundsRef.current.re; // 'h' character
    soundsRef.current.re_rim = audioBuffers.re_72 || soundsRef.current.re; // 'r' character
    soundsRef.current.re_slap = audioBuffers.re_73 || soundsRef.current.re; // 's' character
    soundsRef.current.re_buzz = audioBuffers.re_7a || soundsRef.current.re; // 'z' character

    // Store individual tamborim and shaker sounds
    soundsRef.current.ta_accent = audioBuffers.ta_58 || soundsRef.current.ta; // 'X' character
    soundsRef.current.ta_flam = audioBuffers.ta_66 || soundsRef.current.ta; // 'f' character
    soundsRef.current.ta_rim = audioBuffers.ta_72 || soundsRef.current.ta; // 'r' character
    soundsRef.current.sh_accent = audioBuffers.sh_58 || soundsRef.current.sh; // 'X' character
    soundsRef.current.sh_ghost = audioBuffers.sh_2e || soundsRef.current.sh; // '.' character

    // Store additional surdo variations if available
    soundsRef.current.ls_open = audioBuffers.ls_30 || soundsRef.current.ls; // '0' damp sound
    soundsRef.current.ls_muted = audioBuffers.ls_58 || soundsRef.current.ls; // 'X' hit sound
    soundsRef.current.ls_rim = audioBuffers.ls_72 || soundsRef.current.ls; // 'r' rim sound
    soundsRef.current.ls_slap = audioBuffers.ls_73 || soundsRef.current.ls; // 's' slap sound
    soundsRef.current.ms_open = audioBuffers.ms_30 || soundsRef.current.ms; // '0' damp sound
    soundsRef.current.ms_muted = audioBuffers.ms_58 || soundsRef.current.ms; // 'X' hit sound
    soundsRef.current.ms_rim = audioBuffers.ms_72 || soundsRef.current.ms; // 'r' rim sound
    soundsRef.current.ms_slap = audioBuffers.ms_73 || soundsRef.current.ms; // 's' slap sound
    soundsRef.current.hs_open = audioBuffers.hs_30 || soundsRef.current.hs; // '0' damp sound
    soundsRef.current.hs_muted = audioBuffers.hs_58 || soundsRef.current.hs; // 'X' hit sound
    soundsRef.current.hs_rim = audioBuffers.hs_72 || soundsRef.current.hs; // 'r' rim sound
    soundsRef.current.hs_slap = audioBuffers.hs_73 || soundsRef.current.hs; // 's' slap sound
  }, [getRequiredAudioFiles, loadAudioFile]);

  // Initialize audio context and preload samples (only on user interaction)
  const initializeAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        // Create AudioContext only in response to user interaction
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        
        console.log('AudioContext created:', audioContextRef.current.state);
      }

      // Always try to resume AudioContext on user interaction
      if (audioContextRef.current.state === "suspended") {
        console.log('Resuming suspended AudioContext...');
        await audioContextRef.current.resume();
        console.log('AudioContext resumed:', audioContextRef.current.state);
      }

      // Only load audio if not already loaded or if context was suspended
      if (!audioLoadedRef.current || audioContextRef.current.state !== "running") {
        console.log('Loading audio samples...');
        setIsAudioLoaded(false);
        await loadAudioSamples();
        audioLoadedRef.current = true;
        setIsAudioLoaded(true);
        console.log('Audio samples loaded successfully');
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setIsAudioLoaded(false);
      audioLoadedRef.current = false;
      throw error;
    }
  }, [loadAudioSamples]);

  // Fallback synthetic sound creation
  const createFallbackSound = (
    frequency: number,
    duration: number,
    type: "kick" | "snare" | "hihat" | "bell",
  ) => {
    if (!audioContextRef.current) return null;

    const sampleRate = audioContextRef.current.sampleRate;
    const buffer = audioContextRef.current.createBuffer(
      1,
      duration * sampleRate,
      sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      let value = 0;

      switch (type) {
        case "kick":
          value =
            Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 30) * 0.5;
          break;
        case "snare":
          value = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.3;
          break;
        case "hihat":
          value = (Math.random() * 2 - 1) * Math.exp(-t * 100) * 0.2;
          break;
        case "bell":
          value =
            Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5) * 0.3;
          break;
      }

      data[i] = value;
    }
    return buffer;
  };

  // Play a sound with specific character handling and dynamic accent/tap scaling
  const playSound = useCallback(
    (instrument: string, char?: string) => {
      if (!audioContextRef.current) return;

      let soundBuffer: AudioBuffer | undefined;
      let strokeGainMultiplier = 1.0;

      // Handle agogo-specific character mappings
      if (instrument === "ag" && char) {
        if (char === "a" && soundsRef.current.ag_low) {
          soundBuffer = soundsRef.current.ag_low;
        } else if (char === "o" && soundsRef.current.ag_high) {
          soundBuffer = soundsRef.current.ag_high;
        } else if (char === "." && soundsRef.current.ag_ghost) {
          soundBuffer = soundsRef.current.ag_ghost;
          strokeGainMultiplier = 0.4;
        } else if (char === "r" && soundsRef.current.ag_rim) {
          soundBuffer = soundsRef.current.ag_rim;
        } else {
          soundBuffer = soundsRef.current[instrument];
        }
      }
      // Handle snare-specific character mappings (strong dynamic contrast between '.' tap and 'X' accent)
      else if (instrument === "sn" && char) {
        if (char === "X" && soundsRef.current.sn_accent) {
          soundBuffer = soundsRef.current.sn_accent;
          strokeGainMultiplier = 1.85; // Boost sn_58 (-23.4dB) so accents crack clearly above taps
        } else if (char === "." && soundsRef.current.sn_ghost) {
          soundBuffer = soundsRef.current.sn_ghost;
          strokeGainMultiplier = 0.32; // Ghost note tap at ~30% volume
        } else if (char === "f" && soundsRef.current.sn_flam) {
          soundBuffer = soundsRef.current.sn_flam;
          strokeGainMultiplier = 1.25;
        } else if (char === "r" && soundsRef.current.sn_rim) {
          soundBuffer = soundsRef.current.sn_rim;
          strokeGainMultiplier = 1.45;
        } else {
          soundBuffer = soundsRef.current[instrument];
        }
      }
      // Handle repi-specific character mappings
      else if (instrument === "re" && char) {
        if (char === "X" && soundsRef.current.re_accent) {
          soundBuffer = soundsRef.current.re_accent;
          strokeGainMultiplier = 1.15;
        } else if (char === "." && soundsRef.current.re_ghost) {
          soundBuffer = soundsRef.current.re_ghost;
          strokeGainMultiplier = 0.45;
        } else if (char === "f" && soundsRef.current.re_flam) {
          soundBuffer = soundsRef.current.re_flam;
          strokeGainMultiplier = 1.2;
        } else if (char === "h" && soundsRef.current.re_hand) {
          soundBuffer = soundsRef.current.re_hand;
          strokeGainMultiplier = 0.95;
        } else if (char === "r" && soundsRef.current.re_rim) {
          soundBuffer = soundsRef.current.re_rim;
          strokeGainMultiplier = 1.2;
        } else if (char === "s" && soundsRef.current.re_slap) {
          soundBuffer = soundsRef.current.re_slap;
          strokeGainMultiplier = 1.1;
        } else if (char === "z" && soundsRef.current.re_buzz) {
          soundBuffer = soundsRef.current.re_buzz;
          strokeGainMultiplier = 1.1;
        } else {
          soundBuffer = soundsRef.current[instrument];
        }
      }
      // Handle tamborim character mappings
      else if (instrument === "ta" && char) {
        if (char === "f" && soundsRef.current.ta_flam) {
          soundBuffer = soundsRef.current.ta_flam;
          strokeGainMultiplier = 1.2;
        } else if (char === "r" && soundsRef.current.ta_rim) {
          soundBuffer = soundsRef.current.ta_rim;
          strokeGainMultiplier = 1.2;
        } else {
          soundBuffer = soundsRef.current.ta_accent || soundsRef.current[instrument];
        }
      }
      // Handle shaker character mappings
      else if (instrument === "sh" && char) {
        if (char === "X" && soundsRef.current.sh_accent) {
          soundBuffer = soundsRef.current.sh_accent;
          strokeGainMultiplier = 1.15;
        } else if (char === "." && soundsRef.current.sh_ghost) {
          soundBuffer = soundsRef.current.sh_ghost;
          strokeGainMultiplier = 0.55;
        } else {
          soundBuffer = soundsRef.current[instrument];
        }
      } else {
        soundBuffer = soundsRef.current[instrument];
      }

      if (!soundBuffer) return;

      const baseGain =
        (volume / 100) * ((instrumentStates[instrument]?.volume || 70) / 100);

      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();

      source.buffer = soundBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      gainNode.gain.value = baseGain * strokeGainMultiplier;

      source.start();

      // For Snare accent ('X'), layer a subtle rim transient (sn_72) so the attack
      // cuts cleanly and unmistakably above ghost taps ('.')
      if (
        instrument === "sn" &&
        char === "X" &&
        soundsRef.current.sn_rim &&
        soundsRef.current.sn_rim !== soundBuffer
      ) {
        const transientSource = audioContextRef.current.createBufferSource();
        const transientGain = audioContextRef.current.createGain();
        transientSource.buffer = soundsRef.current.sn_rim;
        transientSource.connect(transientGain);
        transientGain.connect(audioContextRef.current.destination);
        transientGain.gain.value = baseGain * 0.45;
        transientSource.start();
      }
    },
    [volume, instrumentStates],
  );

  // Main playback loop - store latest callback in a ref so editing patterns
  // while playing does not reset the setInterval timer
  const playPattern = useCallback(() => {
    const pattern = tune.patterns[patternName];
    if (!pattern) return;

    const resolvePatternStr = (inst: string): string | undefined => {
      let val = pattern[inst];
      let guard = 0;
      while (typeof val === "string" && val.startsWith("@") && guard < 5) {
        val = pattern[val.slice(1)];
        guard++;
      }
      return typeof val === "string" ? val : undefined;
    };

    const lengths = Object.keys(instrumentStates)
      .map((inst) => resolvePatternStr(inst)?.length || 0)
      .filter((len) => len > 0);
    const patternLength = lengths.length > 0 ? Math.max(...lengths) : 16;

    const step = currentStepRef.current % patternLength;

    // Play sounds for current step
    Object.keys(instrumentStates).forEach((instrument) => {
      const instPattern = resolvePatternStr(instrument);
      if (instrumentStates[instrument].enabled && instPattern) {
        const char = instPattern[step];
        if (char && char !== " ") {
          playSound(instrument, char);
        }
      }
    });

    // Update step
    const nextStep = (step + 1) % patternLength;
    currentStepRef.current = nextStep;
    onStepChange(nextStep);
  }, [
    tune,
    patternName,
    instrumentStates,
    playSound,
    onStepChange,
  ]);

  const playPatternRef = useRef(playPattern);
  useEffect(() => {
    playPatternRef.current = playPattern;
  }, [playPattern]);

  // Start playback
  const play = useCallback(async () => {
    try {
      console.log('Play button clicked - initializing audio...');
      await initializeAudio();
      console.log('Audio initialized, isAudioLoaded:', isAudioLoaded);
      // Start playing after successful initialization
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start playback:', error);
      setIsAudioLoaded(false);
      // Show user-friendly error message
      alert('Unable to play audio. Please try again or check your browser settings.');
    }
  }, [initializeAudio, isAudioLoaded]);

  // Pause playback
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Stop playback
  const stop = useCallback(() => {
    setIsPlaying(false);
    currentStepRef.current = 0;
    onStepChange(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [onStepChange]);

  // Handle tempo changes and playback timing without resetting interval on pattern edits
  const stepSubdivision = tune?.stepSubdivision || 4;
  useEffect(() => {
    if (isPlaying) {
      const stepInterval = ((60 / tempo) * 1000) / stepSubdivision;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        playPatternRef.current();
      }, stepInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPlaying, tempo, stepSubdivision]);

  // Reset step when pattern changes
  useEffect(() => {
    currentStepRef.current = 0;
    onStepChange(0);
  }, [patternName, onStepChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentStep: currentStepRef.current,
    isAudioLoaded,
    play,
    pause,
    stop,
  };
}

// Export function to render authentic audio for download
export async function renderAuthenticAudio(
  tune: any,
  patternName: string,
  tempo: number,
  instrumentStates: Record<string, { enabled: boolean; volume: number }>,
  durationSeconds: number = 8,
): Promise<AudioBuffer> {
  // Create audio context for rendering
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  // Load the same audio samples as the player
  const loadAudioFile = async (url: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) return null;
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      return null;
    }
  };

  // Get the base URL for direct audio access
  const getAudioBaseUrl = () => {
    if (typeof window !== "undefined") {
      // In production, use the deployment URL directly
      if (window.location.hostname.includes("replit.app")) {
        return window.location.origin + "/audio/";
      }
      // In development, use the local URL
      return window.location.origin + "/audio/";
    }
    return "/audio/";
  };

  const audioBaseUrl = getAudioBaseUrl();

  // Same audio files mapping as in the player - using direct URLs for faster loading
  const audioFiles = {
    ls_73: audioBaseUrl + "ls_73.mp3",
    ms_73: audioBaseUrl + "ms_73.mp3",
    hs_74: audioBaseUrl + "hs_74.mp3",
    sn_2e: audioBaseUrl + "sn_2e.mp3", // Ghost note
    sn_58: audioBaseUrl + "sn_58.mp3", // Accent
    sn_66: audioBaseUrl + "sn_66.mp3", // Flam
    sn_72: audioBaseUrl + "sn_72.mp3", // Rim
    re_58: audioBaseUrl + "re_58.mp3",
    re_2e: audioBaseUrl + "re_2e.mp3",
    re_66: audioBaseUrl + "re_66.mp3",
    re_68: audioBaseUrl + "re_68.mp3",
    re_72: audioBaseUrl + "re_72.mp3",
    re_73: audioBaseUrl + "re_73.mp3",
    re_7a: audioBaseUrl + "re_7a.mp3",
    ag_61: audioBaseUrl + "ag_61.mp3", // Low bell
    ag_6f: audioBaseUrl + "ag_6f.mp3", // High bell
    ta_58: audioBaseUrl + "ta_58.mp3",
    sh_58: audioBaseUrl + "sh_58.mp3",
    sh_2e: audioBaseUrl + "sh_2e.mp3",
  };

  // Load all audio samples
  const audioBuffers: Record<string, AudioBuffer | null> = {};
  for (const [key, url] of Object.entries(audioFiles)) {
    audioBuffers[key] = await loadAudioFile(url);
  }

  // Map to instruments
  const sounds: Record<string, AudioBuffer | null> = {
    ls: audioBuffers.ls_73,
    ms: audioBuffers.ms_73 || audioBuffers.ls_73,
    hs: audioBuffers.hs_74,
    re: audioBuffers.re_58,
    re_ghost: audioBuffers.re_2e,
    re_flam: audioBuffers.re_66,
    re_hand: audioBuffers.re_68,
    re_rim: audioBuffers.re_72,
    re_slap: audioBuffers.re_73,
    re_buzz: audioBuffers.re_7a,
    sn: audioBuffers.sn_58,
    sn_accent: audioBuffers.sn_58,
    sn_ghost: audioBuffers.sn_2e,
    sn_flam: audioBuffers.sn_66,
    sn_rim: audioBuffers.sn_72,
    ta: audioBuffers.ta_58,
    ag: audioBuffers.ag_61,
    ag_low: audioBuffers.ag_61,
    ag_high: audioBuffers.ag_6f,
    sh: audioBuffers.sh_58 || audioBuffers.sh_2e,
    sh_ghost: audioBuffers.sh_2e,
  };

  // Create offline context for rendering
  const offlineContext = new OfflineAudioContext(
    1,
    audioContext.sampleRate * durationSeconds,
    audioContext.sampleRate,
  );

  const pattern = tune.patterns[patternName];
  if (!pattern) {
    audioContext.close();
    throw new Error("Pattern not found");
  }

  const stepSubdivision = tune?.stepSubdivision || 4;
  const stepDuration = 60 / tempo / stepSubdivision;
  const patternLength = pattern.ls ? pattern.ls.length : 16;

  // Render the pattern
  for (
    let loop = 0;
    loop < Math.floor(durationSeconds / (stepDuration * patternLength));
    loop++
  ) {
    for (let step = 0; step < patternLength; step++) {
      const time = (loop * patternLength + step) * stepDuration;

      // Check each instrument at this step
      Object.keys(instrumentStates).forEach((instrument) => {
        if (!instrumentStates[instrument].enabled) return;

        const instrumentPattern = pattern[instrument];
        if (!instrumentPattern || step >= instrumentPattern.length) return;

        const char = instrumentPattern[step];
        if (!char || char === " ") return;

        // Get the appropriate sound buffer
        let soundBuffer: AudioBuffer | null = null;
        let strokeGainMultiplier = 1.0;

        if (instrument === "ag") {
          if (char === "a") soundBuffer = sounds.ag_low;
          else if (char === "o") soundBuffer = sounds.ag_high;
          else soundBuffer = sounds.ag;
        } else if (instrument === "sn") {
          if (char === "X") {
            soundBuffer = sounds.sn_accent;
            strokeGainMultiplier = 1.85;
          } else if (char === ".") {
            soundBuffer = sounds.sn_ghost;
            strokeGainMultiplier = 0.32;
          } else if (char === "f") {
            soundBuffer = sounds.sn_flam;
            strokeGainMultiplier = 1.25;
          } else if (char === "r") {
            soundBuffer = sounds.sn_rim;
            strokeGainMultiplier = 1.45;
          } else {
            soundBuffer = sounds.sn;
          }
        } else if (instrument === "re") {
          if (char === ".") {
            soundBuffer = sounds.re_ghost;
            strokeGainMultiplier = 0.45;
          } else if (char === "f") {
            soundBuffer = sounds.re_flam;
            strokeGainMultiplier = 1.2;
          } else if (char === "h") {
            soundBuffer = sounds.re_hand;
            strokeGainMultiplier = 0.95;
          } else if (char === "r") {
            soundBuffer = sounds.re_rim;
            strokeGainMultiplier = 1.2;
          } else if (char === "s") {
            soundBuffer = sounds.re_slap;
            strokeGainMultiplier = 1.1;
          } else if (char === "z") {
            soundBuffer = sounds.re_buzz;
            strokeGainMultiplier = 1.1;
          } else {
            soundBuffer = sounds.re;
            strokeGainMultiplier = 1.15;
          }
        } else if (instrument === "sh") {
          if (char === ".") {
            soundBuffer = sounds.sh_ghost;
            strokeGainMultiplier = 0.55;
          } else {
            soundBuffer = sounds.sh;
          }
        } else {
          soundBuffer = sounds[instrument];
        }

        if (!soundBuffer) return;

        // Create audio source
        const source = offlineContext.createBufferSource();
        const gainNode = offlineContext.createGain();

        source.buffer = soundBuffer;
        source.connect(gainNode);
        gainNode.connect(offlineContext.destination);

        // Apply volume
        const instrumentVolume = instrumentStates[instrument]?.volume || 70;
        gainNode.gain.value =
          (instrumentVolume / 100) * 0.7 * strokeGainMultiplier;

        source.start(time);
      });
    }
  }

  // Render and return the buffer
  const renderedBuffer = await offlineContext.startRendering();
  audioContext.close();
  return renderedBuffer;
}
