const API_BASE = '';

type ApiError = Error & { suggestions?: string[] };

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message ?? 'Ошибка запроса') as ApiError;
    error.suggestions = payload.suggestions;
    throw error;
  }

  return payload as T;
}
