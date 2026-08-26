"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDashboard,
  type DashboardApiError,
  type DashboardResponse,
  type ExpenseBreakdownItem,
} from "@/lib/api/dashboard";

type ChartSegment = ExpenseBreakdownItem & {
  fill: string;
  percentage: number;
};

const chartColors = [
  "#4f8cff",
  "#5fd3a8",
  "#ffb648",
  "#9d7df6",
  "#fb8e52",
  "#7fc6ff",
  "#3ac3ea",
  "#8be28d",
];

const hasStatus = (error: unknown): error is DashboardApiError =>
  error instanceof Error && "status" in error;

export const useDashboard = () => {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    let isActive = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage("");

      try {
        const data = await getDashboard(token);

        if (!isActive) {
          return;
        }

        setDashboard(data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (hasStatus(error) && error.status === 404) {
          setDashboard(null);
          setIsNotFound(true);
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "ダッシュボードデータの取得に失敗しました。",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const monthLabel = useMemo(() => {
    if (dashboard) {
      return `${dashboard.year}年${dashboard.month}月`;
    }

    const now = new Date();

    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }, [dashboard]);

  const savingsAmount = useMemo(
    () =>
      dashboard?.expense_breakdown.find(
        (item) => item.label === "貯金額",
      )?.value ?? 0,
    [dashboard],
  );

  const chartSegments = useMemo(() => {
    if (!dashboard || dashboard.total_expenses === 0) {
      return [] as ChartSegment[];
    }

    return dashboard.expense_breakdown
      .filter((item) => item.value > 0)
      .map((item, index) => ({
        ...item,
        fill: chartColors[index % chartColors.length],
        percentage: (item.value / dashboard.total_expenses) * 100,
      }));
  }, [dashboard]);

  const spendRate = useMemo(() => {
    if (!dashboard || dashboard.income <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((dashboard.total_expenses / dashboard.income) * 100),
    );
  }, [dashboard]);

  return {
    dashboard,
    isLoading,
    isNotFound,
    errorMessage,
    monthLabel,
    savingsAmount,
    chartSegments,
    spendRate,
  };
};
