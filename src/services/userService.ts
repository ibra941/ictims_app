import { ApiResponse, User, UserRole } from '../types';
import apiClient from './apiClient';

export const userService = {
  async getAll(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users');
    if (response.data.success && Array.isArray(response.data.data)) {
      const mappedUsers: User[] = response.data.data.map((u: any) => ({
        id: u.id?.toString() || u.user_id?.toString(),
        username: u.username,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        role: u.role || u.role_name || 'Employee',
        role_id: Number(u.role_id) || undefined,
        campus: u.campus || u.campus_name || null,
        department: u.department || u.department_name || null,
        office: u.office || null,
        phone: u.phone,
        isActive: u.is_active ?? u.isActive,
        createdAt: u.created_at,
      }));
      return { ...response.data, data: mappedUsers };
    }
    return response.data;
  },

  async create(data: any): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  async changeRole(id: string, newRole: UserRole): Promise<ApiResponse<User>> {
    // Tumia PATCH kwenye backend
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}/role`, { role: newRole });
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },

  async toggleStatus(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`);
    return response.data;
  },
};
