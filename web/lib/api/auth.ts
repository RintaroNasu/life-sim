export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const login = async (
  input: LoginRequest,
): Promise<LoginResponse & ApiErrorResponse> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as LoginResponse &
    ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        "ログインに失敗しました。時間を置いて再度お試しください。",
    );
  }

  return data;
};

export const signup = async (
  input: SignupRequest,
): Promise<LoginResponse & ApiErrorResponse> => {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as LoginResponse &
    ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        "新規登録に失敗しました。時間を置いて再度お試しください。",
    );
  }

  return data;
};
