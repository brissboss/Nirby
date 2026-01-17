import { createClient } from "./generated/client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const apiClient = createClient({
  baseUrl,
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});

let currentAccessToken: string | null = null;
let refreshTokenFn: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function setRefreshTokenFn(fn: () => Promise<string | null>) {
  refreshTokenFn = fn;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

apiClient.interceptors.request.use((request) => {
  if (currentAccessToken) {
    request.headers.set("Authorization", `Bearer ${currentAccessToken}`);
  }

  return request;
});

apiClient.interceptors.response.use(async (response, request, options) => {
  const authRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/resend-verification",
  ];

  const isAuthRoute = authRoutes.some((route) => request.url.includes(route));
  if (response.status === 401 && currentAccessToken && !isAuthRoute && refreshTokenFn) {
    try {
      const newToken = await refreshTokenFn();
      if (newToken) {
        const retryHeaders = new Headers(request.headers);
        retryHeaders.set("Authorization", `Bearer ${newToken}`);

        const retryInit: RequestInit = {
          method: request.method,
          headers: retryHeaders,
          credentials: "include",
        };

        if (options?.body !== undefined && request.method !== "GET") {
          retryInit.body = options.body as BodyInit;
        }

        const retryResponse = await fetch(request.url, retryInit);
        return retryResponse;
      }
    } catch {
      setAccessToken(null);
    }
  }
  return response;
});

export default apiClient;
