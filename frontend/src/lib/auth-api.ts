import api from "@/lib/api";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: AuthUser;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
}

export async function loginUser(
  credentials: AuthCredentials,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", credentials);

  return data;
}

export async function registerUser(
  details: RegisterData,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", details);

  return data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<{
    success: boolean;
    user: AuthUser;
  }>("/auth/me");

  return data.user;
}
