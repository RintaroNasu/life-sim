"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSimulation } from "@/hooks/useSimulation";
import type { HouseholdFormValues } from "@/lib/api/household";

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const sliderTrackColors: Record<string, string> = {
  income: "#2c6cff",
  rent: "#4f8cff",
  food: "#34d399",
  transportation: "#8b5cf6",
  social_expense: "#fb923c",
  daily_goods: "#60a5fa",
  utilities: "#22c55e",
  subscription_fee: "#ec4899",
  savings: "#06b6d4",
};

const sliderFields: Array<{
  key: keyof HouseholdFormValues;
  label: string;
  min: number;
  max: number;
  step: number;
  accent: string;
}> = [
  {
    key: "income",
    label: "手取り月収",
    min: 100000,
    max: 800000,
    step: 5000,
    accent: "from-[#2c6cff] to-[#5a93ff]",
  },
  {
    key: "rent",
    label: "家賃",
    min: 0,
    max: 200000,
    step: 5000,
    accent: "from-[#4f8cff] to-[#8cb7ff]",
  },
  {
    key: "food",
    label: "食費",
    min: 0,
    max: 100000,
    step: 5000,
    accent: "from-[#34d399] to-[#74e7bf]",
  },
  {
    key: "transportation",
    label: "交通費",
    min: 0,
    max: 50000,
    step: 1000,
    accent: "from-[#8b5cf6] to-[#b699ff]",
  },
  {
    key: "social_expense",
    label: "交際費",
    min: 0,
    max: 80000,
    step: 5000,
    accent: "from-[#fb923c] to-[#ffc078]",
  },
  {
    key: "daily_goods",
    label: "日用品",
    min: 0,
    max: 50000,
    step: 1000,
    accent: "from-[#60a5fa] to-[#94c5ff]",
  },
  {
    key: "utilities",
    label: "光熱費",
    min: 0,
    max: 50000,
    step: 1000,
    accent: "from-[#22c55e] to-[#74dd96]",
  },
  {
    key: "subscription_fee",
    label: "サブスク費",
    min: 0,
    max: 50000,
    step: 1000,
    accent: "from-[#ec4899] to-[#f78ec0]",
  },
  {
    key: "savings",
    label: "貯金額",
    min: 0,
    max: 150000,
    step: 5000,
    accent: "from-[#06b6d4] to-[#67d5e8]",
  },
];

const summaryCards = [
  {
    key: "monthlyFreeAmount",
    label: "月間自由額",
    accent: "bg-[#edf3ff] text-[#2563eb]",
  },
  {
    key: "yearlySavings",
    label: "年間貯金額",
    accent: "bg-[#ecfdf3] text-[#22c55e]",
  },
  {
    key: "yearlyFreeAmount",
    label: "年間自由額",
    accent: "bg-[#edf3ff] text-[#2563eb]",
  },
  {
    key: "fiveYearAssets",
    label: "5年後の累計資産",
    accent: "bg-[#fff4e8] text-[#f59e0b]",
  },
] as const;

export default function SimulationPage() {
  const {
    monthLabel,
    isLoading,
    isNotFound,
    errorMessage,
    saveErrorMessage,
    saveSuccessMessage,
    isSaving,
    title,
    formValues,
    handleTitleChange,
    handleAmountChange,
    handleSave,
    summary,
    assetChartData,
  } = useSimulation();

  const summaryValues = {
    monthlyFreeAmount: summary.monthlyFreeAmount,
    yearlySavings: summary.yearlySavings,
    yearlyFreeAmount: summary.yearlyFreeAmount,
    fiveYearAssets: summary.fiveYearAssets,
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)] lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[2.2rem] font-extrabold tracking-[-0.04em] text-[#16245d]">
            シミュレーションを作成
          </h1>
          <p className="mt-2 text-base font-semibold text-slate-400">
            今の家計をもとに、収支を調整しながら将来の貯金推移を確認できます
          </p>
        </div>

        <div className="inline-flex items-center rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold text-[#16245d]">
          {monthLabel}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-16 text-center text-base font-semibold text-slate-400 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
          シミュレーション初期値を読み込んでいます...
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
            シミュレーションの元になる家計データがまだありません
          </h2>
          <p className="mt-3 text-base font-semibold text-slate-400">
            先に家計入力で今月の収支を保存すると、現在の生活をもとに比較できます。
          </p>
          <Link
            href="/household"
            className="mt-6 inline-flex h-13 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] px-6 text-base font-extrabold text-white transition hover:brightness-110"
          >
            家計入力へ進む
          </Link>
        </div>
      ) : null}

      {!isLoading && !errorMessage && !isNotFound ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <article className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
              <h2 className="text-[1.6rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
                収支を調整
              </h2>
              <div className="mt-8">
                <label className="block">
                  <span className="text-sm font-bold text-[#16245d]">
                    シミュレーション名
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="例: 固定費見直しプラン"
                    className="mt-3 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-[#16245d] outline-none transition placeholder:text-slate-300 focus:border-[#2c6cff]"
                  />
                </label>
              </div>

              <div className="mt-8 space-y-7">
                {sliderFields.map((field) => (
                  <section
                    key={field.key}
                    className="rounded-[22px] border border-slate-200/80 px-5 py-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-base font-bold text-[#16245d]">
                          {field.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-400">
                          範囲: ¥{currencyFormatter.format(field.min)}{" "}
                          - ¥{currencyFormatter.format(field.max)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-lg font-extrabold tracking-[-0.03em] text-[#16245d]">
                        ¥
                        {currencyFormatter.format(
                          formValues[field.key],
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      {(() => {
                        const percent =
                          ((formValues[field.key] - field.min) /
                            (field.max - field.min)) *
                          100;

                        return (
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={formValues[field.key]}
                        onChange={handleAmountChange(field.key)}
                        style={{
                          ["--slider-thumb-color" as string]:
                            sliderTrackColors[field.key],
                          background: `linear-gradient(90deg, ${sliderTrackColors[field.key]} 0%, ${sliderTrackColors[field.key]} ${percent}%, #dbe3f3 ${percent}%, #dbe3f3 100%)`,
                        }}
                        className="simulation-slider h-3 w-full cursor-pointer appearance-none rounded-full"
                      />
                        );
                      })()}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-8">
                {saveErrorMessage ? (
                  <p className="mb-3 text-sm font-bold text-red-600">
                    {saveErrorMessage}
                  </p>
                ) : null}
                {saveSuccessMessage ? (
                  <p className="mb-3 text-sm font-bold text-[#16a34a]">
                    {saveSuccessMessage}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex h-13 w-full items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] px-6 text-base font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "保存中..." : "シミュレーションを保存"}
                </button>
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
              <h2 className="text-[1.6rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
                シミュレーション結果
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                    <p className="mt-2 text-[1.9rem] font-extrabold tracking-[-0.04em] text-[#16245d]">
                      ¥
                      {currencyFormatter.format(
                        summaryValues[card.key],
                      )}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-[#dce7ff] bg-[#f6f9ff] px-6 py-6">
                <h3 className="text-lg font-extrabold text-[#16245d]">
                  毎月の比較
                </h3>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-400">
                      現在の月間自由額
                    </span>
                    <span className="text-lg font-extrabold text-[#16245d]">
                      ¥
                      {currencyFormatter.format(
                        summary.baseMonthlyFreeAmount,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-400">
                      月間資産増加額
                    </span>
                    <span
                      className={`text-lg font-extrabold ${
                        summary.monthlyAssetIncrease < 0
                          ? "text-[#e11d48]"
                          : "text-[#22c55e]"
                      }`}
                    >
                      ¥
                      {currencyFormatter.format(
                        summary.monthlyAssetIncrease,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-400">
                      現在の5年後累計資産
                    </span>
                    <span className="text-lg font-extrabold text-[#16245d]">
                      ¥
                      {currencyFormatter.format(
                        summary.fiveYearAssetsCurrent,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
            <h2 className="text-[1.6rem] font-extrabold tracking-[-0.03em] text-[#16245d]">
              資産推移シミュレーション
            </h2>
            <p className="mt-2 text-base font-semibold text-slate-400">
              現在の生活パターンと、調整後のパターンを5年スパンで比較できます
            </p>

            <div className="mt-8 h-90 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={assetChartData}
                  margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="#e7eefc"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `¥${currencyFormatter.format(value)}`
                    }
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const amount =
                        typeof value === "number"
                          ? value
                          : Number(value);

                      return `¥${currencyFormatter.format(amount)}`;
                    }}
                    contentStyle={{
                      borderRadius: 18,
                      borderColor: "#dbe7ff",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="simulation"
                    name="このシミュレーション"
                    stroke="#2563eb"
                    strokeWidth={4}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="現在の生活"
                    stroke="#94a3b8"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </>
      ) : null}

      <style jsx global>{`
        .simulation-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          border: 4px solid #ffffff;
          background: var(--slider-thumb-color, #2563eb);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
        }

        .simulation-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          border: 4px solid #ffffff;
          background: var(--slider-thumb-color, #2563eb);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
        }
      `}</style>
    </section>
  );
}
