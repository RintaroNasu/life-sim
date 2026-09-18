"use client";

import { useEffect, useState } from "react";
import {
  getSimulationDetail,
  type SimulationApiError,
  type SimulationResponse,
} from "@/lib/api/simulation";

const hasStatus = (error: unknown): error is SimulationApiError =>
  error instanceof Error && "status" in error;

export const useSimulationDetail = (id: number | null) => {
  const [simulation, setSimulation] =
    useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !id) {
      return;
    }

    let isActive = true;

    const loadSimulationDetail = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage("");

      try {
        const data = await getSimulationDetail(token, id);

        if (!isActive) {
          return;
        }

        setSimulation(data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (hasStatus(error) && error.status === 404) {
          setSimulation(null);
          setIsNotFound(true);
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "シミュレーション詳細の取得に失敗しました。",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadSimulationDetail();

    return () => {
      isActive = false;
    };
  }, [id]);

  return {
    simulation,
    isLoading,
    isNotFound,
    errorMessage,
  };
};
