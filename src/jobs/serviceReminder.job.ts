import ServiceBooking from "../modules/services/serviceBooking.model";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const buildWindow = (hoursAhead: number) => {
  const now = new Date();
  const upper = new Date(now.getTime() + hoursAhead * HOUR_MS);
  return { now, upper };
};

const sendReminder = async (bookingId: string, reminderType: string) => {
  console.log(`[serviceReminder] Reminder sent for booking ${bookingId} (${reminderType})`);
};

export const runServiceReminderJob = async (): Promise<number> => {
  const dayWindow = buildWindow(24);
  const weekWindow = buildWindow(24 * 7);

  const [dayBefore, weekBefore] = await Promise.all([
    ServiceBooking.find({
      reminderType: "day_before",
      reminderSentAt: null,
      paymentStatus: "paid",
      scheduledAt: { $gte: dayWindow.now, $lte: dayWindow.upper },
    }).select("_id reminderType"),
    ServiceBooking.find({
      reminderType: "week_before",
      reminderSentAt: null,
      paymentStatus: "paid",
      scheduledAt: { $gte: weekWindow.now, $lte: weekWindow.upper },
    }).select("_id reminderType"),
  ]);

  const targets = [...dayBefore, ...weekBefore];
  if (targets.length === 0) {
    return 0;
  }

  for (const booking of targets) {
    await sendReminder(booking._id.toString(), booking.reminderType);
  }

  await ServiceBooking.updateMany(
    { _id: { $in: targets.map((item) => item._id) } },
    { reminderSentAt: new Date() }
  );

  return targets.length;
};

export const startServiceReminderJob = (): NodeJS.Timeout => {
  const run = async () => {
    try {
      const count = await runServiceReminderJob();
      if (count > 0) {
        console.log(`[serviceReminder] Processed ${count} reminder(s)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[serviceReminder] Failed to run reminders:", message);
    }
  };

  void run();
  return setInterval(() => {
    void run();
  }, HOUR_MS);
};
