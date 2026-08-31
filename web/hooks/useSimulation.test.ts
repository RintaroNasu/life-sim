import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getHousehold } from "@/lib/api/household";
import { useSimulation } from "./useSimulation";

vi.mock("@/lib/api/household", () => ({
  getHousehold: vi.fn(),
}));

const getHouseholdMock = vi.mocked(getHousehold);

const flushEffects = async () => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

describe("useSimulation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    getHouseholdMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("【正常系】初期表示時にhousehold取得処理が走ること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 9,
      income: 300000,
      rent: 90000,
      food: 40000,
      savings: 30000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
    });

    renderHook(() => useSimulation());

    await flushEffects();

    expect(getHouseholdMock).toHaveBeenCalledWith(
      "test-token",
      2026,
      9,
    );
  });

  it("【正常系】household取得成功時に初期値と計算結果がセットされること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 9,
      income: 300000,
      rent: 90000,
      food: 40000,
      savings: 30000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
    });

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    expect(result.current.formValues).toEqual({
      income: 300000,
      rent: 90000,
      food: 40000,
      savings: 30000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
    });
    expect(result.current.summary.monthlyExpenses).toBe(170000);
    expect(result.current.summary.baseMonthlyExpenses).toBe(170000);
    expect(result.current.summary.monthlyFreeAmount).toBe(100000);
    expect(result.current.summary.baseMonthlyFreeAmount).toBe(100000);
    expect(result.current.summary.yearlySavings).toBe(360000);
    expect(result.current.summary.yearlyFreeAmount).toBe(1200000);
    expect(result.current.summary.monthlyAssetIncrease).toBe(130000);
    expect(result.current.summary.fiveYearAssets).toBe(7800000);
    expect(result.current.summary.fiveYearAssetsCurrent).toBe(
      7800000,
    );
    expect(result.current.assetChartData).toEqual([
      { label: "現在", current: 0, simulation: 0 },
      { label: "1年後", current: 1560000, simulation: 1560000 },
      { label: "3年後", current: 4680000, simulation: 4680000 },
      { label: "5年後", current: 7800000, simulation: 7800000 },
    ]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.errorMessage).toBe("");
    expect(result.current.monthLabel).toBe("2026年9月");
  });

  it("【正常系】スライダー変更時に対象項目だけ更新されて計算結果も再計算されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 9,
      income: 300000,
      rent: 90000,
      food: 40000,
      savings: 30000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
    });

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    act(() => {
      result.current.handleAmountChange("income")({
        target: { value: "350000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formValues.income).toBe(350000);
    expect(result.current.formValues.rent).toBe(90000);
    expect(result.current.summary.monthlyExpenses).toBe(170000);
    expect(result.current.summary.monthlyFreeAmount).toBe(150000);
    expect(result.current.summary.yearlyFreeAmount).toBe(1800000);
    expect(result.current.summary.monthlyAssetIncrease).toBe(180000);
    expect(result.current.summary.fiveYearAssets).toBe(10800000);
    expect(result.current.assetChartData).toEqual([
      { label: "現在", current: 0, simulation: 0 },
      { label: "1年後", current: 1560000, simulation: 2160000 },
      { label: "3年後", current: 4680000, simulation: 6480000 },
      { label: "5年後", current: 7800000, simulation: 10800000 },
    ]);
  });

  it("【境界値】負数入力は0に補正されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 9,
      income: 300000,
      rent: 90000,
      food: 40000,
      savings: 30000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
    });

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    act(() => {
      result.current.handleAmountChange("food")({
        target: { value: "-1000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formValues.food).toBe(0);
  });

  it("【境界値】赤字になる条件ではmonthlyFreeAmountがマイナスになること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 9,
      income: 200000,
      rent: 100000,
      food: 50000,
      savings: 30000,
      transportation: 30000,
      social_expense: 10000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 10000,
    });

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    expect(result.current.summary.monthlyFreeAmount).toBe(-50000);
    expect(result.current.summary.yearlyFreeAmount).toBe(-600000);
    expect(result.current.summary.monthlyAssetIncrease).toBe(-20000);
  });

  it("【境界値】家計データがすべて0円の場合は計算結果も0になること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 9,
      income: 0,
      rent: 0,
      food: 0,
      savings: 0,
      transportation: 0,
      social_expense: 0,
      daily_goods: 0,
      utilities: 0,
      subscription_fee: 0,
    });

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    expect(result.current.summary.monthlyExpenses).toBe(0);
    expect(result.current.summary.monthlyFreeAmount).toBe(0);
    expect(result.current.summary.yearlySavings).toBe(0);
    expect(result.current.summary.yearlyFreeAmount).toBe(0);
    expect(result.current.summary.monthlyAssetIncrease).toBe(0);
    expect(result.current.summary.fiveYearAssets).toBe(0);
  });

  it("【異常系】household取得404時に未登録状態になること", async () => {
    const error = new Error("not found") as Error & {
      status?: number;
    };
    error.status = 404;
    getHouseholdMock.mockRejectedValue(error);

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    expect(result.current.isNotFound).toBe(true);
    expect(result.current.formValues).toEqual({
      income: 0,
      rent: 0,
      food: 0,
      savings: 0,
      transportation: 0,
      social_expense: 0,
      daily_goods: 0,
      utilities: 0,
      subscription_fee: 0,
    });
    expect(result.current.errorMessage).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】household取得失敗時にerrorMessageがセットされること", async () => {
    getHouseholdMock.mockRejectedValue(
      new Error("シミュレーション初期値の取得に失敗しました。"),
    );

    const { result } = renderHook(() => useSimulation());

    await flushEffects();

    expect(result.current.errorMessage).toBe(
      "シミュレーション初期値の取得に失敗しました。",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】tokenがない場合はhousehold取得処理が走らないこと", async () => {
    localStorage.removeItem("token");

    renderHook(() => useSimulation());

    await flushEffects();

    expect(getHouseholdMock).not.toHaveBeenCalled();
  });
});
