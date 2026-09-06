import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { assetService } from '../../services/assetService';
import { disposalService } from '../../services/disposalService';
import { Asset } from '../../types';
import { downloadBrandedPDFReport } from '../../utils/reportExportHelper';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';

export const DisposalList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    method: 'Auction', reason: '', disposalDate: new Date().toISOString().split('T')[0],
    disposalOfficer: user?.name || user?.username || '', disposalOfficerRole: user?.role || '',
    disposalOfficerCampus: user?.campus || '', disposalOfficerSignature: '', destination: '',
    recipientOrganization: '', recipientName: '', recipientPosition: '', recipientContact: '', recipientSignature: '',
    procurementSignatory: '', procurementOfficerEmail: '', campusAdminSignatory: '', campusAdminEmail: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const assetResponse = await assetService.getAll();
      if (assetResponse.success && assetResponse.data) setAssets(assetResponse.data.filter((asset) => asset.disposalReady && asset.status === 'Disposed'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const selectedAssets = assets.filter((asset) => selectedIds.has(asset.id));
  const toggleAsset = (id: string) => setSelectedIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const submitDisposal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAssets.length || !formData.reason.trim() || !formData.disposalOfficer.trim() || !formData.disposalOfficerRole.trim() || !formData.disposalOfficerCampus.trim() || !formData.disposalOfficerSignature.trim() || !formData.destination.trim() || !formData.recipientOrganization.trim() || !formData.recipientName.trim() || !formData.recipientPosition.trim() || !formData.recipientSignature.trim() || !formData.procurementSignatory.trim() || !formData.procurementOfficerEmail.trim() || !formData.campusAdminSignatory.trim() || !formData.campusAdminEmail.trim()) {
      showToast('Complete all removal, recipient, and electronic approval fields', 'error');
      return;
    }
    try {
      const result = await disposalService.create({
        asset_ids: selectedAssets.map((asset) => asset.id), method: formData.method,
        reason: formData.reason.trim(), disposal_date: formData.disposalDate,
        disposal_officer: formData.disposalOfficer.trim(), disposal_officer_role: formData.disposalOfficerRole.trim(),
        disposal_officer_campus: formData.disposalOfficerCampus.trim(), disposal_officer_signature: formData.disposalOfficerSignature.trim(),
        destination: formData.destination.trim(), recipient_organization: formData.recipientOrganization.trim(),
        recipient_name: formData.recipientName.trim(), recipient_position: formData.recipientPosition.trim(),
        recipient_contact: formData.recipientContact.trim(), recipient_signature: formData.recipientSignature.trim(),
        procurement_signatory: formData.procurementSignatory.trim(), procurement_officer_email: formData.procurementOfficerEmail.trim(),
        campus_admin_signatory: formData.campusAdminSignatory.trim(), campus_admin_email: formData.campusAdminEmail.trim(),
      });
      if (!result.success) throw new Error(result.message || 'Disposal failed');
      await downloadBrandedPDFReport(selectedAssets.map((asset) => ({
        'Asset Tag': asset.assetTag || asset.serialNumber, Asset: asset.name, Destination: formData.destination,
        Recipient: `${formData.recipientOrganization} - ${formData.recipientName} (${formData.recipientPosition})`,
        'Removal Officer': `${formData.disposalOfficer}, ${formData.disposalOfficerRole}, ${formData.disposalOfficerCampus}`,
        'Officer E-Signature': formData.disposalOfficerSignature, 'Recipient E-Signature': formData.recipientSignature,
        'Procurement E-Signature': formData.procurementSignatory, 'Campus Admin Approval': formData.campusAdminSignatory,
        Method: formData.method, Reason: formData.reason, Date: formData.disposalDate,
      })), { reportTitle: 'Complete Asset Removal Form', filename: `asset_removal_${Date.now()}`, generatedBy: formData.procurementSignatory, campus: formData.disposalOfficerCampus });
      showToast(result.message || 'Assets permanently removed and PDF form downloaded', 'success');
      setIsModalOpen(false);
      setSelectedIds(new Set());
      fetchData();
    } catch (error: any) { showToast(error?.message || 'Disposal failed', 'error'); }
  };

  const assetColumns: Column<Asset>[] = [
    {
      key: 'select',
      label: <input type="checkbox" aria-label="Select all assets" checked={assets.length > 0 && selectedIds.size === assets.length} onChange={(event) => setSelectedIds(event.target.checked ? new Set(assets.map((asset) => asset.id)) : new Set())} className="w-4 h-4" />,
      render: (row) => <input type="checkbox" aria-label={`Select ${row.name}`} checked={selectedIds.has(row.id)} onChange={() => toggleAsset(row.id)} className="w-4 h-4" />,
    },
    { key: 'assetTag', label: 'Tag', render: (row) => <span className="font-bold">{row.assetTag}</span> },
    { key: 'name', label: 'Asset', sortable: true },
    { key: 'category', label: 'Type', sortable: true },
    { key: 'campus', label: 'Campus', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div><h2 className="text-2xl font-black text-[#1B3A5C]">Asset Disposal</h2><p className="text-xs text-[#6B7280] mt-1">Assets cancelled from maintenance are ready for final disposal.</p></div>
        <button type="button" disabled={!selectedAssets.length} onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-[#8B232A] text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" />Complete Removal ({selectedAssets.length})</button>
      </div>
      <Table columns={assetColumns} data={assets} loading={loading} emptyMessage="No maintenance-cancelled assets are awaiting disposal." searchPlaceholder="Search assets..." />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Complete Asset Removal: ${selectedAssets.length} Asset(s)`} maxWidth="xl" footer={<><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs">Cancel</button><button type="button" onClick={submitDisposal} className="px-4 py-2 text-xs text-white bg-[#8B232A]">Approve & Remove</button></>}>
        <form onSubmit={submitDisposal} className="space-y-4">
          <div className="rounded-lg bg-[#F5F6F8] p-3 text-xs text-[#1A1A1A]">{selectedAssets.map((asset) => `${asset.assetTag} - ${asset.name}`).join(', ')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Disposal Method" name="method" type="select" value={formData.method} onChange={(event) => setFormData({ ...formData, method: event.target.value })} options={['Auction', 'Donation', 'Scrap', 'Write-off'].map((method) => ({ value: method, label: method }))} />
            <FormField label="Disposal Date" name="disposalDate" type="date" value={formData.disposalDate} onChange={(event) => setFormData({ ...formData, disposalDate: event.target.value })} required />
            <FormField label="Removal Officer Name" name="disposalOfficer" value={formData.disposalOfficer} onChange={(event) => setFormData({ ...formData, disposalOfficer: event.target.value })} required />
            <FormField label="Removal Officer Role" name="disposalOfficerRole" value={formData.disposalOfficerRole} onChange={(event) => setFormData({ ...formData, disposalOfficerRole: event.target.value })} required />
            <FormField label="Removal Officer Campus" name="disposalOfficerCampus" value={formData.disposalOfficerCampus} onChange={(event) => setFormData({ ...formData, disposalOfficerCampus: event.target.value })} required />
            <FormField label="Removal Officer Electronic Signature" name="disposalOfficerSignature" value={formData.disposalOfficerSignature} onChange={(event) => setFormData({ ...formData, disposalOfficerSignature: event.target.value })} required />
            <FormField label="Destination / Where Assets Go" name="destination" value={formData.destination} onChange={(event) => setFormData({ ...formData, destination: event.target.value })} required />
            <FormField label="Receiving Organization" name="recipientOrganization" value={formData.recipientOrganization} onChange={(event) => setFormData({ ...formData, recipientOrganization: event.target.value })} required />
            <FormField label="Recipient Name" name="recipientName" value={formData.recipientName} onChange={(event) => setFormData({ ...formData, recipientName: event.target.value })} required />
            <FormField label="Recipient Position" name="recipientPosition" value={formData.recipientPosition} onChange={(event) => setFormData({ ...formData, recipientPosition: event.target.value })} required />
            <FormField label="Recipient Contact" name="recipientContact" value={formData.recipientContact} onChange={(event) => setFormData({ ...formData, recipientContact: event.target.value })} />
            <FormField label="Recipient Electronic Signature" name="recipientSignature" value={formData.recipientSignature} onChange={(event) => setFormData({ ...formData, recipientSignature: event.target.value })} required />
            <FormField label="Procurement Officer Electronic Signature" name="procurementSignatory" value={formData.procurementSignatory} onChange={(event) => setFormData({ ...formData, procurementSignatory: event.target.value })} required />
            <FormField label="Procurement Officer Email" name="procurementOfficerEmail" type="email" value={formData.procurementOfficerEmail} onChange={(event) => setFormData({ ...formData, procurementOfficerEmail: event.target.value })} required />
            <FormField label="Campus Admin Electronic Approval" name="campusAdminSignatory" value={formData.campusAdminSignatory} onChange={(event) => setFormData({ ...formData, campusAdminSignatory: event.target.value })} required />
            <FormField label="Campus Admin Email" name="campusAdminEmail" type="email" value={formData.campusAdminEmail} onChange={(event) => setFormData({ ...formData, campusAdminEmail: event.target.value })} required />
          </div>
          <FormField label="Reason for Disposal" name="reason" type="textarea" rows={3} value={formData.reason} onChange={(event) => setFormData({ ...formData, reason: event.target.value })} required />
        </form>
      </Modal>
    </div>
  );
};

export default DisposalList;
