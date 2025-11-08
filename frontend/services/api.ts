/**
 * API Service - Cliente HTTP configurado para el backend
 * Maneja automáticamente JWT tokens y errores
 */

import { API_BASE_URL } from './api-config';

// ============================================
// TIPOS
// ============================================

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

// ============================================
// API CLIENT
// ============================================

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Obtener token del localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('uno_auth_token');
  }

  /**
   * Construir headers con token
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const token = this.getToken();
    const headers = { ...this.defaultHeaders, ...customHeaders };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Realizar petición HTTP
   */
  private async request<T = any>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(config.headers);

    const fetchConfig: RequestInit = {
      method: config.method,
      headers,
      credentials: 'include', // Incluir cookies si es necesario
    };

    if (config.body && config.method !== 'GET') {
      fetchConfig.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, fetchConfig);

      // Parsear respuesta
      let data: any;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Si la respuesta no es OK, lanzar error
      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          message: data?.message || data || 'Error en la petición',
          data,
        };
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error: any) {
      // Si el error ya tiene formato de nuestra API, re-lanzarlo
      if (error.status) {
        throw error;
      }

      // Error de red u otro
      throw {
        status: 0,
        statusText: 'Network Error',
        message: error.message || 'Error de conexión',
        data: null,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      headers,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      headers,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
      headers,
    });
  }

  /**
   * Configurar header por defecto
   */
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remover header por defecto
   */
  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

const api = new ApiClient(API_BASE_URL);

export default api;
export { ApiClient };
export type { ApiResponse };
