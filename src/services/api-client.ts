import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshRequest,
  RefreshResponse,
  ApiResponse,
} from '@contracts/routes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function getAuthFromStorage(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem('tv-auth');
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    return {
      accessToken: state?.accessToken ?? null,
      refreshToken: state?.refreshToken ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

async function doRefresh(): Promise<string | null> {
  const { refreshToken } = getAuthFromStorage();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken } satisfies RefreshRequest),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ApiResponse<RefreshResponse>;
    if ('error' in data) return null;

    const { accessToken, refreshToken: newRefreshToken } = data.data;
    const existing = JSON.parse(localStorage.getItem('tv-auth') ?? '{}');
    const state = existing?.state ?? existing;
    const next = { ...state, accessToken, refreshToken: newRefreshToken };
    localStorage.setItem('tv-auth', JSON.stringify({ state: next }));
    return accessToken;
  } catch {
    return null;
  }
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { accessToken } = getAuthFromStorage();
    const { body, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Auth endpoints return 401 for invalid credentials — do NOT refresh/redirect
      if (
        endpoint.startsWith('/auth/login') ||
        endpoint.startsWith('/auth/register') ||
        endpoint.startsWith('/auth/oauth/')
      ) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        const message =
          (typeof error === 'object' && error !== null &&
            typeof (error as Record<string, unknown>).error === 'object' &&
            (error as Record<string, unknown>).error !== null &&
            typeof ((error as Record<string, unknown>).error as Record<string, unknown>).message === 'string')
            ? (((error as Record<string, unknown>).error as Record<string, unknown>).message as string)
            : (typeof error === 'object' && error !== null && typeof (error as Record<string, unknown>).message === 'string')
              ? ((error as Record<string, unknown>).message as string)
              : 'Request failed';
        throw new ApiError(401, message, error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await doRefresh();
        isRefreshing = false;
        if (newToken) {
          onRefreshed(newToken);
          return this.request<T>(endpoint, options);
        }
        localStorage.removeItem('tv-auth');
        window.location.href = '/login';
        throw new ApiError(401, 'Session expired. Please log in again.');
      }

      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber((token) => {
          const retryHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(customHeaders as Record<string, string>),
          };
          retryHeaders['Authorization'] = `Bearer ${token}`;
          fetch(url, { ...rest, headers: retryHeaders, body: body ? JSON.stringify(body) : undefined })
            .then(async (res) => {
              if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                reject(new ApiError(res.status, err.message ?? 'Request failed', err));
                return;
              }
              if (res.status === 204) { resolve(undefined as T); return; }
              resolve(await res.json());
            })
            .catch(reject);
        });
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(response.status, error.message ?? 'Request failed', error);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiClient = new ApiClient();

// Typed auth helpers
export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  if ('error' in res) throw new ApiError(400, res.error.message, res.error);
  return res.data;
}

export async function registerApi(payload: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', payload);
  if ('error' in res) throw new ApiError(400, res.error.message, res.error);
  return res.data;
}

export async function oauthLoginApi(provider: 'google' | 'apple' | 'telegram'): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>(`/auth/oauth/${provider}`, {});
  if ('error' in res) throw new ApiError(400, res.error.message, res.error);
  return res.data;
}
