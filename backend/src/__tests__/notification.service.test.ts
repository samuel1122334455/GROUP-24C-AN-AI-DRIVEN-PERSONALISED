import { shouldSend80Alert, shouldSend100Alert, computeSpendingPct } from "../services/notification.service";

describe("computeSpendingPct", () => {
  it("returns correct percentage", () => {
    expect(computeSpendingPct(80, 100)).toBeCloseTo(0.8);
    expect(computeSpendingPct(100, 100)).toBeCloseTo(1.0);
    expect(computeSpendingPct(50, 100)).toBeCloseTo(0.5);
  });

  it("returns 0 when budget is 0", () => {
    expect(computeSpendingPct(50, 0)).toBe(0);
  });
});

describe("shouldSend80Alert", () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  it("returns true when pct >= 0.8 and below 1.0, not yet notified today", () => {
    expect(shouldSend80Alert(0.81, null)).toBe(true);
    expect(shouldSend80Alert(0.99, null)).toBe(true);
  });

  it("returns false when pct is at or above 1.0", () => {
    expect(shouldSend80Alert(1.0, null)).toBe(false);
    expect(shouldSend80Alert(1.5, null)).toBe(false);
  });

  it("returns false when pct < 0.8", () => {
    expect(shouldSend80Alert(0.79, null)).toBe(false);
  });

  it("returns false when already notified today", () => {
    expect(shouldSend80Alert(0.85, new Date())).toBe(false);
  });

  it("returns true when notified yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(shouldSend80Alert(0.85, yesterday)).toBe(true);
  });
});

describe("shouldSend100Alert", () => {
  it("returns true when pct >= 1.0 and not yet notified today", () => {
    expect(shouldSend100Alert(1.0, null)).toBe(true);
    expect(shouldSend100Alert(1.5, null)).toBe(true);
  });

  it("returns false when pct < 1.0", () => {
    expect(shouldSend100Alert(0.99, null)).toBe(false);
  });

  it("returns false when already notified today", () => {
    expect(shouldSend100Alert(1.2, new Date())).toBe(false);
  });
});
