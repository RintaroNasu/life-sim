"use client";

import { useEffect, useState } from "react";
import {
  getHousehold,
  type HouseholdApiError,
  type HouseholdFormValues,
  saveHousehold,
} from "@/lib/api/household";

export const EMPTY_FORM_VALUES: HouseholdFormValues = {
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

export const useHousehold = () => {
  const [{ year, month }, setSelectedMonth] = useState(
    getCurrentYearMonth,
  );
  const [formValues, setFormValues] =
    useState<HouseholdFormValues>(EMPTY_FORM_VALUES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    let isActive = true;

    const loadHousehold = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const data = await getHousehold(token, year, month);

        if (!isActive) {
          return;
        }

        setFormValues({
          income: data.income,
          rent: data.rent,
          food: data.food,
          savings: data.savings,
          transportation: data.transportation,
          social_expense: data.social_expense,
          daily_goods: data.daily_goods,
          utilities: data.utilities,
          subscription_fee: data.subscription_fee,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (hasStatus(error) && error.status === 404) {
          setFormValues(EMPTY_FORM_VALUES);
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "家計データの取得に失敗しました。",
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

  const handleMonthShift = (direction: -1 | 1) => {
    setSelectedMonth((current) => {
      const nextMonth = current.month + direction;

      if (nextMonth < 1) {
        return {
          year: current.year - 1,
          month: 12,
        };
      }

      if (nextMonth > 12) {
        return {
          year: current.year + 1,
          month: 1,
        };
      }

      return {
        year: current.year,
        month: nextMonth,
      };
    });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await saveHousehold(
        token,
        year,
        month,
        formValues,
      );

      setFormValues({
        income: data.income,
        rent: data.rent,
        food: data.food,
        savings: data.savings,
        transportation: data.transportation,
        social_expense: data.social_expense,
        daily_goods: data.daily_goods,
        utilities: data.utilities,
        subscription_fee: data.subscription_fee,
      });
      setSuccessMessage("家計データを保存しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "家計データの保存に失敗しました。",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
};
