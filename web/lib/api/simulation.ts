export type SaveSimulationRequest = {
  title: string;
  income: number;
  rent: number;
  food: number;
  transportation: number;
  social_expense: number;
  daily_goods: number;
  utilities: number;
  subscription_fee: number;
  savings: number;
  monthly_expenses: number;
  monthly_free_amount: number;
  yearly_savings: number;
  yearly_free_amount: number;
  monthly_asset_increase: number;
  yearly_asset_increase: number;
  five_year_assets: number;
};

export type SimulationResponse = SaveSimulationRequest & {
  id: number;
  created_at: string;
  updated_at: string;
};

type SimulationErrorResponse = {
  error?: {
    message?: string;
  };
};

export type SimulationApiError = Error & {
  status?: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const buildApiError = (
  message: string,
  status: number,
): SimulationApiError => {
  const error = new Error(message) as SimulationApiError;

  error.status = status;

  return error;
};

export const saveSimulation = async (
  token: string,
  input: SaveSimulationRequest,
): Promise<SimulationResponse> => {
  const response = await fetch(`${API_BASE_URL}/simulations`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as
    | SimulationResponse
    | SimulationErrorResponse;

  if (!response.ok) {
    throw buildApiError(
      "error" in data
        ? (data.error?.message ??
            "シミュレーションの保存に失敗しました。")
        : "シミュレーションの保存に失敗しました。",
      response.status,
    );
  }

  return data as SimulationResponse;
};
