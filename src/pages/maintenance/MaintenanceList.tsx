import React, { useState, useEffect } from 'react';
import { Plus, Wrench, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { maintenanceService } from '../../services/maintenanceService';
import { assetService } from '../../services/assetService';
import { MaintenanceRecord, Asset } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROLES } from '../../config/roles';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

export const MaintenanceList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const [formData, setFormData] = useState({
    assetId: '',
    campus: user?.campus || 'Arusha Main Campus',
    issueDescription: '',
    serviceProvider: 'Internal ICT Directorate',
    cost: 0,
  });

  const [resolveForm, setResolveForm] = useState({
    status: 'Completed' as MaintenanceRecord['status'],
    resolutionNotes: '',
    completionDate: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mntRes, availableRes] = await Promise.all([
        maintenanceService.getAll(),
        assetService.getAll(),
      ]);
      if (mntRes.success && mntRes.data) {
        const mapped = mntRes.data.map((m: any) => ({
          ...m,
          id: m.id?.toString() || m.maintenance_id?.toString(),
          assetId: m.assetId || m.asset_id || '',
          assetName: m.assetName || m.asset_name || '',
          assetTag: m.assetTag || m.asset_tag || 'N/A',
          ticketNumber: m.ticketNumber || m.id || `MNT-${Date.now()}`,
          status: m.status || 'In Progress',
          campus: m.campus || user?.campus || '',
          issueDescription: m.issueDescription || m.description || '',
          serviceProvider: m.serviceProvider || 'Internal',
          cost: Number(m.cost || 0),
          reportedDate: m.reportedAt || m.reported_date || '',
          completionDate: m.completionDate || m.resolvedAt || '',
        }));
        setRecords(mapped);
      }
      if (availableRes.success && availableRes.data) setAssets(availableRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenNew = () => {
    setFormData({ assetId: assets[0]?.id || '', campus: user?.campus || 'Arusha Main Campus', issueDescription: '', serviceProvider: 'Internal ICT Directorate', cost: 0 });
    setIsNewTicketOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId) { showToast('Please select an asset', 'error'); return; }
    try {
      const res = await maintenanceService.create({
        asset_id: formData.assetId,
        description: formData.issueDescription,
        maintenance_date: new Date().toISOString().split('T')[0],
      });
      if (res.success) {
        showToast('Maintenance ticket opened successfully', 'success');
        setIsNewTicketOpen(false);
        fetchData();
      }
    } catch { showToast('Failed to create maintenance record', 'error'); }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const res = await maintenanceService.updateStatus(selectedRecord.id, resolveForm.status, resolveForm.resolutionNotes, resolveForm.completionDate);
      if (res.success) {
        showToast(`Ticket marked as ${resolveForm.status}`, 'success');
        setIsResolveModalOpen(false);
        fetchData();
      }
    } catch { showToast('Failed to update maintenance', 'error'); }
  };

  const columns: Column<MaintenanceRecord>[] = [
    { key: 'ticketNumber', label: 'Ticket #', sortable: true, render: (row) => <span className="font-black text-[#1B3A5C] text-xs">{row.ticketNumber}</span> },
    { key: 'assetTag', label: 'Equipment', sortable: true, render: (row) => <div><div className="font-bold text-[#1A1A1A] text-xs">{row.assetTag}</div><div className="text-[10px] text-[#6B7280]">{row.assetName} • {row.campus}</div></div> },
    { key: 'issueDescription', label: 'Issue', render: (row) => <div className="max-w-xs text-xs truncate font-medium text-[#1A1A1A]">{row.issueDescription}</div> },
    { key: 'serviceProvider', label: 'Provider & Cost', sortable: true, render: (row) => <div><div className="font-bold text-[#1A1A1A] text-xs">{row.serviceProvider}</div><div className="text-[10px] text-[#2F6650] font-semibold">{row.cost ? formatCurrency(row.cost) : 'Internal'}</div></div> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} size="sm" /> },
    { key: 'actions', label: 'Action', render: (row) => [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER, ROLES.TECHNICIAN].includes(user?.role as any) ? <button onClick={() => { setSelectedRecord(row); setIsResolveModalOpen(true); }} className="px-3 py-1.5 bg-[#1B3A5C] text-white rounded-lg text-xs font-bold uppercase">Update</button> : <span className="text-[10px] text-[#6B7280]">In Progress</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Service Desk</span><h2 className="text-2xl font-black text-[#1B3A5C]">ICT Maintenance & Repairs</h2></div>
        <div className="flex items-center gap-3"><ExportButton data={records} filename="IAA_Maintenance" exportFormat="pdf" /><button onClick={handleOpenNew} className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase text-white bg-[#1B3A5C] rounded-xl"><Plus className="w-4 h-4" />Open Ticket</button></div>
      </div>
      <Table columns={columns} data={records} loading={loading} emptyMessage="No maintenance records." emptyActionLabel="Open Ticket" onEmptyAction={handleOpenNew} searchPlaceholder="Search tickets..." />
      
      {/* New Ticket Modal */}
      <Modal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} title="Open Maintenance Ticket" maxWidth="lg" footer={<><button onClick={() => setIsNewTicketOpen(false)} className="px-4 py-2 text-xs text-[#1A1A1A]">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Create</button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Asset" name="assetId" type="select" value={formData.assetId} onChange={(e) => setFormData({ ...formData, assetId: e.target.value })} required options={assets.map((a) => ({ value: a.id, label: `${a.assetTag} — ${a.name}` }))} />
          <FormField label="Issue Description" name="issueDescription" type="textarea" rows={3} value={formData.issueDescription} onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })} required placeholder="Describe the issue..." />
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Update Ticket" maxWidth="md" footer={<><button onClick={() => setIsResolveModalOpen(false)} className="px-4 py-2 text-xs text-[#1A1A1A]">Cancel</button><button onClick={handleResolveSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Update</button></>}>
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <FormField label="Status" name="status" type="select" value={resolveForm.status} onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value as any })} options={[{ value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]} />
          <FormField label="Resolution Notes" name="resolutionNotes" type="textarea" value={resolveForm.resolutionNotes} onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceList;
