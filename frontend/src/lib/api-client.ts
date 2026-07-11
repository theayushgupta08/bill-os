export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * Basic fetch wrapper for API calls that automatically includes the token.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // In a real app, you would retrieve the token from a secure location (e.g., Zustand store, context, or HTTP-only cookie)
  // For now, we will assume a dummy token or retrieve from localStorage for simplicity during MVP scaffolding.
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || '';
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle error
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}
