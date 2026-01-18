/**
 * Get API URL with auto-detection for Daytona sandboxes
 */
function getApiUrl(): string {
  // Explicit env var takes precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect in Daytona sandbox (production)
  if (typeof window !== "undefined" && window.location.hostname.includes(".proxy.daytona.works")) {
    // Extract sandbox ID from hostname: 3000-{sandboxId}.proxy.daytona.works
    const parts = window.location.hostname.split("-");
    if (parts.length >= 2) {
      const sandboxPart = parts.slice(1).join("-").replace(".proxy.daytona.works", "");
      return `https://3001-${sandboxPart}.proxy.daytona.works`;
    }
  }

  // Local development
  return "http://localhost:3001";
}

const API_URL = getApiUrl();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_URL);

// Type-safe API endpoints
export const endpoints = {
  health: "/health",
  items: "/api/items",
  item: (id: string) => `/api/items/${id}`,
} as const;
