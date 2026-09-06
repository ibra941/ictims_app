import { ApiResponse, User, UserRole } from '../types';
import apiClient from './apiClient';

// Helper ya kusoma cookie
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  campus?: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
  phone: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponseData>> {
    try {
      // Kwanza pata CSRF cookie
      await apiClient.get('/sanctum/csrf-cookie');
      
      // Soma token kutoka cookie
      const csrfToken = getCookie('XSRF-TOKEN');
      
      // MUHIMU SANA: Tumia '/login' (SI '/api/login') kwa sababu baseURL tayari ni '/api'
      const response = await apiClient.post<ApiResponse<AuthResponseData>>('/login', credentials, {
        headers: {
          'X-XSRF-TOKEN': csrfToken || '',
        }
      });
      
      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('ictims_auth_token', response.data.data.token);
        localStorage.setItem('ictims_auth_user', JSON.stringify(response.data.data.user));
        localStorage.setItem('ictims_session_start', Date.now().toString());
      }
      
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return {
          success: false,
          message: 'Network error: Could not connect to the server. Please make sure the backend is running on port 8003.',
        };
      }
      
      if (error.response?.status === 422) {
        return {
          success: false,
          message: error.response.data.message || 'Validation failed',
          errors: error.response.data.errors,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      const token = localStorage.getItem('ictims_auth_token');
      if (token) {
        // MUHIMU: Tumia '/logout' (SI '/api/logout')
        await apiClient.post('/logout');
      }
      return { success: true, message: 'Logged out successfully' };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: true, message: 'Logged out' };
    } finally {
      localStorage.removeItem('ictims_auth_token');
      localStorage.removeItem('ictims_auth_user');
      localStorage.removeItem('ictims_session_start');
    }
  },

  async getUser(): Promise<ApiResponse<User>> {
    try {
      // MUHIMU: Tumia '/user' (SI '/api/user')
      const response = await apiClient.get<ApiResponse<User>>('/user');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user',
      };
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('ictims_auth_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  getCurrentToken(): string | null {
    return localStorage.getItem('ictims_auth_token');
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>('/forgot-password', payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send reset email',
      };
    }
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>('/reset-password', payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password',
      };
    }
  },

  async changePassword(payload: ChangePasswordRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>('/change-password', payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password',
      };
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('ictims_auth_token') && !!this.getCurrentUser();
  },
};
