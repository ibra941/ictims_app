import React, { useState, useEffect } from 'react';
import { Clock, Filter, Trash2 } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import Table, { Column } from '../../components/Table';
import ExportButton from '../../components/ExportButton';
import { useToast } from '../../context/ToastContext';

export const AuditList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    auditService.getAll().then((res) => {
      if (res.success && res.data) setLogs(res.data);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'All' && log.action !== actionFilter) return false;
    if (moduleFilter !== 'All' && log.module !== moduleFilter) return false;
    return true;
  }).sort((firstLog, secondLog) => {
    const firstTime = new Date(firstLog.timestamp).getTime();
    const secondTime = new Date(secondLog.timestamp).getTime();
    return ['oldest', 'ascending'].includes(sortOrder) ? firstTime - secondTime : secondTime - firstTime;
  });

  const isOldLog = (log: AuditLog) => new Date(log.timestamp).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  const selectedOldIds = [...selectedIds].filter((id) => logs.some((log) => log.id === id && isOldLog(log)));

  const toggleSelection = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!selectedOldIds.length || !window.confirm(`Delete ${selectedOldIds.length} old audit log(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const response = await auditService.deleteOld(selectedOldIds);
      if (!response.success) throw new Error(response.message || 'Failed to delete audit logs');
      setLogs((previous) => previous.filter((log) => !selectedOldIds.includes(log.id)));
      setSelectedIds(new Set());
      showToast(response.message || 'Old audit logs deleted', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to delete audit logs', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-[var(--color-teal)] border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-50 text-[var(--color-navy)] border-blue-200';
      case 'DELETE':
      case 'DISPOSAL':
        return 'bg-red-50 text-[var(--color-maroon)] border-red-200';
      case 'ASSIGN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'TRANSFER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'LOGIN_FAILED':
        return 'bg-red-50 text-[#8B232A] border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'selection',
      label: (
        <input
          type="checkbox"
          aria-label="Select all filtered audit logs"
          checked={filteredLogs.length > 0 && filteredLogs.every((log) => selectedIds.has(log.id))}
          onChange={(event) => setSelectedIds(event.target.checked ? new Set(filteredLogs.map((log) => log.id)) : new Set())}
          className="h-4 w-4 accent-[#1B3A5C] cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Select audit log ${row.id}`}
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelection(row.id)}
          className="h-4 w-4 accent-[#1B3A5C] cursor-pointer"
        />
      ),
    },
    {
      key: 'timestamp',
      label: 'Timestamp (EAT)',
      sortable: true,
      render: (row) => (
        <div className="font-mono text-xs text-[var(--color-gray-900)] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[var(--color-gray-500)]" />
          <span>{formatDateTime(row.timestamp)}</span>
        </div>
      ),
    },
    {
      key: 'userName',
      label: 'User & Role',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-[#1A1A1A] text-xs">{row.userName}</div>
          <div className="text-[10px] text-[#1B3A5C] font-black uppercase tracking-wider">{row.userRole}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (row) => <div className="text-xs text-[#1A1A1A] font-semibold">{row.department}</div>,
    },
    {
      key: 'action',
      label: 'Action & Module',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider ${getActionBadge(
              row.action
            )}`}
          >
            {row.action}
          </span>
          <span className="text-xs text-[#6B7280] font-semibold">{row.module}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Action Details / Event Log',
      render: (row) => <div className="text-xs text-[#1A1A1A] font-medium leading-relaxed">{row.description}</div>,
    },
    {
      key: 'campus',
      label: 'Campus & IP',
      sortable: true,
      render: (row) => (
        <div>
          <div className="text-xs text-[#1A1A1A] font-bold">{row.campus}</div>
          <div className="text-[10px] text-[#6B7280] font-mono font-medium">{row.ipAddress}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#6B7280] uppercase tracking-widest block mb-0.5">
            Security & Governance
          </span>
          <h2 className="text-2xl font-black text-[#1B3A5C] tracking-tight">Institutional Audit Trail</h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ExportButton data={filteredLogs} filename="IAA_Audit_Trail_Logs" exportFormat="pdf" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EBEF] shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#6B7280] font-black uppercase text-[10px] tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Logs:</span>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl text-[#1A1A1A] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] cursor-pointer"
        >
          <option value="All">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="ASSIGN">ASSIGN</option>
          <option value="TRANSFER">TRANSFER</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="DISPOSAL">DISPOSAL</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGIN_FAILED">LOGIN FAILED</option>
        </select>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] rounded-lg text-[var(--color-gray-900)]"
        >
          <option value="All">All Modules</option>
          <option value="Assets">Assets</option>
          <option value="Assignments">Assignments</option>
          <option value="Transfers">Transfers</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Disposal">Disposal</option>
          <option value="Suppliers">Suppliers</option>
          <option value="Purchases">Purchases</option>
          <option value="Users">Users</option>
          <option value="Authentication">Authentication</option>
        </select>

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          aria-label="Audit log order"
          className="px-2.5 py-1.5 bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] rounded-lg text-[var(--color-gray-900)]"
        >
          <option value="newest">Last modified first</option>
          <option value="oldest">First modified first</option>
          <option value="ascending">Timestamp: ascending</option>
          <option value="descending">Timestamp: descending</option>
        </select>

        {(actionFilter !== 'All' || moduleFilter !== 'All') && (
          <button
            onClick={() => {
              setActionFilter('All');
              setModuleFilter('All');
            }}
            className="text-[11px] text-[var(--color-navy)] hover:underline ml-auto font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={filteredLogs}
        loading={loading}
        emptyMessage="No audit logs recorded for this criteria."
        searchPlaceholder="Search audit logs by user, description, or IP address..."
        actions={
          <button
            type="button"
            onClick={deleteSelected}
            disabled={!selectedOldIds.length || deleting}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#8B232A] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : `Delete old (${selectedOldIds.length})`}
          </button>
        }
      />
    </div>
  );
};

export default AuditList;
