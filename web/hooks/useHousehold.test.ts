import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getHousehold, saveHousehold } from "@/lib/api/household";
import { EMPTY_FORM_VALUES, useHousehold } from "./useHousehold";

vi.mock("@/lib/api/household", () => ({
  getHousehold: vi.fn(),
  saveHousehold: vi.fn(),
}));

const getHouseholdMock = vi.mocked(getHousehold);
const saveHouseholdMock = vi.mocked(saveHousehold);

const flushEffects = async () => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

describe("useHousehold", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T00:00:00Z"));
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    getHouseholdMock.mockReset();
    saveHouseholdMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("【正常系】初期表示時に現在年月でhousehold取得処理が走ること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      income: 290000,
      rent: 90000,
      food: 50000,
      savings: 30000,
      transportation: 10000,
      social_expense: 20000,
      daily_goods: 10000,
      utilities: 15000,
      subscription_fee: 5000,
    });

    renderHook(() => useHousehold());

    await flushEffects();

    expect(getHouseholdMock).toHaveBeenCalledWith(
      "test-token",
      2026,
      8,
    );
  });

  it("【正常系】household取得成功時に取得値がformValuesへ反映されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      income: 290000,
      rent: 90000,
      food: 50000,
      savings: 30000,
      transportation: 10000,
      social_expense: 20000,
      daily_goods: 10000,
      utilities: 15000,
      subscription_fee: 5000,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    expect(result.current.formValues).toEqual({
      income: 290000,
      rent: 90000,
      food: 50000,
      savings: 30000,
      transportation: 10000,
      social_expense: 20000,
      daily_goods: 10000,
      utilities: 15000,
      subscription_fee: 5000,
    });
  });

  it("【正常系】household取得404時にEMPTY_FORM_VALUESがセットされること", async () => {
    const error = new Error("not found") as Error & {
      status?: number;
    };
    error.status = 404;
    getHouseholdMock.mockRejectedValue(error);

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    expect(result.current.formValues).toEqual(EMPTY_FORM_VALUES);
    expect(result.current.errorMessage).toBe("");
  });

  it("【異常系】household取得失敗時にerrorMessageがセットされること", async () => {
    getHouseholdMock.mockRejectedValue(
      new Error("家計データの取得に失敗しました。"),
    );

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    expect(result.current.errorMessage).toBe(
      "家計データの取得に失敗しました。",
    );
  });

  it("【正常系】handleAmountChangeで対象項目だけ更新されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      result.current.handleAmountChange("rent")({
        target: { value: "90000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formValues.rent).toBe(90000);
    expect(result.current.formValues.food).toBe(0);
  });

  it("【正常系】handleAmountChangeで負数入力は0に補正されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      result.current.handleAmountChange("food")({
        target: { value: "-1000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formValues.food).toBe(0);
  });

  it("【正常系】handleMonthShift(-1)で前月に移動できること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      result.current.handleMonthShift(-1);
    });

    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(7);
  });

  it("【正常系】handleMonthShift(1)で翌月に移動できること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      result.current.handleMonthShift(1);
    });

    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(9);
  });

  it("【境界値】1月から前月へ移動した場合は前年12月になること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      for (let i = 0; i < 7; i += 1) {
        result.current.handleMonthShift(-1);
      }
    });

    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(1);

    act(() => {
      result.current.handleMonthShift(-1);
    });

    expect(result.current.year).toBe(2025);
    expect(result.current.month).toBe(12);
  });

  it("【境界値】12月から翌月へ移動した場合は翌年1月になること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      for (let i = 0; i < 4; i += 1) {
        result.current.handleMonthShift(1);
      }
    });

    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(12);

    act(() => {
      result.current.handleMonthShift(1);
    });

    expect(result.current.year).toBe(2027);
    expect(result.current.month).toBe(1);
  });

  it("【正常系】handleSave成功時にsuccessMessageが表示されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });
    saveHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      income: 290000,
      rent: 90000,
      food: 50000,
      savings: 30000,
      transportation: 10000,
      social_expense: 20000,
      daily_goods: 10000,
      utilities: 15000,
      subscription_fee: 5000,
    });

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    act(() => {
      result.current.handleAmountChange("income")({
        target: { value: "290000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(saveHouseholdMock).toHaveBeenCalledWith(
      "test-token",
      2026,
      8,
      {
        income: 290000,
        rent: 0,
        food: 0,
        savings: 0,
        transportation: 0,
        social_expense: 0,
        daily_goods: 0,
        utilities: 0,
        subscription_fee: 0,
      },
    );
    expect(result.current.successMessage).toBe(
      "家計データを保存しました。",
    );
  });

  it("【異常系】handleSave失敗時にerrorMessageが表示されること", async () => {
    getHouseholdMock.mockResolvedValue({
      id: 1,
      year: 2026,
      month: 8,
      ...EMPTY_FORM_VALUES,
    });
    saveHouseholdMock.mockRejectedValue(
      new Error("家計データの保存に失敗しました。"),
    );

    const { result } = renderHook(() => useHousehold());

    await flushEffects();

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.errorMessage).toBe(
      "家計データの保存に失敗しました。",
    );
  });
});
