import { ApiResponse, Employee } from '../types';
import apiClient from './apiClient';

export const employeeService = {
  async getAll(): Promise<ApiResponse<Employee[]>> {
    const response = await apiClient.get<ApiResponse<Employee[]>>('/employees');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      // Map backend data to frontend format
      const mappedEmployees: Employee[] = response.data.data.map((emp: any) => ({
        id: emp.emp_id?.toString() || emp.id?.toString() || '',
        employeeNo: emp.employee_no || emp.employeeNo || '',
        firstName: emp.first_name || emp.firstName || '',
        lastName: emp.last_name || emp.lastName || '',
        fullName: emp.fullName || `${emp.first_name || emp.firstName || ''} ${emp.last_name || emp.lastName || ''}`.trim(),
        email: emp.email || '',
        phone: emp.phone || '',
        jobTitle: emp.job_title || emp.jobTitle || '',
        departmentId: emp.department_id || emp.dept_id || emp.departmentId || '',
        department: emp.department || '',
        campus: emp.campus || emp.campus_name || '',
        designation: emp.designation || emp.job_title || '',
        isActive: emp.isActive ?? emp.is_active ?? true,
        status: emp.status || (emp.isActive === false || emp.is_active === false ? 'Inactive' : 'Active'),
        assignedAssetsCount: emp.assignedAssetsCount ?? 0,
        createdAt: emp.created_at || emp.createdAt || '',
      }));
      return { ...response.data, data: mappedEmployees };
    }
    return response.data;
  },

  async create(data: Omit<Employee, 'id' | 'assignedAssetsCount'>): Promise<ApiResponse<Employee>> {
    const response = await apiClient.post<ApiResponse<Employee>>('/employees', data);
    return response.data;
  },

  async update(id: string, data: Omit<Employee, 'id' | 'assignedAssetsCount'>): Promise<ApiResponse<Employee>> {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    return response.data;
  },

  async setStatus(id: string, isActive: boolean): Promise<ApiResponse<void>> {
    const response = await apiClient.patch<ApiResponse<void>>(`/employees/${id}/status`, { isActive });
    return response.data;
  },
};
