import { ApiResponse } from '../types';
import apiClient from './apiClient';

export interface AssetCategoryRecord {
  id: number;
  name: string;
  code: string;
  type: 'Hardware' | 'Software';
}

export const categoryService = {
  async getAll(): Promise<ApiResponse<AssetCategoryRecord[]>> {
    try {
      const response = await apiClient.get('/asset-categories');
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch asset categories', data: [] };
    }
  },
};

export default categoryService;
