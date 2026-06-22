import { afterEach, describe, expect, it, vi } from "vitest";
import { login, me, signup } from "./auth";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("login", () => {
  it("【正常系】tokenを含むレスポンスを返すこと", async () => {
    const input = {
      email: "taro@example.com",
      password: "pass1234",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "test-token" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await login(input);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );
    expect(result).toEqual({ token: "test-token" });
  });

  it("【異常系】失敗時はerrorをthrowすること", async () => {
    const input = {
      email: "taro@example.com",
      password: "pass1234",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            message: "invalid credentials",
          },
        }),
      }),
    );

    await expect(login(input)).rejects.toThrow("invalid credentials");
  });
});

describe("signup", () => {
  it("【正常系】tokenを含むレスポンスを返すこと", async () => {
    const input = {
      name: "Taro",
      email: "taro@example.com",
      password: "pass1234",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "signup-token" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await signup(input);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/signup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );
    expect(result).toEqual({ token: "signup-token" });
  });

  it("【異常系】失敗時はerrorをthrowすること", async () => {
    const input = {
      name: "Taro",
      email: "taro@example.com",
      password: "pass1234",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            message: "email already exists",
          },
        }),
      }),
    );

    await expect(signup(input)).rejects.toThrow(
      "email already exists",
    );
  });
});

describe("me", () => {
  it("【正常系】user情報を返すこと", async () => {
    const token = "test-token";
    const currentUser = {
      id: 1,
      name: "Taro",
      email: "taro@example.com",
      created_at: "2026-06-21T00:00:00Z",
      updated_at: "2026-06-21T00:00:00Z",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => currentUser,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await me(token);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(result).toEqual(currentUser);
  });

  it("【異常系】失敗時はerrorをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            message: "token has expired",
          },
        }),
      }),
    );

    await expect(me("expired-token")).rejects.toThrow(
      "token has expired",
    );
  });
});
