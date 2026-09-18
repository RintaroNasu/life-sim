import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getSimulations } from "@/lib/api/simulation";
import { useSimulations } from "./useSimulations";

vi.mock("@/lib/api/simulation", () => ({
  getSimulations: vi.fn(),
}));

const getSimulationsMock = vi.mocked(getSimulations);

const flushEffects = async () => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

describe("useSimulations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    getSimulationsMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("【正常系】初期表示時にシミュレーション一覧取得処理が走ること", async () => {
    getSimulationsMock.mockResolvedValue([]);

    renderHook(() => useSimulations());

    await flushEffects();

    expect(getSimulationsMock).toHaveBeenCalledWith("test-token");
  });

  it("【正常系】一覧取得成功時にsimulationsへ取得結果がセットされること", async () => {
    getSimulationsMock.mockResolvedValue([
      {
        id: 1,
        title: "固定費見直しプラン",
        monthly_free_amount: 100000,
        yearly_savings: 360000,
        five_year_assets: 7800000,
        created_at: "2026-09-03T00:00:00Z",
      },
    ]);

    const { result } = renderHook(() => useSimulations());

    await flushEffects();

    expect(result.current.simulations).toEqual([
      {
        id: 1,
        title: "固定費見直しプラン",
        monthly_free_amount: 100000,
        yearly_savings: 360000,
        five_year_assets: 7800000,
        created_at: "2026-09-03T00:00:00Z",
      },
    ]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMessage).toBe("");
  });

  it("【正常系】一覧が0件の場合は空配列として扱うこと", async () => {
    getSimulationsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useSimulations());

    await flushEffects();

    expect(result.current.simulations).toEqual([]);
    expect(result.current.errorMessage).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】一覧取得失敗時にerrorMessageがセットされること", async () => {
    getSimulationsMock.mockRejectedValue(
      new Error("シミュレーション一覧の取得に失敗しました。"),
    );

    const { result } = renderHook(() => useSimulations());

    await flushEffects();

    expect(result.current.errorMessage).toBe(
      "シミュレーション一覧の取得に失敗しました。",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】401エラー時はログイン状態確認用のmessageがセットされること", async () => {
    const error = new Error("unauthorized") as Error & {
      status?: number;
    };
    error.status = 401;
    getSimulationsMock.mockRejectedValue(error);

    const { result } = renderHook(() => useSimulations());

    await flushEffects();

    expect(result.current.errorMessage).toBe(
      "ログイン状態を確認できませんでした。再度ログインしてください。",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("【異常系】tokenがない場合は一覧取得処理が走らないこと", async () => {
    localStorage.removeItem("token");

    const { result } = renderHook(() => useSimulations());

    await flushEffects();

    expect(getSimulationsMock).not.toHaveBeenCalled();
    expect(result.current.simulations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
