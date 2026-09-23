import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createClient } from './supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/** Message TenantMembershipInterceptor returns when X-Organization-Id names an org the caller isn't in. */
const ORG_ACCESS_DENIED = 'You do not have access to this organization';

// Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ACTIVE_ORG_KEY = 'active_org_id';

/** Endpoints the backend does not scope to X-Organization-Id (mirrors TenantMembershipInterceptor). */
const TENANT_AGNOSTIC_PREFIXES = ['/organizations', '/users', '/public', '/health'];

function isTenantAgnostic(url = ''): boolean {
  return TENANT_AGNOSTIC_PREFIXES.some(
    (p) => url === p || url.startsWith(`${p}/`) || url.startsWith(`${p}?`)
  );
}

let pendingOrgResolution: Promise<string | null> | null = null;

/**
 * The active organization for tenant-scoped calls. Falls back to the user's first organization when none is
 * stored yet (e.g. a fresh tab), sharing one in-flight lookup between concurrent requests.
 */
export async function resolveActiveOrgId(): Promise<string | null> {
  const stored = localStorage.getItem(ACTIVE_ORG_KEY);
  if (stored) return stored;

  // '/organizations' is tenant-agnostic, so this goes through apiClient without re-entering the resolver
  pendingOrgResolution ??= (apiClient.get('/organizations') as unknown as Promise<{ id: string }[]>)
    .then((orgs) => {
      const id = orgs?.[0]?.id ?? null;
      if (id) localStorage.setItem(ACTIVE_ORG_KEY, id);
      return id;
    })
    .catch(() => null)
    .finally(() => {
      pendingOrgResolution = null;
    });
  return pendingOrgResolution;
}

// Request interceptor to attach tokens and organization ID
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      // Fetch the active session from Supabase
      const supabase = createClient();
      let { data: { session } } = await supabase.auth.getSession();

      // If getSession returns null initially, attempt getUser to initialize auth state
      if (!session) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: refreshedSession } = await supabase.auth.getSession();
          session = refreshedSession?.session;
        }
      }

      const token = session?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const orgId = isTenantAgnostic(config.url)
        ? localStorage.getItem(ACTIVE_ORG_KEY)
        : await resolveActiveOrgId();
      if (orgId) {
        config.headers['X-Organization-Id'] = orgId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to unwrap data and handle global errors
apiClient.interceptors.response.use(
  (response) => {
    // Axios wraps the response in a `data` object. We return just the data.
    return response.data;
  },
  async (error) => {
    // If we get a 401 Unauthorized, only log out on dashboard/protected app routes
    // Never aggressively sign out on onboarding (/phone, /setup) or auth flows
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isOnboardingOrAuth =
        pathname.startsWith('/phone') ||
        pathname.startsWith('/setup') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/auth');

      if (!isOnboardingOrAuth) {
        // Don't let the next user on this browser inherit this user's organization
        localStorage.removeItem(ACTIVE_ORG_KEY);
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }

    // The stored organization is one this user no longer belongs to (removed from the team, or another user's
    // leftover). Forget it so the next request resolves a valid one instead of failing forever.
    if (error.response?.status === 403 && error.response?.data?.message === ORG_ACCESS_DENIED
        && typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_ORG_KEY);
    }

    // Standardize the error message, but keep status/response so callers can still branch on them
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new ApiError(message, error.response?.status, error.response));
  }
);

/**
 * Error thrown by every failed API call. `message` is already the backend's message when it sent one, so
 * `toast.error(err.message)` is enough; `status` and `response` are kept for callers that need them.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: AxiosResponse<{ message?: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The user-facing message of a failed call (ApiError already carries the backend's message). */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Downloads a PDF from the API using the Axios instance.
 */
export async function downloadPdf(endpoint: string, filename: string) {
  try {
    const response = await apiClient.get(endpoint, {
      responseType: 'blob', // Important for downloading binary data
    });

    const url = window.URL.createObjectURL(new Blob([response as unknown as BlobPart])); // response is the blob because of our interceptor returning data
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    throw new Error('Failed to download PDF');
  }
}

/**
 * Type-safe API helpers.
 * Because our response interceptor returns `response.data` directly,
 * the runtime return type is `T`, not `AxiosResponse<T>`.
 * These helpers make TypeScript aware of that.
 */
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config) as unknown as Promise<T>,
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post(url, data, config) as unknown as Promise<T>,
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put(url, data, config) as unknown as Promise<T>,
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config) as unknown as Promise<T>,
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.patch(url, data, config) as unknown as Promise<T>,
};

export default apiClient;
