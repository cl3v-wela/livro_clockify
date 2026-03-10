import type { ApiResponse } from "@/lib/ipc";

const api = window.electronAPI;

export async function apiCall<T = unknown>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  return api.apiCall(path, options as Record<string, unknown>) as Promise<
    ApiResponse<T>
  >;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiCall<T>(path);
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await apiCall<T>(path, { method: "POST", body });
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}

export async function apiPut<T = unknown>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await apiCall<T>(path, { method: "PUT", body });
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await apiCall<T>(path, { method: "DELETE" });
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}
