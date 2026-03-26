const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://seeneyu.vercel.app';

type RequestOptions = {
  token?: string | null;
  headers?: Record<string, string>;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export async function apiGet<T = unknown>(
  path: string,
  token?: string | null
): Promise<T> {
  return request<T>('GET', path, undefined, { token });
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  return request<T>('POST', path, body, { token });
}

export async function apiPatch<T = unknown>(
  path: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  return request<T>('PATCH', path, body, { token });
}

export async function apiDelete<T = unknown>(
  path: string,
  token?: string | null
): Promise<T> {
  return request<T>('DELETE', path, undefined, { token });
}
