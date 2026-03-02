let accessToken: string | null = localStorage.getItem("accessToken");

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string): void => {
  accessToken = token;
  localStorage.setItem("accessToken", token);
};

export const clearAccessToken = (): void => {
  accessToken = null;
  localStorage.removeItem("accessToken");
};