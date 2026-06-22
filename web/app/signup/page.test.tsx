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
import SignupPage from "./page";

const pushMock = vi.fn();
const signupMock = vi.fn();

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
  signup: (...args: unknown[]) => signupMock(...args),
}));

describe("SignupPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    signupMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("【異常系】名前未入力で送信した場合はバリデーションエラーが表示されること", async () => {
    render(<SignupPage />);

    const submitButton = screen.getByRole("button", {
      name: "新規登録",
    });

    await userEvent.click(submitButton);

    expect(
      screen.getByText("ユーザー名を入力してください。"),
    ).toBeTruthy();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it("【異常系】メールアドレス未入力で送信した場合はバリデーションエラーが表示されること", async () => {
    render(<SignupPage />);

    const nameInput = screen.getByRole("textbox", {
      name: "ユーザー名",
    });
    const submitButton = screen.getByRole("button", {
      name: "新規登録",
    });

    await userEvent.type(nameInput, "山田 太郎");
    await userEvent.click(submitButton);

    expect(
      screen.getByText("メールアドレスを入力してください。"),
    ).toBeTruthy();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it("【異常系】パスワード未入力で送信した場合はバリデーションエラーが表示されること", async () => {
    render(<SignupPage />);

    const nameInput = screen.getByRole("textbox", {
      name: "ユーザー名",
    });
    const emailInput = screen.getByRole("textbox", {
      name: "メールアドレス",
    });
    const submitButton = screen.getByRole("button", {
      name: "新規登録",
    });

    await userEvent.type(nameInput, "山田 太郎");
    await userEvent.type(emailInput, "taro@example.com");
    await userEvent.click(submitButton);

    expect(
      screen.getByText("パスワードを入力してください。"),
    ).toBeTruthy();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it("【正常系】新規登録成功時にtokenが保存され/homeに遷移すること", async () => {
    signupMock.mockResolvedValue({ token: "signup-token" });

    render(<SignupPage />);

    const nameInput = screen.getByRole("textbox", {
      name: "ユーザー名",
    });
    const emailInput = screen.getByRole("textbox", {
      name: "メールアドレス",
    });
    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力");
    const submitButton = screen.getByRole("button", {
      name: "新規登録",
    });

    await userEvent.type(nameInput, "山田 太郎");
    await userEvent.type(emailInput, "taro@example.com");
    await userEvent.type(passwordInput, "pass1234");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith({
        name: "山田 太郎",
        email: "taro@example.com",
        password: "pass1234",
      });
    });

    expect(localStorage.getItem("token")).toBe("signup-token");
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("【異常系】新規登録失敗時はエラーメッセージが表示されること", async () => {
    signupMock.mockRejectedValue(new Error("email already exists"));

    render(<SignupPage />);

    const nameInput = screen.getByRole("textbox", {
      name: "ユーザー名",
    });
    const emailInput = screen.getByRole("textbox", {
      name: "メールアドレス",
    });
    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力");
    const submitButton = screen.getByRole("button", {
      name: "新規登録",
    });

    await userEvent.type(nameInput, "山田 太郎");
    await userEvent.type(emailInput, "taro@example.com");
    await userEvent.type(passwordInput, "pass1234");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("email already exists")).toBeTruthy();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("【正常系】ログイン画面へのリンク押下で/loginへ遷移できること", () => {
    render(<SignupPage />);

    const loginLink = screen.getByRole("link", {
      name: "こちら",
    });

    expect(loginLink.getAttribute("href")).toBe("/login");
  });
});
