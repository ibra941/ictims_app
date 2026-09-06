import { ApiResponse, PurchaseOrder, PurchaseOrderInput } from '../types';
import { initialPurchases } from '../mocks/mockData';
import { USE_MOCKS, simulateDelay } from '../mocks/mockAdapter';
import apiClient from './apiClient';

let mockPurchases: PurchaseOrder[] = [...initialPurchases];

const mapPurchase = (purchase: any): PurchaseOrder => ({
  id: String(purchase.id ?? purchase.purch_id ?? ''),
  poNumber: purchase.poNumber ?? purchase.po_number ?? '',
  supplierId: String(purchase.supplierId ?? purchase.supp_id ?? ''),
  supplierName: purchase.supplierName ?? purchase.supplier_name ?? '',
  orderDate: purchase.orderDate ?? purchase.purchaseDate ?? purchase.purch_date ?? '',
  deliveryDate: purchase.deliveryDate ?? purchase.expected_delivery ?? '',
  totalAmount: Number(purchase.totalAmount ?? purchase.total_amount ?? 0),
  currency: purchase.currency ?? 'TZS',
  status: purchase.status ?? 'Draft',
  itemCount: Number(purchase.itemCount ?? purchase.item_count ?? 0),
  itemsSummary: purchase.itemsSummary ?? purchase.notes ?? '',
  campus: purchase.campus ?? '',
});

export const purchaseService = {
  async getAll(): Promise<ApiResponse<PurchaseOrder[]>> {
    if (USE_MOCKS) {
      await simulateDelay(200);
      return { success: true, data: mockPurchases.map(mapPurchase) };
    }
    const response = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/purchases');
    return { ...response.data, data: response.data.data?.map(mapPurchase) };
  },

  async create(data: PurchaseOrderInput): Promise<ApiResponse<PurchaseOrder>> {
    if (USE_MOCKS) {
      await simulateDelay(250);
      const newPO: PurchaseOrder = {
        ...data,
        id: `po-${Date.now()}`,
        poNumber: `IAA-PO-2024-00${mockPurchases.length + 1}`,
      };
      mockPurchases = [newPO, ...mockPurchases];
      return { success: true, message: 'Purchase order created successfully', data: newPO };
    }
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchases', {
      supplier_id: data.supplierId,
      purch_date: data.orderDate,
      expected_delivery: data.deliveryDate || null,
      total_amount: data.totalAmount,
      status: data.status,
      quantity: data.itemCount,
      notes: data.itemsSummary,
    });
    return { ...response.data, data: response.data.data ? mapPurchase(response.data.data) : undefined };
  },

  async updateStatus(id: string, status: PurchaseOrder['status']): Promise<ApiResponse<PurchaseOrder>> {
    const response = await apiClient.patch<ApiResponse<PurchaseOrder>>(`/purchases/${id}/status`, { status });
    return { ...response.data, data: response.data.data ? mapPurchase(response.data.data) : undefined };
  },
};
