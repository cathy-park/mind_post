import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// ── VAPID setup ─────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:admin@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── GET /api/push/vapid-key ─────────────────────────────────────────────────

router.get("/push/vapid-key", (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// ── POST /api/push/subscribe ────────────────────────────────────────────────

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).default("21:00"),
});

router.post("/push/subscribe", async (req: Request, res: Response) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "잘못된 요청이에요", details: parsed.error.issues });
    return;
  }

  const { endpoint, keys, reminderTime } = parsed.data;

  await db
    .insert(pushSubscriptionsTable)
    .values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, reminderTime })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { p256dh: keys.p256dh, auth: keys.auth, reminderTime, updatedAt: new Date() },
    });

  res.json({ ok: true });
});

// ── DELETE /api/push/subscribe ──────────────────────────────────────────────

router.delete("/push/subscribe", async (req: Request, res: Response) => {
  const { endpoint } = req.body as { endpoint?: string };
  if (!endpoint) {
    res.status(400).json({ error: "endpoint가 필요해요" });
    return;
  }
  await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  res.json({ ok: true });
});

// ── PATCH /api/push/subscribe ──── update reminder time only ────────────────

router.patch("/push/subscribe", async (req: Request, res: Response) => {
  const { endpoint, reminderTime } = req.body as { endpoint?: string; reminderTime?: string };
  if (!endpoint || !reminderTime) {
    res.status(400).json({ error: "endpoint와 reminderTime이 필요해요" });
    return;
  }
  await db
    .update(pushSubscriptionsTable)
    .set({ reminderTime, updatedAt: new Date() })
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));
  res.json({ ok: true });
});

export default router;
