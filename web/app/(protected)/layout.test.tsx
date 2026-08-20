import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import ProtectedLayout from "./layout";

const replaceMock = vi.fn();
const meMock = vi.fn();
const pathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => pathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/auth", () => ({
  me: (...args: unknown[]) => meMock(...args),
}));

describe("ProtectedLayout", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    meMock.mockReset();
    pathnameMock.mockReset();
    pathnameMock.mockReturnValue("/home");
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("【異常系】tokenなしでprotected画面へアクセスした場合は/loginにリダイレクトすること", async () => {
    render(
      <ProtectedLayout>
        <div>protected page</div>
      </ProtectedLayout>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
    expect(meMock).not.toHaveBeenCalled();
  });

  it("【正常系】tokenありかつ/me成功時はuser情報を取得しprotected画面を表示すること", async () => {
    localStorage.setItem("token", "valid-token");
    meMock.mockResolvedValue({
      id: 1,
      name: "山田 太郎",
      email: "taro@example.com",
      created_at: "2026-06-22T00:00:00Z",
      updated_at: "2026-06-22T00:00:00Z",
    });

    render(
      <ProtectedLayout>
        <div>protected page</div>
      </ProtectedLayout>,
    );

    await waitFor(() => {
      expect(meMock).toHaveBeenCalledWith("valid-token");
    });

    expect(await screen.findByText("protected page")).toBeTruthy();
    expect(screen.getByText("山田 太郎")).toBeTruthy();
    expect(screen.getByText("taro@example.com")).toBeTruthy();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("【異常系】tokenありかつ/me失敗時はtokenを削除し/loginにリダイレクトすること", async () => {
    localStorage.setItem("token", "expired-token");
    meMock.mockRejectedValue(new Error("token has expired"));

    render(
      <ProtectedLayout>
        <div>protected page</div>
      </ProtectedLayout>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("【正常系】ログアウト押下でtokenを削除し/loginに遷移すること", async () => {
    localStorage.setItem("token", "valid-token");
    meMock.mockResolvedValue({
      id: 1,
      name: "山田 太郎",
      email: "taro@example.com",
      created_at: "2026-06-22T00:00:00Z",
      updated_at: "2026-06-22T00:00:00Z",
    });

    render(
      <ProtectedLayout>
        <div>protected page</div>
      </ProtectedLayout>,
    );

    const logoutButton = await screen.findByRole("button", {
      name: "ログアウト",
    });

    await userEvent.click(logoutButton);

    expect(localStorage.getItem("token")).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
