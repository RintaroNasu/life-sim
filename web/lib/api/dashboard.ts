export type ExpenseBreakdownItem = {
  label: string;
  value: number;
};

export type DashboardResponse = {
  year: number;
  month: number;
  income: number;
  total_expenses: number;
  free_amount: number;
  expense_breakdown: ExpenseBreakdownItem[];
};

type DashboardErrorResponse = {
  error?: {
    message?: string;
  };
};

export type DashboardApiError = Error & {
  status?: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const getDashboard = async (
  token: string,
): Promise<DashboardResponse> => {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | DashboardResponse
    | DashboardErrorResponse;

  if (!response.ok) {
    const error = new Error(
      "error" in data
        ? (data.error?.message ??
            "ダッシュボードデータの取得に失敗しました。")
        : "ダッシュボードデータの取得に失敗しました。",
    ) as DashboardApiError;

    error.status = response.status;

    throw error;
  }

  return data as DashboardResponse;
};
