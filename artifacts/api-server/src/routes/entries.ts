import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db, entriesTable, reflectionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "로그인이 필요해요" });
    return false;
  }
  return true;
}

async function getEntryWithReflections(entryId: string) {
  const reflections = await db
    .select()
    .from(reflectionsTable)
    .where(eq(reflectionsTable.entryId, entryId))
    .orderBy(reflectionsTable.createdAt);
  return reflections;
}

function formatEntry(
  entry: typeof entriesTable.$inferSelect,
  reflections: (typeof reflectionsTable.$inferSelect)[],
) {
  return {
    id: entry.id,
    date: entry.entryDate,
    emotion: entry.emotion,
    shortAnswer: entry.shortAnswer,
    longAnswer: entry.longAnswer ?? null,
    photo: entry.photo ?? null,
    reflections: reflections.map((r) => ({
      id: r.id,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

// ── GET /entries ───────────────────────────────────────────────────────────

router.get("/entries", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.userId, userId))
    .orderBy(desc(entriesTable.entryDate));

  const allReflections = await db
    .select()
    .from(reflectionsTable)
    .where(eq(reflectionsTable.userId, userId));

  const reflMap = new Map<string, (typeof reflectionsTable.$inferSelect)[]>();
  allReflections.forEach((r) => {
    const list = reflMap.get(r.entryId) ?? [];
    list.push(r);
    reflMap.set(r.entryId, list);
  });

  const entries = rows.map((e) => formatEntry(e, reflMap.get(e.id) ?? []));
  res.json({ entries });
});

// ── POST /entries ──────────────────────────────────────────────────────────

const CreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  emotion: z.string().min(1),
  shortAnswer: z.string().min(1),
  longAnswer: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

router.post("/entries", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const body = CreateSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "잘못된 요청이에요" });
    return;
  }

  const [entry] = await db
    .insert(entriesTable)
    .values({
      userId,
      entryDate: body.data.date,
      emotion: body.data.emotion,
      shortAnswer: body.data.shortAnswer,
      longAnswer: body.data.longAnswer ?? null,
      photo: body.data.photo ?? null,
    })
    .returning();

  res.status(201).json({ entry: formatEntry(entry, []) });
});

// ── GET /entries/:date ─────────────────────────────────────────────────────

router.get("/entries/:date", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const { date } = req.params;

  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, userId), eq(entriesTable.entryDate, date)));

  if (!entry) {
    res.status(404).json({ error: "없는 기록이에요" });
    return;
  }

  const reflections = await getEntryWithReflections(entry.id);
  res.json({ entry: formatEntry(entry, reflections) });
});

// ── PATCH /entries/:date ───────────────────────────────────────────────────

const UpdateSchema = z.object({
  emotion: z.string().min(1).optional(),
  shortAnswer: z.string().min(1).optional(),
  longAnswer: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

router.patch("/entries/:date", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const { date } = req.params;

  const body = UpdateSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "잘못된 요청이에요" });
    return;
  }

  const [existing] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, userId), eq(entriesTable.entryDate, date)));

  if (!existing) {
    res.status(404).json({ error: "없는 기록이에요" });
    return;
  }

  const [updated] = await db
    .update(entriesTable)
    .set({
      ...(body.data.emotion !== undefined && { emotion: body.data.emotion }),
      ...(body.data.shortAnswer !== undefined && { shortAnswer: body.data.shortAnswer }),
      ...(body.data.longAnswer !== undefined && { longAnswer: body.data.longAnswer }),
      ...(body.data.photo !== undefined && { photo: body.data.photo }),
      updatedAt: new Date(),
    })
    .where(and(eq(entriesTable.userId, userId), eq(entriesTable.entryDate, date)))
    .returning();

  const reflections = await getEntryWithReflections(updated.id);
  res.json({ entry: formatEntry(updated, reflections) });
});

// ── DELETE /entries/:date ──────────────────────────────────────────────────

router.delete("/entries/:date", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const { date } = req.params;

  await db
    .delete(entriesTable)
    .where(and(eq(entriesTable.userId, userId), eq(entriesTable.entryDate, date)));

  res.status(204).send();
});

// ── POST /entries/:date/reflections ───────────────────────────────────────

const ReflectionSchema = z.object({
  comment: z.string().min(1),
});

router.post("/entries/:date/reflections", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const { date } = req.params;

  const body = ReflectionSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "잘못된 요청이에요" });
    return;
  }

  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, userId), eq(entriesTable.entryDate, date)));

  if (!entry) {
    res.status(404).json({ error: "없는 기록이에요" });
    return;
  }

  await db.insert(reflectionsTable).values({
    entryId: entry.id,
    userId,
    comment: body.data.comment,
  });

  const reflections = await getEntryWithReflections(entry.id);
  res.status(201).json({ entry: formatEntry(entry, reflections) });
});

// ── DELETE /entries/:date/reflections/:reflectionId ───────────────────────

router.delete("/entries/:date/reflections/:reflectionId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const { date, reflectionId } = req.params;

  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, userId), eq(entriesTable.entryDate, date)));

  if (!entry) {
    res.status(404).json({ error: "없는 기록이에요" });
    return;
  }

  await db
    .delete(reflectionsTable)
    .where(and(eq(reflectionsTable.id, reflectionId), eq(reflectionsTable.entryId, entry.id)));

  const reflections = await getEntryWithReflections(entry.id);
  res.json({ entry: formatEntry(entry, reflections) });
});

export default router;
