import { 
  users, 
  tunes,
  protestBeats,
  type User, 
  type InsertUser,
  type Tune,
  type InsertTune,
  type ProtestBeat,
  type InsertProtestBeat
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllTunes(): Promise<Tune[]>;
  getTuneByName(name: string): Promise<Tune | undefined>;
  createTune(tune: InsertTune): Promise<Tune>;
  
  getAllProtestBeats(): Promise<ProtestBeat[]>;
  createProtestBeat(beat: InsertProtestBeat): Promise<ProtestBeat>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tunesMap: Map<number, Tune>;
  private protestBeatsMap: Map<number, ProtestBeat>;
  private currentUserId: number;
  private currentTuneId: number;
  private currentBeatId: number;

  constructor() {
    this.users = new Map();
    this.tunesMap = new Map();
    this.protestBeatsMap = new Map();
    this.currentUserId = 1;
    this.currentTuneId = 1;
    this.currentBeatId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllTunes(): Promise<Tune[]> {
    return Array.from(this.tunesMap.values());
  }

  async getTuneByName(name: string): Promise<Tune | undefined> {
    return Array.from(this.tunesMap.values()).find(tune => tune.name === name);
  }

  async createTune(insertTune: InsertTune): Promise<Tune> {
    // Check if tune already exists
    const existing = await this.getTuneByName(insertTune.name);
    if (existing) {
      return existing;
    }

    const id = this.currentTuneId++;
    const tune: Tune = { ...insertTune, id };
    this.tunesMap.set(id, tune);
    return tune;
  }

  async getAllProtestBeats(): Promise<ProtestBeat[]> {
    return Array.from(this.protestBeatsMap.values());
  }

  async createProtestBeat(insertBeat: InsertProtestBeat): Promise<ProtestBeat> {
    const id = this.currentBeatId++;
    const beat: ProtestBeat = { ...insertBeat, id };
    this.protestBeatsMap.set(id, beat);
    return beat;
  }
}

export const storage = new MemStorage();
