import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ictims_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Usifute token kama bado umeingia!
      // Fanya redirect kwenye login tu
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const responseData = error.response?.data as any;
    const normalizedError: ApiResponse = {
      success: false,
      message: responseData?.message || error.message || 'An unexpected error occurred',
      errors: responseData?.errors || {},
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
