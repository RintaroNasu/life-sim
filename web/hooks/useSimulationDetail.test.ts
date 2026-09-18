import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getSimulationDetail } from "@/lib/api/simulation";
import { useSimulationDetail } from "./useSimulationDetail";

vi.mock("@/lib/api/simulation", () => ({
  getSimulationDetail: vi.fn(),
}));

const getSimulationDetailMock = vi.mocked(getSimulationDetail);

const flushEffects = async () => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

describe("useSimulationDetail", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    getSimulationDetailMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("【正常系】初期表示時にシミュレーション詳細取得処理が走ること", async () => {
    getSimulationDetailMock.mockResolvedValue({
      id: 1,
      title: "固定費見直しプラン",
      income: 300000,
      rent: 90000,
      food: 40000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
      savings: 30000,
      monthly_expenses: 170000,
      monthly_free_amount: 100000,
      yearly_savings: 360000,
      yearly_free_amount: 1200000,
      monthly_asset_increase: 130000,
      yearly_asset_increase: 1560000,
      five_year_assets: 7800000,
      created_at: "2026-09-03T00:00:00Z",
      updated_at: "2026-09-03T00:00:00Z",
    });

    renderHook(() => useSimulationDetail(1));

    await flushEffects();

    expect(getSimulationDetailMock).toHaveBeenCalledWith(
      "test-token",
      1,
    );
  });

  it("【正常系】詳細取得成功時にsimulationへ取得結果がセットされること", async () => {
    const response = {
      id: 1,
      title: "固定費見直しプラン",
      income: 300000,
      rent: 90000,
      food: 40000,
      transportation: 10000,
      social_expense: 5000,
      daily_goods: 10000,
      utilities: 10000,
      subscription_fee: 5000,
      savings: 30000,
      monthly_expenses: 170000,
      monthly_free_amount: 100000,
      yearly_savings: 360000,
      yearly_free_amount: 1200000,
      monthly_asset_increase: 130000,
      yearly_asset_increase: 1560000,
      five_year_assets: 7800000,
      created_at: "2026-09-03T00:00:00Z",
      updated_at: "2026-09-03T00:00:00Z",
    };
    getSimulationDetailMock.mockResolvedValue(response);

    const { result } = renderHook(() => useSimulationDetail(1));

    await flushEffects();

    expect(result.current.simulation).toEqual(response);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.errorMessage).toBe("");
  });

  it("【異常系】詳細取得404時にisNotFoundがtrueになること", async () => {
    const error = new Error("simulation was not found") as Error & {
      status?: number;
    };
    error.status = 404;
    getSimulationDetailMock.mockRejectedValue(error);

    const { result } = renderHook(() => useSimulationDetail(999));

    await flushEffects();

    expect(result.current.simulation).toBeNull();
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.errorMessage).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】詳細取得失敗時にerrorMessageがセットされること", async () => {
    getSimulationDetailMock.mockRejectedValue(
      new Error("シミュレーション詳細の取得に失敗しました。"),
    );

    const { result } = renderHook(() => useSimulationDetail(1));

    await flushEffects();

    expect(result.current.errorMessage).toBe(
      "シミュレーション詳細の取得に失敗しました。",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】tokenがない場合は詳細取得処理が走らないこと", async () => {
    localStorage.removeItem("token");

    const { result } = renderHook(() => useSimulationDetail(1));

    await flushEffects();

    expect(getSimulationDetailMock).not.toHaveBeenCalled();
    expect(result.current.simulation).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】idがnullの場合は詳細取得処理が走らないこと", async () => {
    const { result } = renderHook(() => useSimulationDetail(null));

    await flushEffects();

    expect(getSimulationDetailMock).not.toHaveBeenCalled();
    expect(result.current.simulation).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
