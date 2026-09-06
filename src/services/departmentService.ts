import { ApiResponse, Department } from '../types';
import apiClient from './apiClient';

export const departmentService = {
  async getAll(): Promise<ApiResponse<Department[]>> {
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      const mappedDepartments: Department[] = response.data.data.map((d: any) => ({
        id: d.dept_id?.toString() || d.id?.toString() || '',
        name: d.name || '',
        code: d.code || '',
        campusId: d.campus_id?.toString() || '',
        campus: d.campus || '',
        description: d.description || '',
        headOfDepartment: d.headOfDepartment || undefined,
        totalEmployees: d.totalEmployees || 0,
        totalAssets: d.totalAssets || 0,
        createdAt: d.created_at || '',
        updatedAt: d.updated_at || '',
      }));
      return { ...response.data, data: mappedDepartments };
    }
    
    return response.data;
  },
};
