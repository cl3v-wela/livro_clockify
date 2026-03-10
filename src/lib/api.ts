const api = window.electronAPI;

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export async function apiCall<T = any>(
  path: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  return api.apiCall(path, options);
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await apiCall<T>(path);
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await apiCall<T>(path, { method: "POST", body });
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const res = await apiCall<T>(path, { method: "PUT", body });
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const res = await apiCall<T>(path, { method: "DELETE" });
  if (!res.ok) throw new Error(res.error || `API error: ${res.status}`);
  return res.data;
}
