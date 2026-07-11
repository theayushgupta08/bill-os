export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * Basic fetch wrapper for API calls that automatically includes the token.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // In a real app, you would retrieve the token from a secure location (e.g., Zustand store, context, or HTTP-only cookie)
  // For now, we will assume a dummy token or retrieve from localStorage for simplicity during MVP scaffolding.
  let token = '';
  let orgId = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || '';
    orgId = localStorage.getItem('active_org_id') || '';
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (orgId) {
    headers.set('X-Organization-Id', orgId);
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

/**
 * Downloads a PDF from the API.
 */
export async function downloadPdf(endpoint: string, filename: string) {
  let token = '';
  let orgId = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || '';
    orgId = localStorage.getItem('active_org_id') || '';
  }

  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (orgId) {
    headers.set('X-Organization-Id', orgId);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default fetchApi;
