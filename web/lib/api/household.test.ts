import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getHousehold,
  saveHousehold,
  type HouseholdFormValues,
} from "./household";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getHousehold", () => {
  it("【正常系】householdデータを返すこと", async () => {
    const token = "test-token";
    const responseData = {
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
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getHousehold(token, 2026, 8);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/households/2026/8",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(result).toEqual(responseData);
  });

  it("【異常系】失敗時はerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            message: "家計データの取得に失敗しました。",
          },
        }),
      }),
    );

    await expect(getHousehold("test-token", 2026, 8)).rejects.toThrow(
      "家計データの取得に失敗しました。",
    );
  });
});

describe("saveHousehold", () => {
  it("【正常系】保存後のhouseholdデータを返すこと", async () => {
    const token = "test-token";
    const input: HouseholdFormValues = {
      income: 290000,
      rent: 90000,
      food: 50000,
      savings: 30000,
      transportation: 10000,
      social_expense: 20000,
      daily_goods: 10000,
      utilities: 15000,
      subscription_fee: 5000,
    };
    const responseData = {
      id: 1,
      year: 2026,
      month: 8,
      ...input,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await saveHousehold(token, 2026, 8, input);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/households/2026/8",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      },
    );
    expect(result).toEqual(responseData);
  });

  it("【異常系】失敗時はerrorをthrowすること", async () => {
    const input: HouseholdFormValues = {
      income: 290000,
      rent: 90000,
      food: 50000,
      savings: 30000,
      transportation: 10000,
      social_expense: 20000,
      daily_goods: 10000,
      utilities: 15000,
      subscription_fee: 5000,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: "金額は0以上で入力してください。",
          },
        }),
      }),
    );

    await expect(
      saveHousehold("test-token", 2026, 8, input),
    ).rejects.toThrow("金額は0以上で入力してください。");
  });
});
