"use client";

import Link from "next/link";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { useDashboard } from "@/hooks/useDashboard";

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const summaryCards = [
  {
    key: "income",
    label: "手取り月収",
    accent: "bg-[#e8fbf3] text-[#22c55e]",
  },
  {
    key: "total_expenses",
    label: "毎月の支出",
    accent: "bg-[#fff0f1] text-[#ef4444]",
  },
  {
    key: "free_amount",
    label: "自由に使えるお金",
    accent: "bg-[#edf3ff] text-[#2563eb]",
  },
  {
    key: "savings",
    label: "貯金額",
    accent: "bg-[#f3ebff] text-[#8b5cf6]",
  },
] as const;

export default function HomePage() {
  const {
    dashboard,
    isLoading,
    isNotFound,
    errorMessage,
    monthLabel,
    savingsAmount,
    chartSegments,
    spendRate,
  } = useDashboard();

  const summaryValues = {
    income: dashboard?.income ?? 0,
    total_expenses: dashboard?.total_expenses ?? 0,
    free_amount: dashboard?.free_amount ?? 0,
    savings: savingsAmount,
  };
  const spendRateChartData = [
    { name: "支出率", value: spendRate, fill: "#2563eb" },
    {
      name: "残り",
      value: Math.max(0, 100 - spendRate),
      fill: "#dbe7ff",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)] lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[2.2rem] font-extrabold tracking-[-0.04em] text-[#16245d]">
            ダッシュボード
          </h1>
          <p className="mt-2 text-base font-semibold text-slate-400">
            今月の家計状況をひと目で確認できます
          </p>
        </div>

        <div className="inline-flex items-center rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold text-[#16245d]">
          {monthLabel}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-16 text-center text-base font-semibold text-slate-400 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
          ダッシュボードを読み込んでいます...
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-[28px] border border-red-200 bg-white px-8 py-10 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
          <p className="text-lg font-bold text-red-600">
            {errorMessage}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            時間を置いて再度お試しください。
          </p>
        </div>
      ) : null}

      {!isLoading && isNotFound ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
          <h2 className="text-[1.7rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
            今月の家計データがまだありません
          </h2>
          <p className="mt-3 text-base font-semibold text-slate-400">
            先に家計入力で今月の収支を保存すると、ダッシュボードに集計結果が表示されます。
          </p>
          <Link
            href="/household"
            className="mt-6 inline-flex h-13 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] px-6 text-base font-extrabold text-white transition hover:brightness-110"
          >
            家計入力へ進む
          </Link>
        </div>
      ) : null}

      {!isLoading && dashboard ? (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.key}
                className="rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(37,99,235,0.05)]"
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] text-sm font-extrabold ${card.accent}`}
                >
                  {card.label.slice(0, 1)}
                </div>
                <p className="mt-4 text-sm font-bold text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 text-[2rem] font-extrabold tracking-[-0.04em] text-[#16245d]">
                  ¥{currencyFormatter.format(summaryValues[card.key])}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(300px,1fr)]">
            <article className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
              <h2 className="text-[1.6rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
                支出の内訳
              </h2>
              <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
                <div className="mx-auto h-65 w-65">
                  <div className="relative h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartSegments}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={72}
                          outerRadius={102}
                          paddingAngle={3}
                          stroke="none"
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                        <span className="text-sm font-bold text-slate-400">
                          合計
                        </span>
                        <span className="mt-1 text-[1.7rem] font-extrabold tracking-[-0.04em] text-[#16245d]">
                          ¥
                          {currencyFormatter.format(
                            dashboard.total_expenses,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {chartSegments.length > 0 ? (
                    chartSegments.map((item) => (
                      <div
                        key={item.label}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-base font-bold text-[#16245d]">
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                          {item.percentage.toFixed(1)}%
                        </span>
                        <span className="text-base font-extrabold text-[#16245d]">
                          ¥{currencyFormatter.format(item.value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-base font-semibold text-slate-400">
                      支出データがまだないため、グラフは表示されません。
                    </p>
                  )}
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200/80 bg-white px-7 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
              <h2 className="text-[1.5rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
                生活余裕度
              </h2>
              <div className="mt-8 flex items-center justify-center">
                <div className="relative h-47.5 w-47.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendRateChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={95}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-[2.5rem] font-extrabold tracking-tighter text-[#16245d]">
                        {spendRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-center text-base font-bold text-[#16245d]">
                収入に対する支出の割合
              </p>
              <p className="mt-3 text-center text-sm font-semibold leading-7 text-slate-400">
                支出率が低いほど、自由に使える金額を確保しやすい状態です。
              </p>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
