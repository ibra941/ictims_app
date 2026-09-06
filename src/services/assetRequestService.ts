import { ApiResponse } from '../types';
import apiClient from './apiClient';

export interface AssetRequest {
  id: string;
  assetId: string;
  assetName: string;
  employeeName: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  createdAt: string;
}

export const assetRequestService = {
  async getAll(): Promise<ApiResponse<AssetRequest[]>> {
    const response = await apiClient.get<ApiResponse<AssetRequest[]>>('/requests');
    return response.data;
  },

  async create(assetId: string, reason: string): Promise<ApiResponse<AssetRequest>> {
    const response = await apiClient.post<ApiResponse<AssetRequest>>('/requests', {
      asset_id: assetId,
      reason,
    });
    return response.data;
  },

  async updateStatus(id: string, status: 'Approved' | 'Rejected'): Promise<ApiResponse<AssetRequest>> {
    const response = await apiClient.patch<ApiResponse<AssetRequest>>(`/requests/${id}/status`, { status });
    return response.data;
  },
};