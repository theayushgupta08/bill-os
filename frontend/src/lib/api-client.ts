import axios, { AxiosRequestConfig } from 'axios';
import { createClient } from './supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach tokens and organization ID
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const orgId = localStorage.getItem('active_org_id');

      // Fetch the active session from Supabase
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    // If we get a 401 Unauthorized, we might want to log them out
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    }

    // Standardize the error message
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

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
  } catch (_error) {
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
