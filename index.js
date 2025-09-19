// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  tunesMap;
  protestBeatsMap;
  currentUserId;
  currentTuneId;
  currentBeatId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.tunesMap = /* @__PURE__ */ new Map();
    this.protestBeatsMap = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentTuneId = 1;
    this.currentBeatId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getAllTunes() {
    return Array.from(this.tunesMap.values());
  }
  async getTuneByName(name) {
    return Array.from(this.tunesMap.values()).find((tune) => tune.name === name);
  }
  async createTune(insertTune) {
    const existing = await this.getTuneByName(insertTune.name);
    if (existing) {
      return existing;
    }
    const id = this.currentTuneId++;
    const tune = { ...insertTune, id };
    this.tunesMap.set(id, tune);
    return tune;
  }
  async getAllProtestBeats() {
    return Array.from(this.protestBeatsMap.values());
  }
  async createProtestBeat(insertBeat) {
    const id = this.currentBeatId++;
    const beat = { ...insertBeat, id };
    this.protestBeatsMap.set(id, beat);
    return beat;
  }
};
var storage = new MemStorage();

// client/src/data/tunes.ts
var tunes = [
  {
    name: "Wolf",
    displayName: "Wolf",
    categories: ["new", "tricky"],
    speed: 120,
    time: 4,
    description: "A complex rhythm representing the cunning nature of the Big Bad Wolf.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X XXX   XXXXX   X XXX   X   X   ",
        ms: "      XX      XX      XXXXXXXXXX",
        hs: "@ms",
        re: "X  XX r X X X rrX  XX r  XXXX rr",
        sn: "f.X...X...X...X.f.X...X...X...X.",
        ta: "X X     X X     XX XXX XX       ",
        ag: "o ooo a   a   a o ooo a   a   a",
        sh: "X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.",
        mnemonics: {
          ls: "Here comes the wolf, ve-ry sca-ry wolf Here comes the Big Bad Wolf",
          ms: "And huff And puff Wolf will blow your li-ttle pi-ggy house down",
          re: "No-one told the Big Bad Wolf Li-ttle Red Ri-ding Hood was like as hard as nails",
          sn: "Grr . the . . . Big . . . Bad . . . Wolf . Grr . the . . . Big . . . Bad . . . Wolf .",
          ta: "Big Bad Wolf is hu-ffing and pu-ffing real tough",
          ag: "Pi-ggies aren't scared of the wolf Pi-ggies aren't scared of the wolf"
        }
      },
      "Alt Repi": {
        loop: true,
        re: "X  XX  XX X X   XXXXX  XX X X   X  XX  XX X X   XXXXX  XX       ",
        sh: "X   .   .   .   X   .   .   .   ",
        mnemonics: {
          re: "Here he comes, the Big Bad Wolf Ve-ry sca-ry guy, the Big Bad Wolf Here he comes, the Big Bad Wolf Ve-ry sca-ry guy, the wolf"
        }
      },
      "Alt Tam": {
        loop: true,
        ta: "X X     X X     XX XXX XX       X XX XX X X X X XX XXX XX       ",
        sh: "X   .   .   .   X   .   .   .   ",
        mnemonics: {
          ta: "Big Bad Wolf is hu-ffing and pu-ffing real tough Dressed up like your nan, come in close so Wol-fie can go-bble you up"
        }
      },
      "Break 1": {
        upbeat: 1,
        ls: "XX X X X X       ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        ot: "           E D   ",
        mnemonics: {
          ls: "No we're not scared at all",
          ot: "Ah Woo!"
        }
      },
      "Break 2": {
        loop: true,
        ls: "XXXXXXXXX  X XXXX     XXX       ",
        ms: "@ls",
        hs: "@ls",
        sh: "X   .   .   .   X   .   .   .   ",
        mnemonics: {
          ls: "Li-ttle pi-ggies got rid of the wolf, So did Li-ttle Red With an axe"
        }
      },
      "Tune Break 2": {
        displayName: "Tune (Surdos Break 2)",
        loop: true,
        ls: "XXXXXXXXX  X XXXX     XXX       ",
        ms: "@ls",
        hs: "@ls",
        re: "X XX  r X X X rrX XX  r  X XX rr",
        sn: "f.X...X...X...X.f.X...X...X...X.",
        ta: "X X     X X     XX XXX XX       ",
        ag: "o ooo a   a   a o ooo a   a   a",
        sh: "X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X."
      }
    }
  },
  {
    name: "Afoxe",
    displayName: "Afox\xE9",
    categories: ["common", "medium"],
    speed: 120,
    description: "A rhythm for shaving and grooming themes with intricate repi patterns.",
    patterns: {
      Tune: {
        loop: true,
        ls: "s   s   s   s   s   s   X   X   ",
        ms: "0     X 0     X 0     X X X X X ",
        hs: "@ms",
        re: "f  hs r f  hs r f  hs r s r s r ",
        sn: "X...X..XX..X....X...X..XX..X....",
        ta: "X X X X XX XX X X X X X XX XX X ",
        ag: "a a o o aa o oo a a o o aa o oo ",
        sh: "................................",
        mnemonics: {
          ls: "I'm so sick of all this stu-bble",
          ms: "If you want a shave then grab a to-wel",
          re: "Sha-ving cream please, Sha-ving cream please, Sha-ving cream please, Cream please cream please",
          sn: "Don't . . . scratch . . my face, . . please . . . . Don't . . . scratch . . my face, . . please . . . .",
          ta: "Spent all e-vening sha-ving my arm-pits Spent all e-vening sha-ving my arm-pits",
          ag: "Spent all e-vening sha-ving both my legs Spent all e-vening sha-ving both my legs"
        }
      },
      "Alt Repi": {
        loop: true,
        re: "X X XX XXX X    ",
        sh: "X   .   .   .   ",
        mnemonics: {
          re: "It-chy stu-bble, there's no-thing worse"
        }
      },
      "Break 1": {
        ls: "X       X       X       X XXXXX ",
        ms: "@ls",
        hs: "@ls",
        re: "   XXXX    XXXX    XXXX X XXXXX ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        mnemonics: {
          ls: "Hey Hey Hey Looks like you've had a shave",
          re: "You've had a shave You've had a shave You've had a shave Looks like you've had a shave"
        }
      }
    }
  },
  {
    name: "Angela Davis",
    displayName: "Angela Davis",
    categories: ["common", "medium"],
    speed: 120,
    description: "A rhythm about squirrels and nuts with playful patterns.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X X r  rXrX r   ",
        ms: "XXXXXXXXX       ",
        hs: "            XXXX",
        re: "f   f   f  XXX  ",
        sn: "....X.......X...",
        ta: "X   X  XXX  X   ",
        ag: "  o a   oa  a   ",
        sh: "................",
        mnemonics: {
          ls: "Did a squi-rrel ask you for nuts?",
          ms: "I thought squi-rrels went for a-corns more",
          hs: "We like pea-nuts",
          re: "Pea-nuts for a squi-rrel",
          ta: "Who gives a squi-rrel nuts?",
          ag: "Oh my, squi-rrels fly?"
        }
      },
      "Break 1": {
        upbeat: 1,
        ls: "XX X X X X X X X ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        mnemonics: {
          ls: "So give a pea-nut to a squi-rrel"
        }
      },
      "Break 2": {
        ls: "X             X X             X X              XX X X X X X X X ",
        ms: "@ls",
        hs: "@ls",
        re: "  XXX XX XX X     XXX XX XX X     XXX XX XX X  XX X X X X X X X ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        mnemonics: {
          ls: "Yes They do They do So give a pea-nut to a squi-rrel",
          re: "Squir-rels hide their nuts in the ground Squir-rels hide their nuts in the ground Squir-rels hide their nuts in the ground So give a pea-nut to a squi-rrel"
        }
      }
    }
  },
  {
    name: "Bhangra",
    displayName: "Bhangra",
    categories: ["core", "onesurdo", "medium"],
    speed: 120,
    time: 3,
    description: "A danceable rhythm with swing and energy.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X       XX  X       XX  X       XX  X    X   X  ",
        ms: "@ls",
        hs: "@ls",
        re: "X zX zX zX zX zX zX zX zX zX zX zX zXXXX  XXXX  ",
        sn: "X..X..X..X..X..X..X..X..X..X..X..X..XXXX  XXXX",
        ta: "X XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX X",
        ag: "aaaa  oooo              aaaa  oooo              ",
        sh: "X..X..X..X..X..X..X..X..X..X..X..X..X..X..X..X..",
        mnemonics: {
          ls: "Swing your drum Swing your drum Swing your drum side to side",
          re: "Ban-ger ban-ger ban-ger ban-ger Ban-ger ban-ger ban-ger ban-ger Ban-ger ban-ger ban-ger ban-ger Danc-ing a lot, like it or not",
          sn: "1 . . 2 . . 3 . . 4 . . 1 . . 2 . . 3 . . 4 . . 1 . . 2 . . 3 . . 4 . . Dan-cing a lot, like it or not",
          ta: "Ban-ger ban-ger ban-ger ban-ger Ban-ger ban-ger ban-ger ban-ger Ban-ger ban-ger ban-ger ban-ger Ban-ger ban-ger ban-ger ban-ger",
          ag: "Dan-cing a lot, like it or not Dan-cing a lot, like it or not"
        }
      },
      "Break 1": {
        upbeat: 4,
        ls: "XX  X XX X  XX  X       XX  X XX X  XX  X       XX  X XX X  XX  X       XX  X    X   X  XXXX  XXXX  ",
        ms: "@ls",
        hs: "@ls",
        re: "                   X  X                    X  X                    X  X                 XXXX  XXXX  ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        mnemonics: {
          ls: "'Cos the swing on this beat is so cool You'll be dan-cing a-round like a fool 'Cos the swing on this beat is so cool 'Cos it's a ban-ger Dan-cing a lot, like it or not",
          re: "That's right That's right That's right Dan-cing a lot, like it or not"
        }
      }
    }
  },
  {
    name: "Core Breaks",
    displayName: "Core Breaks",
    categories: ["breaks", "onesurdo", "easy", "medium", "tricky"],
    speed: 120,
    description: "Essential breaks and patterns for building rhythms.",
    patterns: {
      "Whistle in": {
        ot: "y       y       y   y   y   y   "
      },
      Silence: {
        ls: "                "
      },
      "4 Hits": {
        ls: "X   X   X   X   ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls"
      },
      Clave: {
        ls: "X  X  X   X X   ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        mnemonics: {
          ls: "Shut the sy-stem down"
        }
      },
      "Karla Break": {
        ls: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX               ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "X X X X X X X X X X X X X X X X X X X X X X X X X",
        ag: "@ta",
        sh: "@ls",
        volumeHack: { 0: 0.2, 16: 0.4, 32: 0.7, 48: 1 }
      }
    }
  },
  {
    name: "Custard",
    displayName: "Custard",
    categories: ["common", "medium"],
    speed: 120,
    description: "A playful rhythm about custard in unusual places.",
    patterns: {
      Tune: {
        loop: true,
        ls: "0   X   0   X X ",
        ms: "X   0   X   0   ",
        hs: "X X 0   XX X0   ",
        re: "  XX  XX  XX  XX",
        sn: "X.X.X..X.X..X...",
        ta: "X X XX X X X XX ",
        ag: "a a oo a a o oo ",
        sh: "................",
        mnemonics: {
          ls: "I quite like cu-stard",
          ms: "Cu-stard par-ty",
          hs: "Cu-stard thanks, Right in my pants",
          re: "Can I Get a Bit of Cu-stard?",
          sn: "Stop . wea . ring . . cu . stard? . . Nah . . .",
          ta: "I've got cu-stard in my un-der-pants",
          ag: "I've got cu-stard in my un-der-pants"
        }
      },
      "Break 1": {
        ls: "X X XX          X X XX          X X XX          X X XX X X X XX ",
        ms: "@ls",
        hs: "@ls",
        re: "       X X X XX        X X X XX        X X X XX X X XX X X X XX ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        mnemonics: {
          ls: "I've got cu-stard I've got cu-stard I've got cu-stard I've got cu-stard in my un-der-pants",
          re: "In my un-der-pants In my un-der-pants In my un-der-pants I've got cu-stard in my un-der-pants"
        }
      }
    }
  },
  {
    name: "Drum-Bass",
    displayName: "Drum & Bass",
    categories: ["new", "medium"],
    speed: 120,
    description: "An electronic-influenced rhythm with bass drops and DJ themes.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X         X  X  X         X     X         X  X  X         X     ",
        ms: "    X XXXX  X       X XXXX  X       X XXXX  X       X XXXX  X   ",
        hs: "@ms",
        re: "    X  X X XX XX    X       X       X  X X XX XX    X       X   ",
        sn: "....X..X....X.......X..X....X   ....X..X....X...X.X.X.X.X.X.X.X.",
        ta: "    X     X X       X   X X X       X     X X       X   X X X   ",
        ag: "o ao ao a       o ao ao a       o ao ao a       o ao ao a       ",
        sh: "................................................................",
        mnemonics: {
          ls: "Drum, drum and bass, bass Up in your face, face",
          ms: "Dance, yeah I love it, dance Dance, yeah I love it, dance Dance, yeah I love it, dance Dance, yeah I love it, dance",
          re: "This M-C can rock the mic, Mic drop This M-C can rock the mic, Mic drop",
          sn: ". . . . Drum . . and . . . . bass . . . . . . . Drum . . and . . . . stop . . . . Drum . . and . . . . bass . . . This . goes . out . to . all . the . D . Js .",
          ta: "The D-J plays bang-in' tunes The D-J plays bang-in' tunes",
          ag: "Drum and bass is so cool Drum and bass is so cool Drum and bass is so cool Drum and bass is so cool"
        }
      },
      "Break 2": {
        ls: "X  X X  X  X X  X  X X          ",
        ms: "@ls",
        hs: "@ls",
        re: "  X   X   X   X   X   X XXXX    ",
        sn: "@re",
        ta: "  X   X   X   X   X   X         ",
        ag: "@ta",
        sh: "@ta",
        mnemonics: {
          ls: "Get drum and Get drum and Get drum and",
          re: "some bass some bass some bass Right in your face",
          ta: "some bass some bass some bass"
        }
      }
    }
  },
  {
    name: "Funk",
    displayName: "Funk",
    categories: ["core", "easy"],
    speed: 120,
    description: "A groovy rhythm about potatoes and cooking preferences.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X  X  X X X     X  X  X X       ",
        ms: "    X       X X     X     X X   ",
        hs: "@ms",
        re: "f  hf  hf  hf  hf  hf  hf  hXhrh",
        sn: "....X.......X.......X.......X...",
        ta: "@ms",
        ag: "o  a  o   a a a o  a  o   a a a ",
        sh: "X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.",
        mnemonics: {
          ls: "I like po-ta-toes, I like them mashed",
          ms: "Oh, do you? 'Cos I don't",
          re: "Mash is fine, but Mash is fine, but Mash is fine, but Chips are clea-rly be-tter",
          ag: "I like hash browns be-tter I like hash browns be-tter"
        }
      },
      "Alt Repi": {
        loop: true,
        re: "  X   X XXXXX X   X   X X XX XX ",
        sh: "X   .   .   .   X   .   .   .   ",
        mnemonics: {
          re: "I don't want to come off pi-cky, But you can't beat sa-lty chips"
        }
      },
      "Break 1": {
        ls: "X X     X X   X X X     X       X X     X X   X X X     X       ",
        ms: "@ls",
        hs: "@ls",
        re: "    X X     X       X X   X   X     X X     X       X X   XXX   ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        mnemonics: {
          ls: "Boil them Fry them Just give us Spuds Boil them Fry them Just give us Spuds",
          re: "Mash them Up Give us With salt Mash them Up Give us On a plate"
        }
      }
    }
  },
  {
    name: "Hedgehog",
    displayName: "Hedgehog",
    categories: ["core", "easy"],
    speed: 120,
    description: "A simple, cute rhythm about hedgehogs.",
    patterns: {
      Tune: {
        loop: true,
        ls: "s  X    s  X    s  X    X X X X ",
        ms: "      XX      XX      XX      XX",
        hs: "   X  X    X  X    X  X   X   X ",
        re: "r  X  X r  X  X r  X  X r X r X ",
        sn: "X..X..X.X..X..X.X..X..X.X...X...",
        ta: "X  X    X  X    X  X    X X X   ",
        ag: "o  a  a o  a  a o  a  a o a o a ",
        sh: "................................",
        mnemonics: {
          ls: "Hedge-hog Hedge-hog Hedge-hog I'm a hedge-hog",
          ms: "I'm a hedge-hog I'm a hedge-hog",
          hs: "Hedge-hog Hedge-hog Hedge-hog A hog",
          re: "1 hedge-hog, 2 hedge-hog, 3 hedge-hog I'm a hedge-hog",
          sn: "Hedge . . hog . . a . Hedge . . hog . . a . Hedge . . hog . . a . Small . . . guy . . .",
          ta: "Hedge-hog Hedge-hog Hedge-hog I'm a hog",
          ag: "1 hedge-hog, 2 hedge-hog, 3 hedge-hog I'm a hedge-hog"
        }
      },
      "Alt Repi": {
        loop: true,
        re: "  XX XXX  XX XXX  XX XXX  XX  XX",
        sh: "X   .   .   .   X   .   .   .   ",
        mnemonics: {
          re: "A ti-ny li-ttle A ti-ny li-ttle A ti-ny li-ttle Hedge-hog Hedge-hog"
        }
      }
    }
  },
  {
    name: "Jericho",
    displayName: "Jericho",
    categories: ["new", "tricky"],
    speed: 120,
    time: 3,
    description: "The biblical story of Joshua and the falling walls of Jericho.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X X0  X X0  X X0 X   0  X X0 X   0  X X0 X   0",
        ms: "   X X   X X   0     X X   0     X X   0     X X",
        hs: "@ms",
        re: "f  h Xf  h Xf  h Xf  h Xf  h Xf  h Xf  h Xh r",
        sn: "...X.X...X.....X.X...X.....X.X...X.....X.X..XX.X",
        ta: "   X     X     X X   X     X X   X     X X   X",
        ag: "o  a ao  a ao a  o      o a  o      o a  o",
        sh: "X  X .X  X .X  X .X  X .X  X .X  X .X  X .X  X .",
        mnemonics: {
          ls: "Jo-shu-a Jo-shu-a Je-ri-cho's done for Je-ri-cho's done for Je-ri-cho's done for",
          ms: "Trum-pets soun-ding Walls fa-lling Walls fa-lling Walls fa-lling",
          re: "Je-ri-cho's crum-bl-ing Je-ri-cho's crum-bl-ing Je-ri-cho's crum-bl-ing Je-ri-cho's had it",
          sn: ". . . Those . walls . . . will . . . . . Those . walls . . . will . . . . . Those . walls . . . will . . . . . Those . walls . . will fall . down",
          ta: "Walls are Fall-ing down Fall-ing down Fall-ing down",
          ag: "Jo-shu-a laughed when the wall came down Wall came down Wall came down"
        }
      },
      "Break 1": {
        upbeat: 3,
        ls: "X XX  X  X XX X",
        ms: "@ls",
        hs: "@ls",
        re: "X XX  X  X XX X     X  X  X",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        mnemonics: {
          ls: "And the wall came tum-bl-ing down",
          re: "And the wall came tum-bl-ing down They've had it"
        }
      }
    }
  },
  {
    name: "Karla",
    displayName: "Karla",
    categories: ["core", "easy"],
    speed: 120,
    description: "About Karla freeing rabbits from factory farms.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X     XX        X     XX        X     XX        X     XX X XX X ",
        ms: "    X       X       X       X       X       X       X  X X XX X ",
        hs: "@ms",
        re: "X  XX  X X XX X X  XX  X X XX X X  XX  X X XX X X  XX  X X XX X ",
        sn: "....X.......X.......X.......X.......X.......X.......X.......X...",
        ta: "    X       X       X  X X XX       X       X       X  X X XX   ",
        ag: "o  oa o o  oa o o  oa o o  oa o o  oa o o  oa o o  oa o o  oa o ",
        sh: "................................................................",
        mnemonics: {
          ls: "Ra-bbit run Ra-bbit run Ra-bbit run Ra-bbit run from the ca-ges",
          ms: "Run fast Run fast Run fast Run fast from the ca-ges",
          re: "Ka-rla said you won't be fur coats Ka-rla said you won't be fur coats Ka-rla said you won't be fur coats Ka-rla said you won't be fur coats",
          ta: "Ka-rla saved us from the farm Ka-rla saved us from the farm",
          ag: "Ha-ppy bu-nnies ha-ppy bu-nnies Ha-ppy bu-nnies ha-ppy bu-nnies Ha-ppy bu-nnies ha-ppy bu-nnies Ha-ppy bu-nnies ha-ppy bu-nnies"
        }
      },
      "Karla Break (Karla)": {
        ls: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX               ",
        ms: "@ls",
        hs: "@ls",
        re: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  XX  X X XX X ",
        sn: "@ls",
        ta: "X X X X X X X X X X X X X X X X X X X X X X X X X",
        ag: "o o o o o o o o o o o o o o o o o o o o o o o o o",
        sh: "@ls",
        volumeHack: { 0: 0.2, 16: 0.4, 32: 0.7, 48: 1 }
      },
      "Break 2": {
        ls: "XXXXXXXXXXXXXXXXX   X   X   X   X X    X X      X X    X X      ",
        ms: "@ls",
        hs: "@ls",
        re: "XXXXXXXXXXXXXXXXX   X   X   X       X      XXXX     X      XXXX ",
        sn: "@re",
        ta: "X X X X X X X X X   X   X   X       X      XXXX     X      XXXX ",
        ag: "@ta",
        sh: "@re",
        mnemonics: {
          ls: "A-ny-bo-dy a-ny-bo-dy a-ny-bo-dy a-ny-bo-dy Got some le-ttuce? I have I have I have I have",
          re: "A-ny-bo-dy a-ny-bo-dy a-ny-bo-dy a-ny-bo-dy Got some le-ttuce? Great We're star-ving here Great We're star-ving here",
          ta: "A-ny-bo-dy a-ny-bo-dy Got some le-ttuce? Great We're star-ving here Great We're star-ving here"
        }
      }
    }
  },
  {
    name: "More Breaks",
    displayName: "More Breaks",
    categories: ["breaks", "onesurdo", "easy", "medium", "tricky"],
    speed: 120,
    description: "Additional breaks and transitions for complex arrangements.",
    patterns: {
      "Boom Break": {
        ls: "X               ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls"
      },
      "Capped Karla": {
        loop: true,
        ls: "XXXXXXXXXXXXXXXXX               ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "X X X X X X X X X",
        ag: "@ta",
        sh: "@ls",
        volumeHack: { 0: 0.2, 4: 0.4, 8: 0.7, 12: 1 }
      },
      "Wolf Break": {
        ls: "X X   XXX X    XX X    XX X     X X   XXX X    XX X X X X       ",
        ms: "@ls",
        hs: "@ls",
        re: "    X       X       X       X       X       X  XX X X X X       ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        ot: "                                                          E D   ",
        mnemonics: {
          ls: "Who's a of the Big Bad The Big Bad The Big Bad Who's a of the Big Bad No we're not scared at all",
          re: "fraid Wolf, Wolf, Wolf fraid Wolf No we're not scared at all",
          ot: "Ah woo"
        }
      }
    }
  },
  {
    name: "Ragga",
    displayName: "Ragga",
    categories: ["new", "tricky"],
    speed: 120,
    description: "A reggae-influenced rhythm with dancehall vibes.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X  X  0 X  X  0 X  X  0 X  X  0 ",
        ms: "0  X  X 0  X  X 0  X  X 0  X  X ",
        hs: "@ms",
        re: "  X   X   X   X  XXX  X ",
        sn: "..XX..X...XX..X...XX..X...XX..X.",
        ta: "  X   X   X   X   XX  X ",
        ag: "o a o a oa ao a o a  o oo a o   ",
        sh: "X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.",
        mnemonics: {
          ls: "Ra-gga yeah Ra-gga yeah Ra-gga yeah Ra-gga yeah",
          ms: "It's ra-gga It's ra-gga It's ra-gga It's ra-gga",
          re: "Ra-gga Ra-gga Ra-gga So turn it up",
          sn: ". . Turn it . . up . . . Turn it . . up . . . Turn it . . up . . . Turn it . . up .",
          ta: "Ra-gga Ra-gga Ra-gga Turn it up",
          ag: "What's that pla-ying down at the dance-hall? Ra-gga? Be-tter play it loud"
        }
      },
      "Starter Agogo": {
        displayName: "Starter Agog\xF4",
        loop: true,
        ag: "o a o a o ao ao ",
        sh: "X   .   .   .   ",
        mnemonics: {
          ag: "1 2 3 4 Put some ra-gga on"
        }
      },
      "Break 1": {
        ls: "        X  X  X",
        ms: "@ls",
        hs: "@ls",
        re: "          X  X ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@re",
        ot: "w w w w        ",
        mnemonics: {
          ls: "Put ra-on",
          re: "some gga",
          ot: "1 2 3 4"
        }
      }
    }
  },
  {
    name: "Samba Reggae",
    displayName: "Fusion Reggae",
    categories: ["core", "medium"],
    speed: 120,
    description: "A fusion rhythm with reggae and resistance themes.",
    patterns: {
      Tune: {
        loop: true,
        ls: "0   X   0   X X ",
        ms: "X   0   X   0   ",
        hs: "0     X 0   XXXX",
        re: "  XX  XX  XX  XX",
        sn: "X..X..X...X..X..",
        ta: "X  X  X   X X   ",
        ag: "o a a oo a aa o ",
        sh: "................",
        mnemonics: {
          ls: "I quite like re-ggae",
          ms: "Fu-sion re-ggae",
          hs: "Time to play fu-sion re-ggae",
          re: "Can I Get a Bit of Re-ggae",
          sn: "Bo . . ssa . . for . . . re . . ggae . .",
          ta: "Cla-ve for re-ggae",
          ag: "Fu-sion re-ggae on the a-go-g\xF4"
        }
      },
      "Starter Snare": {
        loop: true,
        sn: "..XX..XX..XX..XX",
        sh: "X   .   .   .   ",
        mnemonics: {
          sn: ". . Can I . . Get a . . Bit of . . Re-ggae"
        }
      },
      "Break 1": {
        ls: "                X X XX XX                       X  X  X X                                  XX                              XX                              XX               XXXX",
        ms: "@ls",
        hs: "@ls",
        re: "XX XX XXXX XX                   XX XX XXXX XX                                              XX                              XX                              XX               XXXX",
        sn: "                X X XX XX                       X  X  X X       X..X..X.X..X..X.X..X..X.X       X..X..X.X..X..X.X..X..X.X       X..X..X.X..X..X.X..X..X.X       X  X  X   X     ",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        mnemonics: {
          ls: "We want some-thing to eat We want some grub Yum yum Yum yum Yum yum Sam-ba re-ggae",
          re: "What do you want, tell me what do you want? What do you want, tell me what do you want? Yum yum Yum yum Yum yum Sam-ba re-ggae",
          sn: "We want some-thing to eat We want some grub Sau-sa-ges sau-sa-ges I've got Sau-sa-ges sau-sa-ges in the pan Sau-sa-ges sau-sa-ges I've got Sau-sa-ges sau-sa-ges in the pan Sau-sa-ges sau-sa-ges I've got Sau-sa-ges sau-sa-ges in the pan Sam-ba re-ggae"
        }
      }
    }
  },
  {
    name: "Sambasso",
    displayName: "Sambasso",
    categories: ["common", "onesurdo", "tricky"],
    speed: 120,
    description: "The tale of Humpty Dumpty on his wall.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X  rX r X  rX r ",
        ms: "@ls",
        hs: "@ls",
        re: "X..X..X..XX..XX.",
        sn: "X..X..X...X..X..",
        ta: "X X X   XX XX   ",
        ag: "o  aa oo a oo a ",
        sh: "X.X.X.X.X.X.X.X.",
        mnemonics: {
          ls: "Hump-ty Dump-ty Hump-ty Dump-ty",
          re: "Hump . . ty's . . on . . the wall . . a-gain .",
          sn: "Bo . . ssa . . for . . . Hump . . ty . .",
          ta: "Hump-ty mate, get off the wall",
          ag: "Hump-ty Dump-ty fell off a brick wall"
        }
      },
      "Break 1": {
        ls: "X  rX r XX XX   ",
        ms: "@ls",
        hs: "@ls",
        re: "X..X..X.XX XX   ",
        sn: "X..X..X.XX XX   ",
        ta: "X X X   XX XX   ",
        ag: "o  aa ooXX XX   ",
        sh: "X.X.X.X.XX XX   ",
        ot: "y w w           ",
        mnemonics: {
          ls: "Hump-ty Dump-ty Get off the wall",
          re: "Hump . . ty's . . on . Get off the wall",
          sn: "Bo . . ssa . . for . Get off the wall",
          ta: "Hump-ty mate, Get off the wall",
          ag: "Hump-ty Dump-ty fell Get off the wall",
          ot: "Hump-ty mate"
        }
      }
    }
  },
  {
    name: "Stolen",
    displayName: "Stolen",
    categories: ["common", "tricky"],
    speed: 160,
    time: 2,
    description: "A fast-paced rhythm with mysterious origins - some say it was stolen from another tradition.",
    patterns: {
      Tune: {
        loop: true,
        // ls: "XXXXXXXXX",
        ms: "  X   X   XX XX",
        // hs: "@ms",
        re: "..X...X...X..XX.",
        sn: "..X...X...X...X.",
        ta: "X   X   X  XX X",
        ag: "          oa ao ",
        sh: "@sn",
        mnemonics: {
          ls: "This beat? We've been pla-ying it for years",
          ms: "Hey wait, Where's this one from?",
          re: ". . Who . . . said . . . it's . . half-inched? .",
          ta: "Sto-len? That's ba-na-nas",
          ag: "Where's this one from?"
        }
      },
      "Alt Agogo": {
        displayName: "Alt Agog\xF4",
        loop: true,
        ag: "o ao  a  oaoo a ",
        sh: "X . . . X . . . ",
        mnemonics: {
          ag: "This tune we play, I think it's sto-len"
        }
      },
      "Break 1": {
        time: 3,
        ls: "                     X                       X                       X                       X     X        X        X  ",
        ms: "@ls",
        hs: "@ls",
        re: "XXXXXXXXXXXXX X  X      XXXXXXXXXXXXX X  X      XXXXXXXXXXXXX X  X      XXXXXXXXXXXXX X  X     fX       fX       fX     ",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        mnemonics: {
          ls: "Nope Nope Nope Nope Yep Yep Yep",
          re: "A-ny-one got a-ny tips a-bout fin-ding that sto-len beat? A-ny-one got a-ny tips a-bout fin-ding that sto-len beat? A-ny-one got a-ny tips a-bout fin-ding that sto-len beat? A-ny-one got a-ny tips a-bout fin-ding that sto-len beat? Y' sure? Y' sure? Y' sure?"
        }
      },
      "24 Break": {
        displayName: "2/4 Break",
        ls: "X   X   X X X X ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "@ls",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls"
      },
      "Break 3": {
        ls: "X  X XX  X XX X X  X XX  X XX X X  X XX  X XX X X          XX X ",
        ms: "@ls",
        hs: "@ls",
        re: "@ls",
        sn: "X..X.XX..X.XX.X.X..X.XX..X.XX.X.X..X.XX..X.XX.X.X          XX X ",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        mnemonics: {
          ls: "Sto-len, you say? That's ba-na-nas Sto-len, you say? That's ba-na-nas Sto-len, you say? That's ba-na-nas That's ba-na-nas",
          sn: "Sto . . len . you say? . . That's . ba na . nas . Sto . . len . you say? . . That's . ba na . nas . Sto . . len . you say? . . That's . ba na . nas . That's ba-na-nas"
        }
      },
      "Whistle Break Stolen": {
        displayName: "Whistle Break (Stolen)",
        loop: true,
        ls: "X  XX  XXX XX",
        ms: "@ls",
        hs: "@ls",
        re: "  X   X   X   X ",
        sn: "@re",
        ta: "@re",
        ag: "@re",
        sh: "@ls",
        mnemonics: {
          ls: "Time to nick the Sheff whi-stle break",
          re: "Yep Yep Yep Yep"
        }
      }
    }
  },
  {
    name: "BadDuckSong",
    displayName: "Bad Duck Song",
    categories: ["new", "tricky"],
    speed: 160,
    time: 4,
    description: "A wild, quacky samba beat about a mischievous duck causing chaos on the dance floor.",
    patterns: {
      Tune: {
        loop: true,
        ls: "X   X   X   X   X   X   X   X   ",
        ms: "X X X X X X X X X X X X X X X X ",
        hs: "@ms",
        re: "f  r f  r f  r f  r f  r f  r f  r",
        sn: "X...X...X...X...X...X...X...X...",
        ta: "X X  X X  X X  X X  X X  X X  X X  ",
        ag: "o   o   o   o   o   o   o   o   ",
        sh: "X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.",
        ot: "q   q   q   q   q   q   q   q   ",
        mnemonics: {
          ls: "Bad-duck stomps in the mud-dy muck",
          ms: "Flap your wings like a cra-zy duck",
          re: "Beak goes f...rr...f...rr...f...rr",
          sn: "Snap-snap trap of the hun-gry duck",
          ta: "Tam-bou-rine taps in the quack-ing show",
          ag: "A-go-go rings for the duck-y glee",
          sh: "Sha-ker shakes the quack-y beat",
          ot: "Qua-ck qua-ck qua-ck qua-ck qua-ck qua-ck"
        }
      },
      "Break 1": {
        loop: true,
        upbeat: 2,
        ls: "X X X X X X X X X X X X X X X X ",
        ms: "@ls",
        hs: "@ms",
        re: "f  r f  r f  r f  r f  r f  r f  r",
        sn: "X...X...X...X...X...X...X...X...",
        ta: "@ls",
        ag: "@ls",
        sh: "@ls",
        ot: "q   q   q   q   q   q   q   q   ",
        mnemonics: {
          ls: "Duck stomps on break, boots of thunder",
          re: "Beak snaps with repi-ni-funk-alarm",
          ot: "Loud quack at-tack!"
        }
      },
      "Break 2": {
        loop: true,
        upbeat: 1,
        ls: "XX  XX  XX  XX  XX  XX  XX  XX  ",
        ms: "X X  X X  X X  X X  X X  X X  X X",
        hs: "@ms",
        re: "r  f  r  f  r  f  r  f  r  f  r  f",
        sn: "..X...X...X...X...X...X...X...X..",
        ta: "X  X X  X X  X X  X X  X X  X X ",
        ag: "o o   o o   o o   o o   o o   o",
        sh: "X...X...X...X...X...X...X...X...",
        ot: "q.q.q.q.q.q.q.q.q.q.q.q.q.q.q.q",
        mnemonics: {
          ls: "Fea-ther shuffle in the pond at dawn",
          ms: "Quack line kicks with a sneer and yawn",
          ot: "Echoing quack-o-rama"
        }
      },
      "Break 3": {
        loop: true,
        ls: "X  X    X  X    X  X    X  X    ",
        ms: "    XX      XX      XX      XX  ",
        hs: "@ms",
        re: "fXf XfX fXf XfX fXf XfX fXf XfX",
        sn: "X.X.X...X.X.X...X.X.X...X.X.X...",
        ta: "X  X X   X  X X   X  X X   X  X ",
        ag: "o  a o   o  a o   o  a o   o  a ",
        sh: "................X.X................",
        mnemonics: {
          ls: "Pond skipper bounce with quack attack",
          re: "Funky fowl looped in sonic smack"
        }
      },
      "Break 4": {
        loop: true,
        ls: "XXXX    XXXX    XXXX    XXXX    ",
        ms: "X  X    X  X    X  X    X  X    ",
        hs: "@ms",
        re: "rr rr rr rr rr rr rr rr rr rr rr",
        sn: "X...XXXX...X...XXXX...X...XXXX....",
        ta: "X XX X XX X XX X XX X XX X XX X X",
        ag: "o   oo   oo   oo   oo   oo   oo  ",
        sh: "X.X...X.X...X.X...X.X...X.X...X.X.",
        ot: "q   qqq   q   qqq   q   qqq   q  ",
        mnemonics: {
          ls: "Hon-ker break with a stomp and roll",
          sn: "Snare snare snaps of the quacky soul"
        }
      },
      "Break 5": {
        loop: true,
        upbeat: 3,
        ls: "X X   X X   X X   X X   X X   X X  ",
        ms: "XX X  XX X  XX X  XX X  XX X  XX X ",
        hs: "@ms",
        re: "f rX f rX f rX f rX f rX f rX f rX",
        sn: "...X..X...X..X...X..X...X..X...X..X",
        ta: "X   X   X   X   X   X   X   X   X",
        ag: "oao aoa oao aoa oao aoa oao aoa oao",
        sh: "X...X...X...X...X...X...X...X...X..",
        mnemonics: {
          ls: "Wad-dle roll through the quack-y hall",
          re: "Repeat your call till the building fall"
        }
      }
    },
    exampleSong: ["Tune", { patternName: "Break 1", length: 2 }, "Tune"]
  }
];

// client/src/data/protest-beats.ts
var protestBeats = [
  {
    id: "level-1",
    name: "Level 1",
    description: "Single beat every count",
    fullDescription: "Basic foundation rhythm - single beat every count. Perfect for beginners and building unified rhythm.",
    pattern: "X               ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "level-2",
    name: "Level 2",
    description: "Double beat on counts 1 and 3",
    fullDescription: "Double beat on counts 1 and 3. Builds foundation for more complex patterns.",
    pattern: "X       X       ",
    difficulty: "Easy",
    tempo: 40,
    imageUrl: ""
  },
  {
    id: "level-3",
    name: "Level 3",
    description: "Solid beats on counts 1-3 with tri-beat on count 4",
    fullDescription: "Solid beats on counts 1-3 with a tri-beat on count 4. Creates powerful momentum.",
    pattern: "X   X   X XXX   ",
    difficulty: "Medium",
    tempo: 110,
    imageUrl: ""
  },
  {
    id: "level-4",
    name: "Level 4",
    description: "Continuous hi-hat pulse on every count",
    fullDescription: "Continuous hi-hat pulse on every count. Maximum energy and drive.",
    pattern: "XXXXXXXXXXXXXXXXX   X   X XXX   ",
    difficulty: "Medium",
    tempo: 130,
    imageUrl: ""
  },
  {
    id: "level-5",
    name: "Level 5",
    description: "Continuous hi-hat pulse on every count",
    fullDescription: "Continuous hi-hat pulse on every count. Maximum energy and drive.",
    pattern: "X   XX  X  X   XX  X  X  ",
    difficulty: "Medium",
    tempo: 110,
    imageUrl: ""
  },
  {
    id: "single-beat",
    name: "Single Beat",
    description: "A steady hit every count",
    fullDescription: "Basic steady rhythm - one hit per count. Foundation for all other patterns.",
    pattern: "X               ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "double-beat",
    name: "Double Beat",
    description: "Hits only on counts 1 and 3",
    fullDescription: "Emphasis on beats 1 and 3 only. Strong foundation pattern.",
    pattern: "X       X       ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "quadruple-beat",
    name: "Quadruple Beat",
    description: "Hits on all 4 counts",
    fullDescription: "Emphasis on beats 1 and 3 only. Strong foundation pattern.",
    pattern: "X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "8-beat",
    name: "8 Beat",
    description: "8 hits in a 16-step measure (every 2 steps)",
    fullDescription: "8 evenly spaced hits across 16 steps. Maintains steady energy and easy for crowds to follow.",
    pattern: "X X X X X X X X ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "clave",
    name: "Clave",
    description: "Classic pattern: 'Shut the sys-tem down'",
    fullDescription: "Traditional clave rhythm: 'Shut the sys-tem down.' Powerful and iconic protest beat.",
    pattern: "X  X  X   X X   ",
    difficulty: "Easy",
    tempo: 130,
    imageUrl: ""
  },
  {
    id: "gaza-level1",
    name: "Gaza - Level 1",
    description: "Gaza beat",
    fullDescription: "Gaza solidarity Level 1 - basic beat that everyone can play together.",
    pattern: "X  X  X X       ",
    difficulty: "Easy",
    tempo: 110,
    imageUrl: ""
  },
  {
    id: "end-occupation",
    name: "End The Occupation",
    description: "Same as Level 5, often used at demos",
    fullDescription: "Powerful rhythm demanding end to occupation. Everyone plays together for maximum impact.",
    pattern: "X   XX  X  X   XX  X  X  ",
    difficulty: "Medium",
    tempo: 110,
    imageUrl: ""
  },
  {
    id: "we-are-people-level1",
    name: "We Are The People - Level 1",
    description: "Surdos only",
    fullDescription: "Foundation rhythm for 'We Are The People' - surdos establish the base rhythm.",
    pattern: "X X     X X     X X     XX X X X",
    difficulty: "Easy",
    tempo: 50,
    imageUrl: ""
  },
  {
    id: "tri-hit",
    name: "1 Tri-Hit",
    description: "Three rapid hits on count 1",
    fullDescription: "Three rapid hits creating dramatic emphasis. Great for highlighting chants or calls.",
    pattern: "XXX             ",
    difficulty: "Medium",
    tempo: 100,
    imageUrl: ""
  },
  {
    id: "double-tri-hit",
    name: "Two Tri-Hits",
    description: "Three rapid hits on count 1",
    fullDescription: "Three rapid hits creating dramatic emphasis. Great for highlighting chants or calls.",
    pattern: "XXX     XXX     ",
    difficulty: "Medium",
    tempo: 100,
    imageUrl: ""
  },
  {
    id: "quadruple-tri-hit",
    name: "Four Tri-Hits",
    description: "Three rapid hits on count 1",
    fullDescription: "Three rapid hits creating dramatic emphasis. Great for highlighting chants or calls.",
    pattern: "XXX XXX XXX XXX ",
    difficulty: "Medium",
    tempo: 100,
    imageUrl: ""
  },
  {
    id: "whistle-in",
    name: "Whistle In",
    description: "Whistle in short cue pattern",
    fullDescription: "A short whistle-in cue for starting a piece \u2014 translated to a single-layer X/space pattern for reference.",
    pattern: "X       X       X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "whistle-in-long",
    name: "Whistle In (Long)",
    description: "Long whistle-in cue pattern",
    fullDescription: "An extended whistle-in cue, represented here as X and spaces for reference.",
    pattern: "X               X               X       X       X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "whistle-in-short",
    name: "Whistle In (Short)",
    description: "Short whistle-in cue pattern",
    fullDescription: "A rapid whistle-in cue \u2014 X marks beats where the whistle sounds.",
    pattern: "X   X   X   X   ",
    difficulty: "Easy",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "karla-break",
    name: "Karla Break",
    description: "Karla break pattern",
    fullDescription: "A break used in the Karla tune \u2014 main low surdo line only.",
    pattern: "XXXXXXXXXXXXXXXXX    X    X    X  XX X XX XXXXXS",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "progressive-karla",
    name: "Progressive Karla",
    description: "Progressive Karla low surdo",
    fullDescription: "Low surdo line for the progressive Karla variation.",
    pattern: "X   X   X   X   X X X X X X X X XXXXXXXXXXXXXXXXX               ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "karla-clave",
    name: "Karla Clave",
    description: "Karla pattern combined with clave",
    fullDescription: "Low surdo line for the Karla Clave combination.",
    pattern: "XXXXXXXXXXXXXXXXX  X  X   X X   ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "x-break",
    name: "X Break",
    description: "X Break low surdo",
    fullDescription: "Low surdo line for the X Break \u2014 driving and assertive.",
    pattern: "X       X       X X X X X       ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: ""
  },
  {
    id: "knock-on-the-door",
    name: "Knock On The Door",
    description: "Knock On The Door low surdo",
    fullDescription: "Low surdo part for the Knock On The Door break.",
    pattern: "X            XXXX               X  X  X   X X X X               ",
    difficulty: "Medium",
    tempo: 120,
    imageUrl: ""
  }
];

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/tunes", async (req, res) => {
    try {
      const allTunes = await storage.getAllTunes();
      res.json(allTunes);
    } catch (error) {
      console.error("Error fetching tunes:", error);
      res.status(500).json({ message: "Failed to fetch tunes" });
    }
  });
  app2.get("/api/tunes/:name", async (req, res) => {
    try {
      const tune = await storage.getTuneByName(req.params.name);
      if (!tune) {
        return res.status(404).json({ message: "Tune not found" });
      }
      res.json(tune);
    } catch (error) {
      console.error("Error fetching tune:", error);
      res.status(500).json({ message: "Failed to fetch tune" });
    }
  });
  app2.get("/api/protest-beats", async (req, res) => {
    try {
      const beats = await storage.getAllProtestBeats();
      res.json(beats);
    } catch (error) {
      console.error("Error fetching protest beats:", error);
      res.status(500).json({ message: "Failed to fetch protest beats" });
    }
  });
  app2.post("/api/initialize", async (req, res) => {
    try {
      for (const tune of tunes) {
        await storage.createTune({
          name: tune.name,
          displayName: tune.displayName,
          categories: tune.categories,
          speed: tune.speed || 120,
          time: tune.time || 4,
          patterns: tune.patterns,
          description: tune.description,
          video: tune.video
        });
      }
      for (const beat of protestBeats) {
        await storage.createProtestBeat({
          name: beat.name,
          description: beat.fullDescription,
          pattern: beat.pattern,
          difficulty: beat.difficulty,
          tempo: beat.tempo
        });
      }
      res.json({ message: "Data initialized successfully" });
    } catch (error) {
      console.error("Error initializing data:", error);
      res.status(500).json({ message: "Failed to initialize data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/audio", express2.static("public/audio", {
  setHeaders: (res, path3) => {
    if (path3.endsWith(".mp3")) {
      res.setHeader("Content-Type", "audio/mpeg");
    }
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 3e3;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
