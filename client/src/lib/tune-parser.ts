export interface TunePattern {
  loop?: boolean;
  upbeat?: number;
  ls?: string;
  ms?: string;
  hs?: string;
  re?: string;
  sn?: string;
  ta?: string;
  ag?: string;
  sh?: string;
  ot?: string;
  mnemonics?: Record<string, string>;
  volumeHack?: Record<string, number> | Record<string, Record<number, number>>;
}

export interface ParsedTune {
  name: string;
  displayName?: string;
  categories?: string[];
  speed?: number;
  time?: number;
  description?: string;
  video?: string;
  patterns: Record<string, TunePattern>;
  exampleSong?: Array<string | { tuneName?: string; patternName: string; length?: number }>;
}

export function expandPattern(pattern: string, referencePatterns: Record<string, string>): string {
  // Handle @ references
  if (pattern.startsWith('@')) {
    const refKey = pattern.substring(1);
    return referencePatterns[refKey] || pattern;
  }
  
  return pattern;
}

export function processVolumeHack(volumeHack: any): Record<number, number> {
  if (typeof volumeHack === 'object' && volumeHack !== null) {
    const result: Record<number, number> = {};
    Object.entries(volumeHack).forEach(([key, value]) => {
      const step = parseInt(key);
      if (!isNaN(step) && typeof value === 'number') {
        result[step] = value;
      }
    });
    return result;
  }
  return {};
}

export function parsePatternNotation(pattern: string): Array<{ hit: boolean; accent?: boolean; ghost?: boolean }> {
  return pattern.split('').map(char => {
    switch (char) {
      case 'X':
        return { hit: true };
      case 'x':
        return { hit: true, accent: true };
      case 'f':
      case 'h':
      case 'r':
      case 's':
      case 'z':
        return { hit: true };
      case 'o':
      case 'a':
        return { hit: true };
      case '0':
        return { hit: true, ghost: true };
      case '.':
      case ' ':
      default:
        return { hit: false };
    }
  });
}

export function getPatternLength(pattern: TunePattern): number {
  const instruments = ['ls', 'ms', 'hs', 're', 'sn', 'ta', 'ag', 'sh'];
  const lengths = instruments
    .map(inst => pattern[inst as keyof TunePattern])
    .filter(p => typeof p === 'string')
    .map(p => p.length);
  
  return Math.max(...lengths, 16);
}
