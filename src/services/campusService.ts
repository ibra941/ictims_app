import { ApiResponse, Campus } from '../types';
import apiClient from './apiClient';

export const campusService = {
  async getAll(): Promise<ApiResponse<Campus[]>> {
    const response = await apiClient.get<ApiResponse<Campus[]>>('/campuses');
    return {
      ...response.data,
      data: response.data.data?.map((campus: any) => ({
        ...campus,
        id: campus.id?.toString() || campus.campus_id?.toString() || '',
      })) || [],
    };
  },

  // Unauthenticated list used by the login screen's campus picker.
  async getPublicList(): Promise<ApiResponse<Campus[]>> {
    const response = await apiClient.get<ApiResponse<Campus[]>>('/public/campuses');
    return {
      ...response.data,
      data: response.data.data?.map((campus: any) => ({
        ...campus,
        id: campus.id?.toString() || campus.campus_id?.toString() || '',
      })) || [],
    };
  },

  async create(data: { name: string; code: string; location?: string; description?: string }): Promise<ApiResponse<{ id: number }>> {
    const response = await apiClient.post<ApiResponse<{ id: number }>>('/campuses', data);
    return response.data;
  },
};
