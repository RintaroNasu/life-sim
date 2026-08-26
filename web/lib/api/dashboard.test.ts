import { afterEach, describe, expect, it, vi } from "vitest";
import { getDashboard } from "./dashboard";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getDashboard", () => {
  it("【正常系】dashboardデータを返すこと", async () => {
    const token = "test-token";
    const responseData = {
      year: 2026,
      month: 8,
      income: 300000,
      total_expenses: 180000,
      free_amount: 120000,
      expense_breakdown: [
        { label: "家賃", value: 90000 },
        { label: "食費", value: 50000 },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getDashboard(token);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/dashboard",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(result).toEqual(responseData);
  });

  it("【異常系】レスポンスにmessageがある場合はそのmessageでerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            message: "dashboard data was not found",
          },
        }),
      }),
    );

    await expect(getDashboard("test-token")).rejects.toMatchObject({
      message: "dashboard data was not found",
      status: 404,
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

    await expect(getDashboard("test-token")).rejects.toMatchObject({
      message: "ダッシュボードデータの取得に失敗しました。",
      status: 500,
    });
  });
});
