import { ApiResponse, AssetAssignment, AssignmentLocation } from '../types';
import apiClient from './apiClient';

const mapAssignment = (assignment: any): AssetAssignment => ({
  id: String(assignment.id ?? assignment.assign_id ?? ''),
  assetId: String(assignment.assetId ?? assignment.asset_id ?? ''),
  assetName: assignment.assetName ?? assignment.asset_name ?? 'Unknown asset',
  assetType: assignment.assetType ?? assignment.asset_type ?? '',
  employeeId: String(assignment.employeeId ?? assignment.emp_id ?? ''),
  employeeName: assignment.employeeName ?? assignment.employee_name ?? 'Unknown employee',
  campus: assignment.campus ?? assignment.campus_name ?? '',
  department: assignment.department ?? assignment.department_name ?? '',
  assignmentType: assignment.assignmentType ?? assignment.assignment_type ?? 'Department',
  location: assignment.location ?? assignment.location_name ?? '',
  office: assignment.office ?? '',
  assignDate: assignment.assignDate ?? assignment.assignedAt ?? assignment.assign_date ?? '',
  expectedReturnDate: assignment.expectedReturnDate ?? assignment.expected_return_date ?? '',
  actualReturnDate: assignment.actualReturnDate ?? assignment.returnedAt ?? assignment.actual_return_date ?? '',
  status: assignment.status ?? 'Active',
  notes: assignment.notes ?? '',
});

export const assignmentService = {
  async getAll(): Promise<ApiResponse<AssetAssignment[]>> {
    const response = await apiClient.get<ApiResponse<AssetAssignment[]>>('/assignments');
    return { ...response.data, data: response.data.data?.map(mapAssignment) };
  },

  async create(data: any): Promise<ApiResponse<AssetAssignment>> {
    const response = await apiClient.post<ApiResponse<AssetAssignment>>('/assignments', {
      asset_id: data.assetId || data.asset_id,
      emp_id: data.employeeId || data.emp_id,
      dept_id: data.departmentId || data.dept_id,
      assignment_type: data.assignmentType || data.assignment_type || 'Department',
      location_name: data.locationName || data.location_name || null,
      assign_date: data.assignDate || data.assign_date,
      expected_return_date: data.expectedReturnDate || data.expected_return_date,
      status: data.status || 'Active',
      notes: data.notes || null,
    });
    return response.data;
  },

  async getLocations(campusId?: string | number): Promise<ApiResponse<AssignmentLocation[]>> {
    const response = await apiClient.get<ApiResponse<AssignmentLocation[]>>('/assignment-locations', {
      params: campusId ? { campus_id: campusId } : undefined,
    });
    return {
      ...response.data,
      data: response.data.data?.map((location: any) => ({
        id: String(location.id),
        departmentId: location.departmentId ? String(location.departmentId) : undefined,
        type: location.type,
        name: location.name,
      })),
    };
  },

  async returnAsset(id: string, conditionOnReturn: string, returnDate: string): Promise<ApiResponse<AssetAssignment>> {
    const response = await apiClient.post<ApiResponse<AssetAssignment>>(`/assignments/${id}/return`, {
      conditionOnReturn,
      returnDate,
    });
    return response.data;
  },
};
