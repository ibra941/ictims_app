import { ApiResponse, Asset, AssetFilters } from '../types';
import apiClient from './apiClient';

const mapAssetFromBackend = (backendAsset: any): Asset => {
  return {
    id: backendAsset.asset_id?.toString() || backendAsset.id?.toString() || '',
    assetTag: backendAsset.serial_number || backendAsset.asset_tag || backendAsset.assetTag || '',
    serialNumber: backendAsset.serial_number || backendAsset.serialNumber || '',
    name: backendAsset.name || '',
    model: backendAsset.model || '',
    category: backendAsset.category?.name || backendAsset.category || 'Uncategorized',
    categoryId: backendAsset.cat_id || backendAsset.category_id || backendAsset.categoryId,
    categoryType: backendAsset.category_type || backendAsset.categoryType,
    campus: backendAsset.campus?.name || backendAsset.campus || '',
    campusId: backendAsset.campus_id || backendAsset.campusId,
    department: backendAsset.department?.name || backendAsset.department || '',
    departmentId: backendAsset.dept_id,
    supplier: backendAsset.supplier?.name || backendAsset.supplier || '',
    supplierId: backendAsset.supp_id,
    status: backendAsset.status || 'Available',
    disposalReady: Boolean(backendAsset.disposal_ready ?? backendAsset.disposalReady),
    cost: Number(backendAsset.cost ?? backendAsset.purchaseCost) || 0,
    purchaseDate: backendAsset.purchase_date || backendAsset.purchaseDate || '',
    warrantyExpiry: backendAsset.warranty_expiry || '',
    description: backendAsset.description || '',
    imageUrl: backendAsset.image_url || '',
    qrCode: backendAsset.qr_code || '',
    createdAt: backendAsset.created_at || '',
    updatedAt: backendAsset.updated_at || '',
    assignedTo: null,
    assignDate: null,
    expectedReturnDate: null,
  };
};

export const assetService = {
  async getAll(params?: AssetFilters): Promise<ApiResponse<Asset[]>> {
    try {
      const response = await apiClient.get('/assets', { params });
      if (response.data.success) {
        const responseAssets = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data?.items || [];
        const assets = Array.from(
          new Map(responseAssets.map((asset: any) => {
            const mappedAsset = mapAssetFromBackend(asset);
            return [mappedAsset.id, mappedAsset];
          })).values(),
        );
        return { ...response.data, data: assets };
      }
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch assets', data: [] };
    }
  },

  // Hii itatumia serial_number kama asset_tag kwenye create
  async create(assetData: Omit<Asset, 'id'>): Promise<ApiResponse<Asset>> {
    try {
      const response = await apiClient.post('/assets', {
        name: assetData.name,
        model: assetData.model,
        serial_number: assetData.serialNumber,
        campus_id: assetData.campusId || null,
        cat_id: assetData.categoryId || null,
        status: assetData.status,
        cost: assetData.cost,
        purchase_date: assetData.purchaseDate || null,
      });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to create asset' };
    }
  },

  async update(id: string, assetData: Partial<Asset>): Promise<ApiResponse<Asset>> {
    try {
      const response = await apiClient.put(`/assets/${id}`, {
        ...(assetData.name !== undefined && { name: assetData.name }),
        ...(assetData.model !== undefined && { model: assetData.model }),
        ...(assetData.serialNumber !== undefined && { serial_number: assetData.serialNumber }),
        ...(assetData.categoryId !== undefined && { cat_id: assetData.categoryId }),
        ...(assetData.campusId !== undefined && { campus_id: assetData.campusId }),
        ...(assetData.status !== undefined && { status: assetData.status }),
        ...(assetData.cost !== undefined && { cost: assetData.cost }),
      });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to update asset' };
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/assets/${id}`);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete asset' };
    }
  },
};
