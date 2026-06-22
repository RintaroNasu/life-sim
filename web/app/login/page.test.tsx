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
import LoginPage from "./page";

const pushMock = vi.fn();
const loginMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
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
  login: (...args: unknown[]) => loginMock(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("【異常系】メールアドレス未入力で送信した場合はバリデーションエラーが表示されること", async () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", {
      name: "ログイン",
    });

    await userEvent.click(submitButton);

    expect(
      screen.getByText("メールアドレスを入力してください。"),
    ).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("【異常系】パスワード未入力で送信した場合はバリデーションエラーが表示されること", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByRole("textbox", {
      name: "メールアドレス",
    });
    const submitButton = screen.getByRole("button", {
      name: "ログイン",
    });

    await userEvent.type(emailInput, "taro@example.com");
    await userEvent.click(submitButton);

    expect(
      screen.getByText("パスワードを入力してください。"),
    ).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("【正常系】ログイン成功時にtokenが保存され/homeに遷移すること", async () => {
    loginMock.mockResolvedValue({ token: "test-token" });

    render(<LoginPage />);

    const emailInput = screen.getByRole("textbox", {
      name: "メールアドレス",
    });
    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力");
    const submitButton = screen.getByRole("button", {
      name: "ログイン",
    });

    await userEvent.type(emailInput, "taro@example.com");
    await userEvent.type(passwordInput, "pass1234");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "taro@example.com",
        password: "pass1234",
      });
    });

    expect(localStorage.getItem("token")).toBe("test-token");
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("【異常系】ログイン失敗時はエラーメッセージが表示されること", async () => {
    loginMock.mockRejectedValue(new Error("invalid credentials"));

    render(<LoginPage />);

    const emailInput = screen.getByRole("textbox", {
      name: "メールアドレス",
    });
    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力");
    const submitButton = screen.getByRole("button", {
      name: "ログイン",
    });

    await userEvent.type(emailInput, "taro@example.com");
    await userEvent.type(passwordInput, "wrongpass");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("invalid credentials")).toBeTruthy();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("【正常系】新規登録画面へのリンク押下で/signupへ遷移できること", () => {
    render(<LoginPage />);

    const signupLink = screen.getByRole("link", {
      name: "こちら",
    });

    expect(signupLink.getAttribute("href")).toBe("/signup");
  });
});
