const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

const inferServerUrl = (): string => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch (_error: unknown) {
    return API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");
  }
};

const SERVER_URL = (import.meta.env.VITE_SERVER_URL ?? inferServerUrl()).replace(/\/$/, "");

export const resolveMediaUrl = (path?: string): string => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${SERVER_URL}${path}`;
  }

  return `${SERVER_URL}/${path}`;
};
