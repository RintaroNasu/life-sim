"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useSimulationDetail } from "@/hooks/useSimulationDetail";

const currencyFormatter = new Intl.NumberFormat("ja-JP");
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function SimulationDetailPage() {
  const params = useParams<{ id: string }>();
  const simulationID = Number(params.id);
  const isInvalidID = Number.isNaN(simulationID) || simulationID < 1;
  const { simulation, isLoading, isNotFound, errorMessage } =
    useSimulationDetail(isInvalidID ? null : simulationID);

  const inputItems = useMemo(
    () =>
      simulation
        ? [
            { label: "手取り月収", value: simulation.income },
            { label: "家賃", value: simulation.rent },
            { label: "食費", value: simulation.food },
            { label: "交通費", value: simulation.transportation },
            { label: "交際費", value: simulation.social_expense },
            { label: "日用品", value: simulation.daily_goods },
            { label: "光熱費", value: simulation.utilities },
            {
              label: "サブスク費",
              value: simulation.subscription_fee,
            },
            { label: "貯金額", value: simulation.savings },
          ]
        : [],
    [simulation],
  );

  const resultItems = useMemo(
    () =>
      simulation
        ? [
            {
              label: "月間支出合計",
              value: simulation.monthly_expenses,
            },
            {
              label: "月間自由額",
              value: simulation.monthly_free_amount,
            },
            {
              label: "年間貯金額",
              value: simulation.yearly_savings,
            },
            {
              label: "年間自由額",
              value: simulation.yearly_free_amount,
            },
            {
              label: "月間資産増加額",
              value: simulation.monthly_asset_increase,
            },
            {
              label: "年間資産増加額",
              value: simulation.yearly_asset_increase,
            },
            {
              label: "5年後の累計資産",
              value: simulation.five_year_assets,
            },
          ]
        : [],
    [simulation],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)] lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/home"
            className="text-sm font-extrabold text-[#2563eb] transition hover:brightness-110"
          >
            一覧へ戻る
          </Link>
          <h1 className="mt-4 text-[2.2rem] font-extrabold text-[#16245d]">
            {simulation?.title || "シミュレーション詳細"}
          </h1>
          <p className="mt-2 text-base font-semibold text-slate-400">
            保存したシミュレーションの入力値と結果を確認できます
          </p>
        </div>

        {simulation ? (
          <div className="inline-flex items-center rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold text-[#16245d]">
            {dateFormatter.format(new Date(simulation.created_at))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-16 text-center text-base font-semibold text-slate-400 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
          シミュレーション詳細を読み込んでいます...
        </div>
      ) : null}

      {!isLoading && (isInvalidID || isNotFound) ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
          <h2 className="text-[1.7rem] font-extrabold text-[#16245d]">
            シミュレーションが見つかりません
          </h2>
          <p className="mt-3 text-base font-semibold text-slate-400">
            対象のシミュレーションが削除されたか、アクセスできない可能性があります。
          </p>
          <Link
            href="/home"
            className="mt-6 inline-flex h-13 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] px-6 text-base font-extrabold text-white transition hover:brightness-110"
          >
            ダッシュボードへ戻る
          </Link>
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

      {!isLoading && simulation ? (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(37,99,235,0.05)]">
              <p className="text-sm font-bold text-slate-400">
                月間自由額
              </p>
              <p className="mt-3 text-[2rem] font-extrabold text-[#16245d]">
                ¥
                {currencyFormatter.format(
                  simulation.monthly_free_amount,
                )}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(37,99,235,0.05)]">
              <p className="text-sm font-bold text-slate-400">
                年間貯金額
              </p>
              <p className="mt-3 text-[2rem] font-extrabold text-[#16245d]">
                ¥{currencyFormatter.format(simulation.yearly_savings)}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(37,99,235,0.05)]">
              <p className="text-sm font-bold text-slate-400">
                月間資産増加額
              </p>
              <p
                className={`mt-3 text-[2rem] font-extrabold ${
                  simulation.monthly_asset_increase < 0
                    ? "text-[#e11d48]"
                    : "text-[#22c55e]"
                }`}
              >
                ¥
                {currencyFormatter.format(
                  simulation.monthly_asset_increase,
                )}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(37,99,235,0.05)]">
              <p className="text-sm font-bold text-slate-400">
                5年後の累計資産
              </p>
              <p className="mt-3 text-[2rem] font-extrabold text-[#2563eb]">
                ¥
                {currencyFormatter.format(
                  simulation.five_year_assets,
                )}
              </p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
              <h2 className="text-[1.6rem] font-extrabold text-[#16245d]">
                入力値
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {inputItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-slate-400">
                      {item.label}
                    </span>
                    <span className="text-base font-extrabold text-[#16245d]">
                      ¥{currencyFormatter.format(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(37,99,235,0.06)]">
              <h2 className="text-[1.6rem] font-extrabold text-[#16245d]">
                計算結果
              </h2>
              <div className="mt-6 space-y-3">
                {resultItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-slate-400">
                      {item.label}
                    </span>
                    <span
                      className={`text-base font-extrabold ${
                        item.value < 0
                          ? "text-[#e11d48]"
                          : "text-[#16245d]"
                      }`}
                    >
                      ¥{currencyFormatter.format(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
