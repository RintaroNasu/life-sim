"use client";

import { useEffect, useState } from "react";
import {
  getSimulations,
  type SimulationApiError,
  type SimulationListItemResponse,
} from "@/lib/api/simulation";

const hasStatus = (error: unknown): error is SimulationApiError =>
  error instanceof Error && "status" in error;

export const useSimulations = () => {
  const [simulations, setSimulations] = useState<
    SimulationListItemResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    let isActive = true;

    const loadSimulations = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await getSimulations(token);

        if (!isActive) {
          return;
        }

        setSimulations(data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (hasStatus(error) && error.status === 401) {
          setErrorMessage(
            "ログイン状態を確認できませんでした。再度ログインしてください。",
          );
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "シミュレーション一覧の取得に失敗しました。",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadSimulations();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    simulations,
    isLoading,
    errorMessage,
  };
};
