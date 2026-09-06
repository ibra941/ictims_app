import { ApiResponse, MaintenanceRecord } from '../types';
import apiClient from './apiClient';

export const maintenanceService = {
  async getAll(): Promise<ApiResponse<MaintenanceRecord[]>> {
    const response = await apiClient.get<ApiResponse<MaintenanceRecord[]>>('/maintenance');
    return response.data;
  },

  async create(data: any): Promise<ApiResponse<MaintenanceRecord>> {
    const response = await apiClient.post<ApiResponse<MaintenanceRecord>>('/maintenance', {
      asset_id: data.assetId || data.asset_id,
      description: data.issueDescription || data.description,
      request_reason: data.requestReason || data.request_reason,
      requester_name: data.requesterName || data.requester_name,
      requester_department: data.requesterDepartment || data.requester_department,
      requester_contact: data.requesterContact || data.requester_contact,
      requester_signature: data.requesterSignature || data.requester_signature,
      maintenance_date: data.reportedDate || data.maintenance_date,
      status: data.status || 'In Progress',
    });
    return response.data;
  },

  async updateStatus(
    id: string,
    status: MaintenanceRecord['status'],
    resolutionNotes?: string,
    completionDate?: string
  ): Promise<ApiResponse<MaintenanceRecord>> {
    // Tumia PATCH kwenye backend
    const response = await apiClient.patch<ApiResponse<MaintenanceRecord>>(`/maintenance/${id}/status`, {
      status,
      notes: resolutionNotes,
      completion_date: completionDate,
    });
    return response.data;
  },
};
