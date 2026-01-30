import { cookies } from "next/headers";

import { createClient } from "@/lib/api/generated/client";
import { refreshToken } from "@/lib/api/generated/sdk.gen";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshTokenCookie = cookieStore.get("refreshToken");

  if (!refreshTokenCookie) {
    return false;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const client = createClient({
      baseUrl,
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("Cookie", `refreshToken=${refreshTokenCookie.value}`);
        return fetch(input, { ...init, headers });
      },
    });

    const response = await refreshToken({ client });
    return !!response.data?.accessToken;
  } catch {
    return false;
  }
}
