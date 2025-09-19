import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tunes } from "../client/src/data/tunes";
import { protestBeats } from "../client/src/data/protest-beats";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tunes
  app.get("/api/tunes", async (req, res) => {
    try {
      const allTunes = await storage.getAllTunes();
      res.json(allTunes);
    } catch (error) {
      console.error("Error fetching tunes:", error);
      res.status(500).json({ message: "Failed to fetch tunes" });
    }
  });

  // Get specific tune by name
  app.get("/api/tunes/:name", async (req, res) => {
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

  // Get all protest beats
  app.get("/api/protest-beats", async (req, res) => {
    try {
      const beats = await storage.getAllProtestBeats();
      res.json(beats);
    } catch (error) {
      console.error("Error fetching protest beats:", error);
      res.status(500).json({ message: "Failed to fetch protest beats" });
    }
  });

  // Initialize data if needed
  app.post("/api/initialize", async (req, res) => {
    try {
      // Initialize with sample data
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

  const httpServer = createServer(app);
  return httpServer;
}
