"use client";

import { login } from "@/lib/api/auth";
import { SyntheticEvent, useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }

    if (!password) {
      setErrorMessage("パスワードを入力してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await login({
        email,
        password,
      });

      localStorage.setItem("token", data.token);

      setSuccessMessage(
        "ログインに成功しました。次の画面実装後に遷移処理を追加します。",
      );
      setPassword("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "サーバーに接続できませんでした。バックエンドが起動しているか確認してください。",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex h-screen items-center justify-center bg-[#eef3ff] px-4 py-4 text-slate-900">
      <section className="flex w-full max-w-190 items-center justify-center rounded-[28px] border border-slate-200/80 bg-white px-6 py-10">
        <div className="w-full max-w-140">
          <div className="mb-10">
            <p className="mb-3 font-bold uppercase tracking-[0.18em] text-[#2563eb]">
              LifeSim
            </p>
            <h2 className="text-[2.2rem] font-extrabold text-[#16245d]">
              ログイン
            </h2>
          </div>

          <form className="space-y-7" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-3 block text-lg font-extrabold tracking-[-0.02em] text-[#16245d]">
                メールアドレス
              </span>
              <input
                className="h-16 w-full rounded-[18px] border border-[#e3e8f3] bg-white px-6 text-lg
                  text-slate-700  placeholder:text-slate-300 focus:border-[#2563eb]"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </label>

            <label className="block">
              <span className="mb-3 block font-extrabold tracking-[-0.02em] text-[#16245d]">
                パスワード
              </span>
              <div className="relative">
                <input
                  className="h-16 w-full rounded-[18px] border border-[#e3e8f3] bg-white px-6 pr-16 
                    text-lg text-slate-700  placeholder:text-slate-300 focus:border-[#2563eb] "
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="パスワードを入力"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-5 flex items-center text-slate-400 transition hover:text-slate-600"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "パスワードを非表示にする"
                      : "パスワードを表示する"
                  }
                  disabled={isSubmitting}
                >
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </label>

            {errorMessage ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <button
              className="mt-2 h-16 w-full rounded-[18px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] text-xl font-extrabold tracking-[-0.03em] text-white  hover:brightness-150 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p className="mt-10 text-center text-base font-semibold text-slate-500">
            アカウントをお持ちでない方は
            <a
              href="/signup"
              className="ml-1 font-extrabold text-[#2563eb] hover:underline"
            >
              こちら
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
