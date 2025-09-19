export interface ProtestBeat {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tempo: number;
  imageUrl: string;
}

export const protestBeats: ProtestBeat[] = [
  {
    id: "level-1",
    name: "Level 1",
    description: "Single beat every count",
    fullDescription:
      "Basic foundation rhythm - single beat every count. Perfect for beginners and building unified rhythm.",
    pattern: "X               ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "level-2",
    name: "Level 2",
    description: "Double beat on counts 1 and 3",
    fullDescription:
      "Double beat on counts 1 and 3. Builds foundation for more complex patterns.",
    pattern: "X       X       ",
    difficulty: "Easy",
    tempo: 40,
    imageUrl: "",
  },
  {
    id: "level-3",
    name: "Level 3",
    description: "Solid beats on counts 1-3 with tri-beat on count 4",
    fullDescription:
      "Solid beats on counts 1-3 with a tri-beat on count 4. Creates powerful momentum.",
    pattern: "X   X   X XXX   ",
    difficulty: "Medium",
    tempo: 110,
    imageUrl: "",
  },
  {
    id: "level-4",
    name: "Level 4",
    description: "Continuous hi-hat pulse on every count",
    fullDescription:
      "Continuous hi-hat pulse on every count. Maximum energy and drive.",
    pattern: "XXXXXXXXXXXXXXXXX   X   X XXX   ",
    difficulty: "Medium",
    tempo: 130,
    imageUrl: "",
  },
  {
    id: "level-5",
    name: "Level 5",
    description: "Continuous hi-hat pulse on every count",
    fullDescription:
      "Continuous hi-hat pulse on every count. Maximum energy and drive.",
    pattern: "X   XX  X  X   XX  X  X  ",
    difficulty: "Medium",
    tempo: 110,
    imageUrl: "",
  },
  {
    id: "single-beat",
    name: "Single Beat",
    description: "A steady hit every count",
    fullDescription:
      "Basic steady rhythm - one hit per count. Foundation for all other patterns.",
    pattern: "X               ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "double-beat",
    name: "Double Beat",
    description: "Hits only on counts 1 and 3",
    fullDescription:
      "Emphasis on beats 1 and 3 only. Strong foundation pattern.",
    pattern: "X       X       ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "quadruple-beat",
    name: "Quadruple Beat",
    description: "Hits on all 4 counts",
    fullDescription:
      "Emphasis on beats 1 and 3 only. Strong foundation pattern.",
    pattern: "X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "8-beat",
    name: "8 Beat",
    description: "8 hits in a 16-step measure (every 2 steps)",
    fullDescription:
      "8 evenly spaced hits across 16 steps. Maintains steady energy and easy for crowds to follow.",
    pattern: "X X X X X X X X ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "clave",
    name: "Clave",
    description: "Classic pattern: 'Shut the sys-tem down'",
    fullDescription:
      "Traditional clave rhythm: 'Shut the sys-tem down.' Powerful and iconic protest beat.",
    pattern: "X  X  X   X X   ",
    difficulty: "Easy",
    tempo: 130,
    imageUrl: "",
  },
  {
    id: "gaza-level1",
    name: "Gaza - Level 1",
    description: "Gaza beat",
    fullDescription:
      "Gaza solidarity Level 1 - basic beat that everyone can play together.",
    pattern: "X  X  X X       ",
    difficulty: "Easy",
    tempo: 110,
    imageUrl: "",
  },
  {
    id: "end-occupation",
    name: "End The Occupation",
    description: "Same as Level 5, often used at demos",
    fullDescription:
      "Powerful rhythm demanding end to occupation. Everyone plays together for maximum impact.",
    pattern: "X   XX  X  X   XX  X  X  ",
    difficulty: "Medium",
    tempo: 110,
    imageUrl: "",
  },
  {
    id: "we-are-people-level1",
    name: "We Are The People - Level 1",
    description: "Surdos only",
    fullDescription:
      "Foundation rhythm for 'We Are The People' - surdos establish the base rhythm.",
    pattern: "X X     X X     X X     XX X X X",
    difficulty: "Easy",
    tempo: 50,
    imageUrl: "",
  },
  {
    id: "tri-hit",
    name: "1 Tri-Hit",
    description: "Three rapid hits on count 1",
    fullDescription:
      "Three rapid hits creating dramatic emphasis. Great for highlighting chants or calls.",
    pattern: "XXX             ",
    difficulty: "Medium",
    tempo: 100,
    imageUrl: "",
  },
  {
    id: "double-tri-hit",
    name: "Two Tri-Hits",
    description: "Three rapid hits on count 1",
    fullDescription:
      "Three rapid hits creating dramatic emphasis. Great for highlighting chants or calls.",
    pattern: "XXX     XXX     ",
    difficulty: "Medium",
    tempo: 100,
    imageUrl: "",
  },
  {
    id: "quadruple-tri-hit",
    name: "Four Tri-Hits",
    description: "Three rapid hits on count 1",
    fullDescription:
      "Three rapid hits creating dramatic emphasis. Great for highlighting chants or calls.",
    pattern: "XXX XXX XXX XXX ",
    difficulty: "Medium",
    tempo: 100,
    imageUrl: "",
  },
  {
    id: "whistle-in",
    name: "Whistle In",
    description: "Whistle in short cue pattern",
    fullDescription:
      "A short whistle-in cue for starting a piece — translated to a single-layer X/space pattern for reference.",
    pattern: "X       X       X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "whistle-in-long",
    name: "Whistle In (Long)",
    description: "Long whistle-in cue pattern",
    fullDescription:
      "An extended whistle-in cue, represented here as X and spaces for reference.",
    pattern: "X               X               X       X       X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "whistle-in-short",
    name: "Whistle In (Short)",
    description: "Short whistle-in cue pattern",
    fullDescription:
      "A rapid whistle-in cue — X marks beats where the whistle sounds.",
    pattern: "X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "karla-break",
    name: "Karla Break",
    description: "Karla break pattern",
    fullDescription:
      "A break used in the Karla tune — main low surdo line only.",
    pattern: "XXXXXXXXXXXXXXXXX    X    X    X  XX X XX XXXXXS",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "progressive-karla",
    name: "Progressive Karla",
    description: "Progressive Karla low surdo",
    fullDescription: "Low surdo line for the progressive Karla variation.",
    pattern: "X   X   X   X   X X X X X X X X XXXXXXXXXXXXXXXXX               ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "karla-clave",
    name: "Karla Clave",
    description: "Karla pattern combined with clave",
    fullDescription: "Low surdo line for the Karla Clave combination.",
    pattern: "XXXXXXXXXXXXXXXXX  X  X   X X   ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "x-break",
    name: "X Break",
    description: "X Break low surdo",
    fullDescription: "Low surdo line for the X Break — driving and assertive.",
    pattern: "X       X       X X X X X       ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: "",
  },
  {
    id: "knock-on-the-door",
    name: "Knock On The Door",
    description: "Knock On The Door low surdo",
    fullDescription: "Low surdo part for the Knock On The Door break.",
    pattern: "X            XXXX               X  X  X   X X X X               ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: "",
  },
];
