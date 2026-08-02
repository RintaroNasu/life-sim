"use client";

import { useHousehold } from "@/hooks/useHousehold";

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const expenseFields = [
  {
    key: "rent",
    label: "家賃",
    accent: "bg-[#edf3ff] text-[#2563eb]",
  },
  {
    key: "social_expense",
    label: "交際費",
    accent: "bg-[#fff1e8] text-[#ff8a3d]",
  },
  {
    key: "utilities",
    label: "光熱費",
    accent: "bg-[#e8f8ff] text-[#0ea5e9]",
  },
  {
    key: "transportation",
    label: "交通費",
    accent: "bg-[#f3ebff] text-[#8b5cf6]",
  },
  {
    key: "food",
    label: "食費",
    accent: "bg-[#fff4e8] text-[#f59e0b]",
  },
  {
    key: "subscription_fee",
    label: "サブスク費",
    accent: "bg-[#eaf2ff] text-[#3b82f6]",
  },
  {
    key: "daily_goods",
    label: "日用品",
    accent: "bg-[#eff6ff] text-[#60a5fa]",
  },
  {
    key: "savings",
    label: "貯金額",
    accent: "bg-[#ecfdf3] text-[#22c55e]",
  },
] as const;

export default function HouseholdPage() {
  const {
    year,
    month,
    formValues,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    handleAmountChange,
    handleMonthShift,
    handleSave,
  } = useHousehold();

  const monthLabel = `${year}年${month}月`;
  const totalExpenses =
    formValues.rent +
    formValues.food +
    formValues.savings +
    formValues.transportation +
    formValues.social_expense +
    formValues.daily_goods +
    formValues.utilities +
    formValues.subscription_fee;
  const balance = formValues.income - totalExpenses;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)] lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[2.2rem] font-extrabold tracking-[-0.04em] text-[#16245d]">
            家計入力
          </h1>
          <p className="mt-2 text-base font-semibold text-slate-400">
            毎月の収支を入力して、あなたの家計を管理しましょう
          </p>
        </div>

        <div className="inline-flex items-center gap-3 self-start rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-3">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-xl font-bold text-slate-500 transition hover:border-[#2563eb] hover:text-[#2563eb]"
            onClick={() => handleMonthShift(-1)}
            disabled={isLoading || isSaving}
          >
            {"<"}
          </button>
          <div className="rounded-[16px] border border-slate-200 bg-white px-6 py-3 text-base font-bold text-[#16245d]">
            {monthLabel}
          </div>
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-xl font-bold text-slate-500 transition hover:border-[#2563eb] hover:text-[#2563eb]"
            onClick={() => handleMonthShift(1)}
            disabled={isLoading || isSaving}
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
        <div className="space-y-7">
          <section className="rounded-[24px] border border-slate-200/80 px-6 py-6">
            <h2 className="text-[1.8rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
              収入
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-[180px_minmax(0,280px)] md:items-center">
              <p className="text-lg font-bold text-[#16245d]">
                手取り月収
              </p>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-lg font-bold text-slate-400">
                  ¥
                </span>
                <input
                  type="number"
                  min="0"
                  value={formValues.income}
                  onChange={handleAmountChange("income")}
                  disabled={isLoading || isSaving}
                  className="h-15 w-full rounded-[18px] border border-slate-200 bg-white pl-12 pr-5 text-right text-2xl font-extrabold text-[#16245d] outline-none transition focus:border-[#2563eb]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200/80 px-6 py-6">
            <h2 className="text-[1.8rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
              支出項目
            </h2>
            <div className="mt-6 grid gap-x-10 gap-y-5 xl:grid-cols-2">
              {expenseFields.map((field) => (
                <div
                  key={field.key}
                  className="grid gap-4 md:grid-cols-[180px_minmax(0,220px)] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] text-sm font-extrabold ${field.accent}`}
                    >
                      {field.label.slice(0, 1)}
                    </span>
                    <span className="text-base font-bold text-[#16245d]">
                      {field.label}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-bold text-slate-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formValues[field.key]}
                      onChange={handleAmountChange(field.key)}
                      disabled={isLoading || isSaving}
                      className="h-14 w-full rounded-[16px] border border-slate-200 bg-white pl-10 pr-4 text-right text-xl font-bold text-[#16245d] outline-none transition focus:border-[#2563eb]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#dce7ff] bg-[#f6f9ff] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-[#16245d]">
                  収支合計
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  収入から支出項目を差し引いた残額です
                </p>
              </div>
              <p
                className={`text-[2rem] font-extrabold tracking-[-0.04em] ${
                  balance >= 0 ? "text-[#2563eb]" : "text-[#e11d48]"
                }`}
              >
                ¥{currencyFormatter.format(balance)}
              </p>
            </div>
          </section>

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
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="h-16 w-full rounded-[20px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] text-xl font-extrabold tracking-[-0.03em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "読み込み中..."
              : isSaving
                ? "保存中..."
                : "保存する"}
          </button>
        </div>
      </div>
    </section>
  );
}
