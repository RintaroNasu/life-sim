"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getHousehold,
  type HouseholdApiError,
  type HouseholdFormValues,
} from "@/lib/api/household";

const EMPTY_SIMULATION_VALUES: HouseholdFormValues = {
  income: 0,
  rent: 0,
  food: 0,
  savings: 0,
  transportation: 0,
  social_expense: 0,
  daily_goods: 0,
  utilities: 0,
  subscription_fee: 0,
};

const getCurrentYearMonth = () => {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

const hasStatus = (error: unknown): error is HouseholdApiError =>
  error instanceof Error && "status" in error;

const calculateMonthlyExpenses = (values: HouseholdFormValues) =>
  values.rent +
  values.food +
  values.transportation +
  values.social_expense +
  values.daily_goods +
  values.utilities +
  values.subscription_fee;

export const useSimulation = () => {
  const [{ year, month }] = useState(getCurrentYearMonth);
  const [baseValues, setBaseValues] =
    useState<HouseholdFormValues | null>(null);
  const [formValues, setFormValues] = useState<HouseholdFormValues>(
    EMPTY_SIMULATION_VALUES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    let isActive = true;

    const loadHousehold = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage("");

      try {
        const data = await getHousehold(token, year, month);

        if (!isActive) {
          return;
        }

        const initialValues = {
          income: data.income,
          rent: data.rent,
          food: data.food,
          savings: data.savings,
          transportation: data.transportation,
          social_expense: data.social_expense,
          daily_goods: data.daily_goods,
          utilities: data.utilities,
          subscription_fee: data.subscription_fee,
        };

        setBaseValues(initialValues);
        setFormValues(initialValues);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (hasStatus(error) && error.status === 404) {
          setBaseValues(null);
          setFormValues(EMPTY_SIMULATION_VALUES);
          setIsNotFound(true);
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "シミュレーション初期値の取得に失敗しました。",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadHousehold();

    return () => {
      isActive = false;
    };
  }, [month, year]);

  const handleAmountChange =
    (key: keyof HouseholdFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = Number(event.target.value);

      setFormValues((current) => ({
        ...current,
        [key]: Number.isNaN(numericValue)
          ? 0
          : Math.max(0, numericValue),
      }));
    };

  const baseMonthlyExpenses = useMemo(
    () => (baseValues ? calculateMonthlyExpenses(baseValues) : 0),
    [baseValues],
  );
  const baseMonthlyFreeAmount = useMemo(
    () =>
      baseValues
        ? baseValues.income - baseMonthlyExpenses - baseValues.savings
        : 0,
    [baseMonthlyExpenses, baseValues],
  );
  const monthlyExpenses = useMemo(
    () => calculateMonthlyExpenses(formValues),
    [formValues],
  );
  const monthlyFreeAmount = useMemo(
    () => formValues.income - monthlyExpenses - formValues.savings,
    [formValues, monthlyExpenses],
  );
  const yearlySavings = useMemo(
    () => formValues.savings * 12,
    [formValues.savings],
  );
  const yearlyFreeAmount = useMemo(
    () => monthlyFreeAmount * 12,
    [monthlyFreeAmount],
  );
  const monthlyAssetIncrease = useMemo(
    () => formValues.savings + monthlyFreeAmount,
    [formValues.savings, monthlyFreeAmount],
  );
  const baseMonthlyAssetIncrease = useMemo(
    () =>
      baseValues ? baseValues.savings + baseMonthlyFreeAmount : 0,
    [baseMonthlyFreeAmount, baseValues],
  );
  const yearlyAssetIncrease = useMemo(
    () => monthlyAssetIncrease * 12,
    [monthlyAssetIncrease],
  );
  const baseYearlyAssetIncrease = useMemo(
    () => baseMonthlyAssetIncrease * 12,
    [baseMonthlyAssetIncrease],
  );
  const fiveYearAssets = useMemo(
    () => yearlyAssetIncrease * 5,
    [yearlyAssetIncrease],
  );
  const fiveYearAssetsCurrent = useMemo(
    () => baseYearlyAssetIncrease * 5,
    [baseYearlyAssetIncrease],
  );
  const differenceFromCurrent = useMemo(
    () => fiveYearAssets - fiveYearAssetsCurrent,
    [fiveYearAssets, fiveYearAssetsCurrent],
  );

  const assetChartData = useMemo(
    () => [
      { label: "現在", current: 0, simulation: 0 },
      {
        label: "1年後",
        current: baseYearlyAssetIncrease,
        simulation: yearlyAssetIncrease,
      },
      {
        label: "3年後",
        current: baseYearlyAssetIncrease * 3,
        simulation: yearlyAssetIncrease * 3,
      },
      {
        label: "5年後",
        current: baseYearlyAssetIncrease * 5,
        simulation: yearlyAssetIncrease * 5,
      },
    ],
    [baseYearlyAssetIncrease, yearlyAssetIncrease],
  );

  const monthLabel = `${year}年${month}月`;

  return {
    year,
    month,
    monthLabel,
    isLoading,
    isNotFound,
    errorMessage,
    formValues,
    handleAmountChange,
    summary: {
      monthlyExpenses,
      monthlyFreeAmount,
      yearlySavings,
      yearlyFreeAmount,
      monthlyAssetIncrease,
      yearlyAssetIncrease,
      fiveYearAssets,
      differenceFromCurrent,
      baseMonthlyExpenses,
      baseMonthlyFreeAmount,
      baseMonthlyAssetIncrease,
      baseYearlyAssetIncrease,
      fiveYearAssetsCurrent,
    },
    assetChartData,
  };
};
