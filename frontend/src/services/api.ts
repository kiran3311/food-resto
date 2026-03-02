import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenService";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queuedRequests: Array<(token: string) => void> = [];

const resolveQueue = (token: string): void => {
  queuedRequests.forEach((callback) => callback(token));
  queuedRequests = [];
};

const refreshToken = async (): Promise<string> => {
  const response = await refreshClient.post("/auth/refresh", {});
  const token = response.data.accessToken as string;
  setAccessToken(token);
  return token;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryRequestConfig | undefined;
    if (!request || !error.response || error.response.status !== 401 || request._retry) {
      return Promise.reject(error);
    }

    if (request.url?.includes("/auth/login") || request.url?.includes("/auth/register")) {
      return Promise.reject(error);
    }

    request._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        queuedRequests.push((token: string) => {
          request.headers.Authorization = `Bearer ${token}`;
          resolve(api(request));
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshToken();
      resolveQueue(newToken);
      request.headers.Authorization = `Bearer ${newToken}`;
      return api(request);
    } catch (refreshError: unknown) {
      clearAccessToken();
      queuedRequests = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);