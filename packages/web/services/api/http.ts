/**
 * Raw JSON HTTP client for the komunify API surface (docs/API_SPEC.md).
 *
 * Deliberately separate from `./client.ts` (`ApiClient`): that client wraps every
 * response in an `{ success, data, error }` envelope, but `API_SPEC.md` returns
 * flat JSON bodies (`{ nonce: "..." }`, `{ address, isManager }`, etc.) and signals
 * failure via HTTP status + a `{ code }` body, not an envelope field. `ApiClient`
 * predates komunify (pre-existing `services/users/` scaffold still uses it) — left
 * alone rather than reshaped to fit a different response contract out from under it.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Thrown on any non-2xx response. `code` is the API's machine-readable error code, when present. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    // Sends the kmf_session cookie cross-origin (D-001).
    credentials: 'include',
    headers: {
      ...(options?.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options?.headers,
    },
  });

  const body = await parseBody(response);

  if (!response.ok) {
    const b = (body ?? {}) as { code?: string; error?: string; message?: string };
    throw new ApiError(
      response.status,
      b.code,
      b.error ?? b.message ?? `Request failed with status ${response.status}`,
    );
  }

  return body as T;
}

export const ApiHttp = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
  },
  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  postForm<T>(endpoint: string, form: FormData): Promise<T> {
    return request<T>(endpoint, { method: 'POST', body: form });
  },
  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};
