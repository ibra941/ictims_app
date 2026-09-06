import { ApiResponse, User } from '../types';
import apiClient from './apiClient';

export interface DashboardMetrics {
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  underMaintenance: number;
  pendingTransfers: number;
  disposedAssets: number;
  myAssetsCount?: number;
  totalAssetValue: number;
  campusBreakdown: { campus: string; count: number; value: number }[];
  categoryBreakdown: { category: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export const reportService = {
  async getDashboardMetrics(user: User): Promise<ApiResponse<DashboardMetrics>> {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/reports/dashboard');
    return response.data;
  },
};
