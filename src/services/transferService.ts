import { ApiResponse, AssetTransfer } from '../types';
import apiClient from './apiClient';

const mapTransfer = (transfer: any): AssetTransfer => {
  const id = String(transfer.id ?? transfer.trans_id ?? '');
  return {
    id,
    transferNumber: transfer.transferNumber ?? transfer.transfer_number ?? `IAA-TRF-${id.padStart(6, '0')}`,
    assetId: String(transfer.assetId ?? transfer.asset_id ?? ''),
    assetName: transfer.assetName ?? transfer.asset_name ?? 'Unknown asset',
    fromCampus: transfer.fromCampus ?? transfer.from_campus ?? 'Unknown campus',
      fromDepartment: transfer.fromDepartment ?? transfer.from_department ?? 'Unknown department',
    toCampus: transfer.toCampus ?? transfer.to_campus ?? 'Unknown campus',
      toDepartment: transfer.toDepartment ?? transfer.to_department ?? 'Unknown department',
    status: transfer.status ?? 'Pending',
    transferDate: transfer.transferDate ?? transfer.transfer_date ?? '',
    reason: transfer.reason ?? '',
  };
};

export const transferService = {
  async getAll(): Promise<ApiResponse<AssetTransfer[]>> {
    const response = await apiClient.get<ApiResponse<AssetTransfer[]>>('/transfers');
    return { ...response.data, data: response.data.data?.map(mapTransfer) };
  },

  async create(data: any): Promise<ApiResponse<AssetTransfer>> {
    const response = await apiClient.post<ApiResponse<AssetTransfer>>('/transfers', {
      asset_id: data.assetId || data.asset_id,
      from_campus_id: data.sourceCampus || data.from_campus_id,
      from_dept_id: data.sourceDepartment || data.from_dept_id,
      to_campus_id: data.destinationCampus || data.to_campus_id,
      to_dept_id: data.destinationDepartment || data.to_dept_id,
      transfer_date: data.transferDate || data.transfer_date,
      reason: data.reason || '',
      status: data.status || 'Pending',
    });
    return response.data;
  },

  async updateStatus(id: string, status: AssetTransfer['status']): Promise<ApiResponse<AssetTransfer>> {
    const response = await apiClient.patch<ApiResponse<AssetTransfer>>(`/transfers/${id}/status`, { status });
    return response.data;
  },
};
