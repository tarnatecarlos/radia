/** Client-side API helper — replaces direct Supabase calls */
export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || res.statusText || "Request failed");
  }

  return body as T;
}
