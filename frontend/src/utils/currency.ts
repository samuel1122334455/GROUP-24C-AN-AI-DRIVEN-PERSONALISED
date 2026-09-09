import cc from "currency-codes";

export const getAllCurrencies = (): { code: string; name: string }[] =>
  cc.codes().map((code) => ({ code, name: cc.code(code)!.currency }));

export const getCurrencySymbol = (code: string): string => {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
};

export const generateProjectionData = (monthlySavings: number): number[] =>
  Array.from({ length: 12 }, (_, i) => monthlySavings * (i + 1));

export const getGoalTimelineLabel = (
  goal: string,
  income: number,
  savings: number
): string => {
  if (goal === "save_emergency") {
    const target = income * 3;
    const months = savings > 0 ? Math.ceil(target / savings) : 0;
    return months > 0 ? `~${months} months` : "Set a savings target";
  }
  if (goal === "pay_debt") return "Coach-guided";
  if (goal === "invest") return "Long-term";
  return "Daily habit";
};
