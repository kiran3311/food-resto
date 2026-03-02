import { api } from "./api";
import { AuthResponse, User } from "../types";
import { clearAccessToken, setAccessToken } from "./tokenService";

interface Credentials {
  email: string;
  password: string;
}

interface RegisterPayload extends Credentials {
  name: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", payload);
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  async login(payload: Credentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  async me(): Promise<User> {
    const response = await api.get<{ user: User }>("/auth/me");
    return response.data.user;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout", {});
    clearAccessToken();
  }
};