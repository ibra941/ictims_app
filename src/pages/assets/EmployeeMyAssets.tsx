import React, { useEffect, useState } from 'react';
import { ClipboardList, Laptop, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { assetService } from '../../services/assetService';
import { maintenanceService } from '../../services/maintenanceService';
import { Asset, MaintenanceRecord } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import { formatDate } from '../../utils/formatters';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EmployeeMyAssets: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceAsset, setMaintenanceAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    requesterName: user?.name || user?.username || '', requesterDepartment: user?.department || '',
    requesterContact: user?.phone || '', issueDescription: '', requestReason: '', requesterSignature: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsResponse, requestsResponse] = await Promise.all([
        assetService.getAll(),
        maintenanceService.getAll(),
      ]);
      if (assetsResponse.success && assetsResponse.data) setAssets(assetsResponse.data);
      if (requestsResponse.success && requestsResponse.data) setRequests(requestsResponse.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openMaintenanceForm = (asset: Asset) => {
    setMaintenanceAsset(asset);
    setFormData({ requesterName: user?.name || user?.username || '', requesterDepartment: user?.department || '', requesterContact: user?.phone || '', issueDescription: '', requestReason: '', requesterSignature: '' });
  };

  const submitMaintenanceRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!maintenanceAsset || !formData.requesterName.trim() || !formData.requesterDepartment.trim() || !formData.requesterContact.trim() || !formData.issueDescription.trim() || !formData.requestReason.trim() || !formData.requesterSignature.trim()) {
      showToast('Complete all maintenance request fields, including your electronic signature', 'error');
      return;
    }
    try {
      const response = await maintenanceService.create({
        assetId: maintenanceAsset.id, issueDescription: formData.issueDescription.trim(), requestReason: formData.requestReason.trim(),
        requesterName: formData.requesterName.trim(), requesterDepartment: formData.requesterDepartment.trim(),
        requesterContact: formData.requesterContact.trim(), requesterSignature: formData.requesterSignature.trim(),
        maintenance_date: new Date().toISOString().split('T')[0],
      });
      if (!response.success) throw new Error(response.message || 'Failed to submit maintenance request');
      showToast(response.message || 'Maintenance request submitted', 'success');
      setMaintenanceAsset(null);
      loadData();
    } catch (error: any) {
      showToast(error?.message || 'Failed to submit maintenance request', 'error');
    }
  };

  if (loading) {
    return <Loading message="Loading your assigned assets and requests..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">{user?.role === 'Lab Manager' ? 'Lab manager self-service' : 'Employee self-service'}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1B3A5C]">My Assets</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Assigned equipment and maintenance requests for your campus.</p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#E9EBEF] bg-white px-4 py-2 text-xs font-bold text-[#1B3A5C] shadow-xs">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2"><Laptop className="h-4 w-4 text-[#1B3A5C]" /><h2 className="text-sm font-black text-[#1B3A5C]">Assigned assets</h2></div>
        {assets.length === 0 ? <p className="rounded-xl bg-[#F7F8FA] p-5 text-sm text-[#6B7280]">No assets are currently assigned to you.</p> : <div className="grid gap-3 sm:grid-cols-2">{assets.map((asset) => <div key={asset.id} className="rounded-xl border border-[#E9EBEF] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#1B3A5C]">{asset.name}</p><p className="mt-1 text-xs text-[#6B7280]">{asset.assetTag} · {asset.brand} {asset.model}</p></div><StatusBadge status={asset.status} size="sm" /></div><p className="mt-3 text-xs text-[#6B7280]">{asset.campus} · {asset.department}</p>{asset.status === 'Assigned' && <button type="button" onClick={() => openMaintenanceForm(asset)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B3A5C] px-3 py-2 text-xs font-bold text-white"><ClipboardList className="h-4 w-4" />Request Maintenance</button>}</div>)}</div>}
      </section>

      <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#1B3A5C]" /><h2 className="text-sm font-black text-[#1B3A5C]">Request history</h2></div>
        {requests.length === 0 ? <p className="rounded-xl bg-[#F7F8FA] p-5 text-sm text-[#6B7280]">You have not submitted any asset requests.</p> : <div className="divide-y divide-[#F0F1F3]">{requests.map((request) => <div key={request.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#1B3A5C]">{request.assetTag} · {request.assetName}</p><p className="mt-1 text-xs text-[#6B7280]">{request.issueDescription} · {formatDate(request.reportedDate)}</p></div><StatusBadge status={request.status} size="sm" /></div>)}</div>}
      </section>

      <Modal isOpen={Boolean(maintenanceAsset)} onClose={() => setMaintenanceAsset(null)} title={`Maintenance Request: ${maintenanceAsset?.name || ''}`} maxWidth="lg" footer={<><button type="button" onClick={() => setMaintenanceAsset(null)} className="px-4 py-2 text-xs">Cancel</button><button type="button" onClick={submitMaintenanceRequest} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Sign & Submit</button></>}>
        <form onSubmit={submitMaintenanceRequest} className="space-y-4">
          <div className="rounded-lg bg-[#F5F6F8] p-3 text-xs text-[#1A1A1A]">{maintenanceAsset?.assetTag} - {maintenanceAsset?.name}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Your Name" name="requesterName" value={formData.requesterName} onChange={(event) => setFormData({ ...formData, requesterName: event.target.value })} required />
            <FormField label="Department" name="requesterDepartment" value={formData.requesterDepartment} onChange={(event) => setFormData({ ...formData, requesterDepartment: event.target.value })} required />
            <FormField label="Contact Information" name="requesterContact" value={formData.requesterContact} onChange={(event) => setFormData({ ...formData, requesterContact: event.target.value })} required />
            <FormField label="Electronic Signature" name="requesterSignature" value={formData.requesterSignature} onChange={(event) => setFormData({ ...formData, requesterSignature: event.target.value })} required />
          </div>
          <FormField label="Asset Issue" name="issueDescription" type="textarea" rows={3} value={formData.issueDescription} onChange={(event) => setFormData({ ...formData, issueDescription: event.target.value })} required />
          <FormField label="Reason for Maintenance" name="requestReason" type="textarea" rows={3} value={formData.requestReason} onChange={(event) => setFormData({ ...formData, requestReason: event.target.value })} required />
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeMyAssets;
