import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const entriesTable = pgTable("entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  entryDate: date("entry_date").notNull(),
  emotion: varchar("emotion", { length: 50 }).notNull(),
  shortAnswer: text("short_answer").notNull(),
  longAnswer: text("long_answer"),
  photo: text("photo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const reflectionsTable = pgTable("reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull().references(() => entriesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  reminderTime: varchar("reminder_time", { length: 5 }).notNull().default("21:00"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Entry = typeof entriesTable.$inferSelect;
export type InsertEntry = typeof entriesTable.$inferInsert;
export type Reflection = typeof reflectionsTable.$inferSelect;
export type InsertReflection = typeof reflectionsTable.$inferInsert;
export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptionsTable.$inferInsert;
