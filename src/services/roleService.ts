import { ApiResponse } from '../types';
import apiClient from './apiClient';

export interface RolePermission {
  id?: number;
  module: string;
  action: string;
  resource?: string | null;
}

export interface RoleRecord {
  id: number;
  name: string;
  description?: string | null;
  permissions: RolePermission[];
  userCount: number;
}

export type PermissionCatalog = Record<string, string[]>;

export const roleService = {
  async getAll(): Promise<ApiResponse<RoleRecord[]>> {
    const response = await apiClient.get<ApiResponse<RoleRecord[]>>('/roles');
    return response.data;
  },

  async getCatalog(): Promise<ApiResponse<PermissionCatalog>> {
    const response = await apiClient.get<ApiResponse<PermissionCatalog>>('/permissions/catalog');
    return response.data;
  },

  async create(data: { name: string; description?: string; permissions: RolePermission[] }): Promise<ApiResponse<{ id: number }>> {
    const response = await apiClient.post<ApiResponse<{ id: number }>>('/roles', data);
    return response.data;
  },

  async update(id: number, data: { name?: string; description?: string | null }): Promise<ApiResponse<null>> {
    const response = await apiClient.put<ApiResponse<null>>(`/roles/${id}`, data);
    return response.data;
  },

  async updatePermissions(id: number, permissions: RolePermission[]): Promise<ApiResponse<null>> {
    const response = await apiClient.put<ApiResponse<null>>(`/roles/${id}/permissions`, { permissions });
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/roles/${id}`);
    return response.data;
  },
};
