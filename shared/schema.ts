import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tunes = pgTable("tunes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  categories: text("categories").array(),
  speed: integer("speed").default(120),
  time: integer("time").default(4),
  patterns: jsonb("patterns").notNull(),
  description: text("description"),
  video: text("video"),
});

export const protestBeats = pgTable("protest_beats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pattern: text("pattern").notNull(),
  difficulty: text("difficulty").notNull(),
  tempo: integer("tempo").default(120),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTuneSchema = createInsertSchema(tunes).omit({
  id: true,
});

export const insertProtestBeatSchema = createInsertSchema(protestBeats).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Tune = typeof tunes.$inferSelect;
export type InsertTune = z.infer<typeof insertTuneSchema>;
export type ProtestBeat = typeof protestBeats.$inferSelect;
export type InsertProtestBeat = z.infer<typeof insertProtestBeatSchema>;
