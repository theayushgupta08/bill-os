import axios from 'axios';

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
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const orgId = localStorage.getItem('active_org_id');

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
  (error) => {
    // If we get a 401 Unauthorized, we might want to log them out or refresh token in the future
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Optional: automatically redirect to login or clear token
      // localStorage.removeItem('token');
      // window.location.href = '/login';
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

    const url = window.URL.createObjectURL(new Blob([response as any])); // response is the blob because of our interceptor returning data
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('Failed to download PDF');
  }
}

export default apiClient;
