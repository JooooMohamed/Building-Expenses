import client from "./client";
import { setSecureItem, deleteSecureItem } from "../utils/secureStorage";
import type { User } from "../types";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await client.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  await setSecureItem("accessToken", data.accessToken);
  await setSecureItem("refreshToken", data.refreshToken);

  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await client.post("/auth/logout");
  } finally {
    await deleteSecureItem("accessToken");
    await deleteSecureItem("refreshToken");
  }
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>("/auth/me");
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await client.post("/auth/change-password", { currentPassword, newPassword });
}
