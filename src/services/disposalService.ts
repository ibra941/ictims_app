import { ApiResponse, DisposalRecord } from '../types';
import { initialDisposals } from '../mocks/mockData';
import { USE_MOCKS, simulateDelay } from '../mocks/mockAdapter';
import apiClient from './apiClient';

let mockDisposals: DisposalRecord[] = [...initialDisposals];

export interface DisposalCreateData {
  asset_ids: string[];
  method: string;
  reason: string;
  disposal_date: string;
  disposal_officer: string;
  disposal_officer_role: string;
  disposal_officer_campus: string;
  disposal_officer_signature: string;
  destination: string;
  recipient_name: string;
  recipient_organization: string;
  recipient_position: string;
  recipient_contact: string;
  recipient_signature: string;
  procurement_signatory: string;
  procurement_officer_email: string;
  campus_admin_signatory: string;
  campus_admin_email: string;
}

export const disposalService = {
  async getAll(): Promise<ApiResponse<DisposalRecord[]>> {
    if (USE_MOCKS) {
      await simulateDelay(200);
      return { success: true, data: [...mockDisposals] };
    }
    const response = await apiClient.get<ApiResponse<DisposalRecord[]>>('/disposal');
    return response.data;
  },

  async create(data: DisposalCreateData): Promise<ApiResponse<DisposalRecord>> {
    if (USE_MOCKS) {
      await simulateDelay(250);
      const newRecord: DisposalRecord = {
        assetId: data.asset_ids[0],
        assetName: 'Removed asset',
        method: data.method,
        reason: data.reason,
        disposalDate: data.disposal_date,
        id: `dsp-${Date.now()}`,
        disposalNumber: `IAA-DSP-2024-00${mockDisposals.length + 1}`,
        disposalOfficer: data.disposal_officer,
        recipientName: data.recipient_name,
        recipientContact: data.recipient_contact,
        procurementSignatory: data.procurement_signatory,
        campusAdminSignatory: data.campus_admin_signatory,
      };
      mockDisposals = [newRecord, ...mockDisposals];
      return { success: true, message: 'Disposal record submitted', data: newRecord };
    }
    const response = await apiClient.post<ApiResponse<DisposalRecord>>('/disposal', data);
    return response.data;
  },
};
