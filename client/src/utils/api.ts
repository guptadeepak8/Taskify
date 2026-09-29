import { Platform } from 'react-native';
import { getToken } from './storage';
import { ApiErrorResponse, ApiResponse } from '../types';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export class ApiError extends Error {
  code: string;
  details?: Array<{ field: string; message: string }>;
  status: number;

  constructor(status: number, error: ApiErrorResponse) {
    super(error.message || 'An unexpected error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error.details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorObj: ApiErrorResponse = json?.error || {
        code: 'REQUEST_FAILED',
        message: json?.message || `Request failed with status ${res.status}`,
      };
      throw new ApiError(res.status, errorObj);
    }

    return json as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connectivity errors
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server. Please check your internet connection.',
    });
  }
}
