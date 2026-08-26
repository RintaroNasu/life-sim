import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getDashboard } from "@/lib/api/dashboard";
import { useDashboard } from "./useDashboard";

vi.mock("@/lib/api/dashboard", () => ({
  getDashboard: vi.fn(),
}));

const getDashboardMock = vi.mocked(getDashboard);

const flushEffects = async () => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

describe("useDashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T00:00:00Z"));
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    getDashboardMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("【正常系】初期表示時にdashboard取得処理が走ること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [{ label: "貯金額", value: 30000 }],
    });

    renderHook(() => useDashboard());

    await flushEffects();

    expect(getDashboardMock).toHaveBeenCalledWith("test-token");
  });

  it("【正常系】dashboard取得成功時に取得結果がセットされること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [{ label: "貯金額", value: 30000 }],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.dashboard).toEqual({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [{ label: "貯金額", value: 30000 }],
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isNotFound).toBe(false);
  });

  it("【正常系】monthLabelがAPIのyear monthを使って整形されること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 12,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.monthLabel).toBe("2026年12月");
  });

  it("【正常系】savingsAmountがexpense_breakdownから貯金額を取り出せること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [
        { label: "家賃", value: 90000 },
        { label: "貯金額", value: 25000 },
      ],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.savingsAmount).toBe(25000);
  });

  it("【正常系】chartSegmentsが0円より大きい支出項目だけで構成されること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 100000,
      free_amount: 200000,
      expense_breakdown: [
        { label: "家賃", value: 90000 },
        { label: "食費", value: 10000 },
        { label: "交際費", value: 0 },
      ],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.chartSegments).toEqual([
      {
        label: "家賃",
        value: 90000,
        fill: "#4f8cff",
        percentage: 90,
      },
      {
        label: "食費",
        value: 10000,
        fill: "#5fd3a8",
        percentage: 10,
      },
    ]);
  });

  it("【正常系】spendRateが支出率を四捨五入した整数で返すこと", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 175000,
      free_amount: 125000,
      expense_breakdown: [],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.spendRate).toBe(58);
  });

  it("【境界値】total_expensesが0の場合はchartSegmentsが空配列になること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 0,
      free_amount: 300000,
      expense_breakdown: [{ label: "家賃", value: 0 }],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.chartSegments).toEqual([]);
  });

  it("【境界値】incomeが0の場合はspendRateが0になること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 0,
      total_expenses: 50000,
      free_amount: -50000,
      expense_breakdown: [{ label: "家賃", value: 50000 }],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.spendRate).toBe(0);
  });

  it("【境界値】支出が収入を上回る場合はspendRateが100に丸められること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 100000,
      total_expenses: 120000,
      free_amount: -20000,
      expense_breakdown: [{ label: "家賃", value: 120000 }],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.spendRate).toBe(100);
  });

  it("【異常系】dashboard取得404時にisNotFoundがtrueになること", async () => {
    const error = new Error(
      "dashboard data was not found",
    ) as Error & {
      status?: number;
    };
    error.status = 404;
    getDashboardMock.mockRejectedValue(error);

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.dashboard).toBeNull();
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.errorMessage).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】dashboard取得失敗時にerrorMessageがセットされること", async () => {
    getDashboardMock.mockRejectedValue(
      new Error("ダッシュボードデータの取得に失敗しました。"),
    );

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.errorMessage).toBe(
      "ダッシュボードデータの取得に失敗しました。",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】tokenがない場合はdashboard取得処理が走らないこと", async () => {
    localStorage.removeItem("token");

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(getDashboardMock).not.toHaveBeenCalled();
    expect(result.current.monthLabel).toBe("2026年8月");
  });

  it("【回帰】貯金額が存在しない場合はsavingsAmountが0になること", async () => {
    getDashboardMock.mockResolvedValue({
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [{ label: "家賃", value: 90000 }],
    });

    const { result } = renderHook(() => useDashboard());

    await flushEffects();

    expect(result.current.savingsAmount).toBe(0);
  });
});
