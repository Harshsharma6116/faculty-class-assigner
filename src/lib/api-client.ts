// ============================================================================
// API Client — Thin fetch wrapper for making typed API calls
// Used by React Query hooks to communicate with Next.js API routes
// ============================================================================

export class ApiClientError extends Error {
  statusCode: number;
  data: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiClientError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiClientError(
      response.status,
      data.error || `Request failed with status ${response.status}`,
      data
    );
  }
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    const response = await fetch(fullUrl);
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, { method: 'DELETE' });
    return handleResponse<T>(response);
  },

  // Special method for file uploads (CSV)
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<T>(response);
  },
};
