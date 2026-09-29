export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  business_name?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  user: User;
  token: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface UpdateProfilePayload {
  name: string;
  phone: string;
  address: string;
  business_name?: string | null;
}

export interface Task {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
  selected_at?: string;
}

export interface SelectTasksPayload {
  taskIds: string[];
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiErrorResponse;
}
