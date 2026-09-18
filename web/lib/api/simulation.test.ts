import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSimulationDetail,
  getSimulations,
  saveSimulation,
  type SaveSimulationRequest,
} from "./simulation";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("saveSimulation", () => {
  const input: SaveSimulationRequest = {
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
  };

  it("【正常系】saveSimulation成功時に保存結果を返すこと", async () => {
    const token = "test-token";
    const responseData = {
      id: 1,
      ...input,
      created_at: "2026-09-03T00:00:00Z",
      updated_at: "2026-09-03T00:00:00Z",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await saveSimulation(token, input);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/simulations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      },
    );
    expect(result).toEqual(responseData);
  });

  it("【異常系】レスポンスにmessageがある場合はそのmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: "amount must be greater than or equal to 0",
          },
        }),
      }),
    );

    await expect(
      saveSimulation("test-token", input),
    ).rejects.toMatchObject({
      message: "amount must be greater than or equal to 0",
      status: 400,
    });
  });

  it("【異常系】レスポンスにmessageがない場合はデフォルトmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {},
        }),
      }),
    );

    await expect(
      saveSimulation("test-token", input),
    ).rejects.toMatchObject({
      message: "シミュレーションの保存に失敗しました。",
      status: 500,
    });
  });
});

describe("getSimulations", () => {
  it("【正常系】保存済みシミュレーション一覧を返すこと", async () => {
    const token = "test-token";
    const responseData = [
      {
        id: 1,
        title: "固定費見直しプラン",
        monthly_free_amount: 100000,
        yearly_savings: 360000,
        five_year_assets: 7800000,
        created_at: "2026-09-03T00:00:00Z",
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getSimulations(token);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/simulations",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(result).toEqual(responseData);
  });

  it("【異常系】一覧取得失敗時にレスポンスのmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            message: "internal server error",
          },
        }),
      }),
    );

    await expect(getSimulations("test-token")).rejects.toMatchObject({
      message: "internal server error",
      status: 500,
    });
  });

  it("【異常系】一覧取得失敗時にmessageがない場合はデフォルトmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {},
        }),
      }),
    );

    await expect(getSimulations("test-token")).rejects.toMatchObject({
      message: "シミュレーション一覧の取得に失敗しました。",
      status: 500,
    });
  });
});

describe("getSimulationDetail", () => {
  it("【正常系】指定したシミュレーション詳細を返すこと", async () => {
    const token = "test-token";
    const responseData = {
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

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getSimulationDetail(token, 1);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/simulations/1",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(result).toEqual(responseData);
  });

  it("【異常系】詳細取得失敗時にレスポンスのmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            message: "simulation was not found",
          },
        }),
      }),
    );

    await expect(
      getSimulationDetail("test-token", 999),
    ).rejects.toMatchObject({
      message: "simulation was not found",
      status: 404,
    });
  });

  it("【異常系】詳細取得失敗時にmessageがない場合はデフォルトmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {},
        }),
      }),
    );

    await expect(
      getSimulationDetail("test-token", 1),
    ).rejects.toMatchObject({
      message: "シミュレーション詳細の取得に失敗しました。",
      status: 500,
    });
  });
});
