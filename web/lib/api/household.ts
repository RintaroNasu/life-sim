export type HouseholdFormValues = {
  income: number;
  rent: number;
  food: number;
  savings: number;
  transportation: number;
  social_expense: number;
  daily_goods: number;
  utilities: number;
  subscription_fee: number;
};

export type HouseholdResponse = HouseholdFormValues & {
  id: number;
  year: number;
  month: number;
};

type HouseholdErrorResponse = {
  error?: {
    message?: string;
  };
};

export type HouseholdApiError = Error & {
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
): HouseholdApiError => {
  const error = new Error(message) as HouseholdApiError;

  error.status = status;

  return error;
};

export const getHousehold = async (
  token: string,
  year: number,
  month: number,
): Promise<HouseholdResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/households/${year}/${month}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as
    | HouseholdResponse
    | HouseholdErrorResponse;

  if (!response.ok) {
    throw buildApiError(
      "error" in data
        ? (data.error?.message ?? "家計データの取得に失敗しました。")
        : "家計データの取得に失敗しました。",
      response.status,
    );
  }

  return data as HouseholdResponse;
};

export const saveHousehold = async (
  token: string,
  year: number,
  month: number,
  input: HouseholdFormValues,
): Promise<HouseholdResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/households/${year}/${month}`,
    {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(input),
    },
  );

  const data = (await response.json()) as
    | HouseholdResponse
    | HouseholdErrorResponse;

  if (!response.ok) {
    throw buildApiError(
      "error" in data
        ? (data.error?.message ?? "家計データの保存に失敗しました。")
        : "家計データの保存に失敗しました。",
      response.status,
    );
  }

  return data as HouseholdResponse;
};
