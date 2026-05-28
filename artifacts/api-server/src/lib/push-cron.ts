import cron from "node-cron";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { logger } from "./logger";

const MESSAGES = [
  { title: "오늘의 편지 💌", body: "오늘 하루는 어떤 감정이었나요? 모아가 기다리고 있어요." },
  { title: "오늘의 편지 🌙", body: "오늘의 마음을 기록해두면 나중에 편지가 돼요." },
  { title: "오늘의 편지 ✨", body: "잠깐, 오늘 감정 기록 아직 안 했죠? 모아가 궁금해해요!" },
];

export function startPushCron() {
  // Run every minute to check reminder times
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;

    const subs = await db
      .select()
      .from(pushSubscriptionsTable)
      .execute();

    const due = subs.filter(s => s.reminderTime === currentTime);
    if (due.length === 0) return;

    logger.info({ count: due.length, time: currentTime }, "Sending push notifications");

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const payload = JSON.stringify({ title: msg.title, body: msg.body, url: "/" });

    await Promise.allSettled(
      due.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            // Subscription expired — remove it
            await db.delete(pushSubscriptionsTable)
              .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
            logger.info({ endpoint: sub.endpoint }, "Removed expired push subscription");
          } else {
            logger.warn({ err, endpoint: sub.endpoint }, "Push send failed");
          }
        }
      })
    );
  });

  logger.info("Push notification cron started");
}
