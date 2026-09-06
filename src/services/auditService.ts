import { ApiResponse, AuditLog } from '../types';
import { initialAuditLogs } from '../mocks/mockData';
import { USE_MOCKS, simulateDelay } from '../mocks/mockAdapter';
import apiClient from './apiClient';

let mockLogs: AuditLog[] = [...initialAuditLogs];

export const auditService = {
  async getAll(): Promise<ApiResponse<AuditLog[]>> {
    if (USE_MOCKS) {
      await simulateDelay(150);
      return { success: true, data: [...mockLogs] };
    }
    const response = await apiClient.get<ApiResponse<AuditLog[]>>('/audit');
    if (response.data.success && Array.isArray(response.data.data)) {
      // Map backend audit logs to frontend format
      const mappedLogs: AuditLog[] = response.data.data.map((log: any) => ({
        id: log.id?.toString() || log.log_id?.toString(),
        userId: log.user_id?.toString(),
        tableName: log.table_name || log.module || 'System',
        recordId: log.record_id?.toString() || '',
        action: ({ INSERT: 'CREATE', DISPOSE: 'DISPOSAL' }[log.action] || log.action || 'UPDATE') as AuditLog['action'],
        module: log.module || log.table_name || 'System',
        description: log.description || `${log.module || log.table_name || 'System'} ${log.action || 'updated'}`,
        ipAddress: log.ipAddress || log.ip_address || '',
        timestamp: log.timestamp || log.created_at || '',
        createdAt: log.created_at || log.timestamp || '',
        userName: log.userName || log.user_name || 'System',
        userRole: log.userRole || log.user_role || 'System',
        campus: log.campus || log.campus_name || 'System',
        department: log.department || log.department_name || 'System',
      }));
      return { ...response.data, data: mappedLogs };
    }
    return response.data;
  },

  async logAction(action: AuditLog['action'], module: string, description: string, user: { id: string; name: string; role: string; campus: string }): Promise<void> {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      description,
      ipAddress: '196.249.98.12',
      campus: user.campus,
    };
    mockLogs = [newLog, ...mockLogs];
  },

  async deleteOld(ids: string[]): Promise<ApiResponse> {
    if (USE_MOCKS) {
      mockLogs = mockLogs.filter((log) => !ids.includes(log.id));
      return { success: true, message: `${ids.length} old audit log(s) deleted` };
    }
    const response = await apiClient.delete<ApiResponse>('/audit', { data: { ids: ids.map(Number) } });
    return response.data;
  }
};
