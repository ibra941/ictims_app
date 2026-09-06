import { ApiResponse, Supplier } from '../types';
import { initialSuppliers } from '../mocks/mockData';
import { USE_MOCKS, simulateDelay } from '../mocks/mockAdapter';
import apiClient from './apiClient';

let mockSuppliers: Supplier[] = [...initialSuppliers];

export const supplierService = {
  async getAll(): Promise<ApiResponse<Supplier[]>> {
    if (USE_MOCKS) {
      await simulateDelay(200);
      return { success: true, data: [...mockSuppliers] };
    }
    const response = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers');
    if (response.data.success && Array.isArray(response.data.data)) {
      // Map backend data to frontend format
      const mappedSuppliers: Supplier[] = response.data.data.map((s: any) => ({
        id: s.id?.toString() || s.supp_id?.toString(),
        name: s.name || '',
        contactPerson: s.contactPerson || s.contact_person || '',
        email: s.email || '',
        phone: s.phone || '',
        address: s.address || '',
        tin: s.tin || s.tinNumber || '',
        isActive: s.isActive || s.is_active || true,
        status: s.status || 'Active',
      }));
      return { ...response.data, data: mappedSuppliers };
    }
    return response.data;
  },

  async create(data: Omit<Supplier, 'id'>): Promise<ApiResponse<Supplier>> {
    if (USE_MOCKS) {
      await simulateDelay(250);
      const newSupplier: Supplier = { ...data, id: `sup-${Date.now()}` };
      mockSuppliers = [newSupplier, ...mockSuppliers];
      return { success: true, message: 'Supplier registered successfully', data: newSupplier };
    }
    const response = await apiClient.post<ApiResponse<Supplier>>('/suppliers', {
      name: data.name,
      contact_person: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      tin: data.tin ?? data.tinNumber,
      is_active: data.isActive ?? true,
    });
    return response.data;
  },

  async update(id: string, data: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    if (USE_MOCKS) {
      await simulateDelay(200);
      const index = mockSuppliers.findIndex((s) => s.id === id);
      if (index !== -1) {
        mockSuppliers[index] = { ...mockSuppliers[index], ...data };
        return { success: true, message: 'Supplier details updated', data: mockSuppliers[index] };
      }
      return { success: false, message: 'Supplier not found' };
    }
    const response = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return response.data;
  },
};
