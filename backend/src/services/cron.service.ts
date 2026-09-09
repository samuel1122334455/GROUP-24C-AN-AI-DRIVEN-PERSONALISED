import cron from "node-cron";
import { User } from "../models/User.model";
import { Transaction } from "../models/Transaction.model";
import { WeeklyReport } from "../models/WeeklyReport.model";
import { sendPushNotification } from "./notification.service";
import { aiService } from "./ai/aiService";

const getWeekBounds = (): { weekStart: Date; weekEnd: Date } => {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  return { weekStart, weekEnd };
};

const runWeeklyReports = async (): Promise<void> => {
  const users = await User.find({
    "userPrefs.weeklyReport": true,
    pushToken: { $ne: null },
  });

  const { weekStart, weekEnd } = getWeekBounds();

  for (const user of users) {
    try {
      const txs = await Transaction.find({
        userId: user._id,
        date: { $gte: weekStart, $lte: weekEnd },
      });

      const totalSpent = txs.reduce((sum, t) => sum + t.amount, 0);

      const categorySums: Record<string, number> = {};
      txs.forEach((t) => {
        categorySums[t.category] = (categorySums[t.category] ?? 0) + t.amount;
      });
      const topCategory =
        Object.keys(categorySums).sort((a, b) => categorySums[b] - categorySums[a])[0] ?? "General";

      const dailyBudget = user.profile.monthlyIncome > 0
        ? Math.round(user.profile.monthlyIncome / 30)
        : 100;
      const savedVsBudget = dailyBudget * 7 - totalSpent;
      const currencyCode = user.userPrefs?.currency ?? "USD";

      const prompt = `You are a supportive finance coach. Write a 3-sentence weekly summary for ${user.name}. Stats: total spent ${currencyCode} ${totalSpent.toFixed(2)}, top spending category: ${topCategory}, number of transactions: ${txs.length}, ${savedVsBudget >= 0 ? `saved ${currencyCode} ${savedVsBudget.toFixed(2)} under budget` : `went ${currencyCode} ${Math.abs(savedVsBudget).toFixed(2)} over budget`}. Be warm and encouraging, reference the top category specifically, and close with one concrete improvement tip for next week.`;

      const aiSummary = await aiService.generateText(prompt);

      const report = await WeeklyReport.create({
        userId: user._id,
        weekStart,
        weekEnd,
        totalSpent,
        topCategory,
        txCount: txs.length,
        aiSummary,
      });

      await sendPushNotification(
        user.pushToken!,
        "Your weekly summary is ready 📊",
        "Tap to see what your coach noticed this week.",
        { screen: "WeeklyReport", reportId: report._id.toString() }
      );
    } catch (err) {
      console.error(`[CronService] Weekly report failed for user ${user._id}:`, err);
    }
  }
};

const runDailyCheckIns = async (): Promise<void> => {
  const users = await User.find({
    "userPrefs.checkIn": true,
    pushToken: { $ne: null },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const user of users) {
    try {
      const txToday = await Transaction.findOne({
        userId: user._id,
        date: { $gte: todayStart },
      });

      if (!txToday) {
        const dailyBudget = user.profile.monthlyIncome > 0
          ? Math.round(user.profile.monthlyIncome / 30)
          : 100;
        const currencyCode = user.userPrefs?.currency ?? "USD";
        const firstName = user.name.split(" ")[0];

        await sendPushNotification(
          user.pushToken!,
          `Good morning, ${firstName}! 💰`,
          `Your daily budget is ${currencyCode} ${dailyBudget} — tap to log your first spend.`,
          { screen: "LogTransaction" }
        );
      }
    } catch (err) {
      console.error(`[CronService] Check-in failed for user ${user._id}:`, err);
    }
  }
};

export const startCronJobs = (): void => {
  cron.schedule("0 20 * * 0", () => {
    console.log("[CronService] Running weekly reports...");
    runWeeklyReports().catch(console.error);
  });

  cron.schedule("0 8 * * *", () => {
    console.log("[CronService] Running daily check-ins...");
    runDailyCheckIns().catch(console.error);
  });

  console.log("✅ Cron jobs registered: weekly reports (Sun 8pm), daily check-ins (8am)");
};
