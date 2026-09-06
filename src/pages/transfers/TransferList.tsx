import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight, Check, X, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { transferService } from '../../services/transferService';
import { assetService } from '../../services/assetService';
import { campusService } from '../../services/campusService';
import { departmentService } from '../../services/departmentService';
import { AssetTransfer, Asset, Campus, Department } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ROLES } from '../../config/roles';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

export const TransferList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Campus Admin only picks a destination campus; ICT Officer only moves assets between departments in their own campus.
  const isCampusAdmin = user?.role === ROLES.CAMPUS_ADMIN;
  const isIctOfficer = user?.role === ROLES.ICT_OFFICER;

  const [formData, setFormData] = useState({
    assetId: '',
    sourceCampusId: '',
    sourceDepartmentId: '',
    destinationCampusId: '',
    destinationDepartmentId: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use allSettled so a failure on one endpoint (e.g. assets 403 for an
      // ICT officer without a campus link) doesn't blank out the other dropdowns.
      const [trfRes, astRes, campusRes, departmentRes] = await Promise.allSettled([
        transferService.getAll(),
        assetService.getAll(),
        campusService.getAll(),
        departmentService.getAll(),
      ]);
      if (trfRes.status === 'fulfilled' && trfRes.value.success && trfRes.value.data) setTransfers(trfRes.value.data);
      if (astRes.status === 'fulfilled' && astRes.value.success && astRes.value.data) setAssets(astRes.value.data);
      if (campusRes.status === 'fulfilled' && campusRes.value.success && campusRes.value.data) setCampuses(campusRes.value.data);
      if (departmentRes.status === 'fulfilled' && departmentRes.value.success && departmentRes.value.data) setDepartments(departmentRes.value.data);

      const failedRes = [trfRes, astRes, campusRes, departmentRes].find((res) => res.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failedRes) {
        showToast(failedRes.reason?.message || 'Some transfer data failed to load', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sameId = (left: string | number | undefined, right: string | number | undefined) =>
    String(left ?? '') === String(right ?? '');

  const ownCampus = (isCampusAdmin || isIctOfficer)
    ? campuses.find((campus) => campus.name === user?.campus)
    : undefined;
  const formCampusId = isIctOfficer ? ownCampus?.id : formData.sourceCampusId;
  const campusDepartments = departments.filter((department) => sameId(department.campusId, formCampusId));
  const selectableAssets = isIctOfficer
    ? assets.filter((asset) => sameId(asset.campusId, ownCampus?.id) && asset.status === 'Available')
    : assets;
  // ICT Officers only ever move assets within their own campus, so restrict the list to those transfers.
  const visibleTransfers = isIctOfficer
    ? transfers.filter((transfer) => transfer.fromCampus === user?.campus && transfer.toCampus === user?.campus)
    : transfers;

  const handleOpenNew = () => {
    const selectedCampus = (isCampusAdmin || isIctOfficer)
      ? campuses.find((campus) => campus.name === user?.campus) || campuses[0]
      : campuses[0];
    const selectedCampusDepartments = departments.filter((department) => sameId(department.campusId, selectedCampus?.id));
    const ownDepartment = selectedCampusDepartments.find((department) => department.name === user?.department) || selectedCampusDepartments[0];
    const otherDepartment = selectedCampusDepartments.find((department) => !sameId(department.id, ownDepartment?.id)) || selectedCampusDepartments[0];
    const otherCampus = campuses.find((campus) => !sameId(campus.id, selectedCampus?.id)) || campuses[0];
    const selectedAssets = isIctOfficer
      ? assets.filter((asset) => sameId(asset.campusId, selectedCampus?.id) && asset.status === 'Available')
      : assets;

    setFormData({
      assetId: selectedAssets[0]?.id || '',
      sourceCampusId: selectedCampus?.id?.toString() || '',
      sourceDepartmentId: isIctOfficer ? ownDepartment?.id || '' : '',
      destinationCampusId: isIctOfficer ? ownCampus?.id?.toString() || '' : (otherCampus?.id?.toString() || ''),
      destinationDepartmentId: isIctOfficer ? otherDepartment?.id || '' : '',
      transferDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === formData.assetId);
    if (!asset) {
      showToast('Please select a valid asset to transfer', 'error');
      return;
    }
    if (!formData.reason.trim()) {
      showToast('Please specify the official reason for the transfer', 'error');
      return;
    }

    if (isIctOfficer) {
      if (!formData.sourceDepartmentId || !formData.destinationDepartmentId) {
        showToast('Please select both source and destination departments', 'error');
        return;
      }
      if (formData.sourceDepartmentId === formData.destinationDepartmentId) {
        showToast('Source and destination departments must be different', 'error');
        return;
      }
    } else {
      if (!formData.destinationCampusId) {
        showToast('Please select a destination campus', 'error');
        return;
      }
      if (formData.sourceCampusId === formData.destinationCampusId) {
        showToast('Destination campus must be different from your own campus', 'error');
        return;
      }
    }

    try {
      const res = await transferService.create({
        asset_id: asset.id,
        from_campus_id: Number(formData.sourceCampusId),
        to_campus_id: Number(isIctOfficer ? formData.sourceCampusId : formData.destinationCampusId),
        ...(isIctOfficer ? { from_dept_id: Number(formData.sourceDepartmentId), to_dept_id: Number(formData.destinationDepartmentId) } : {}),
        transfer_date: formData.transferDate,
        reason: formData.reason,
        status: 'Pending',
      });

      if (res.success) {
        await assetService.update(asset.id, { status: 'Assigned' });
        showToast('Transfer request submitted successfully', 'success');
        setIsModalOpen(false);
        fetchData();
      }
    } catch {
      showToast('Failed to submit transfer request', 'error');
    }
  };

  const columns: Column<AssetTransfer>[] = [
    { key: 'transferNumber', label: 'Transfer No.', sortable: true, render: (row) => <span className="font-bold text-(--color-navy)">{row.transferNumber}</span> },
    { key: 'assetName', label: 'Asset', sortable: true, render: (row) => <div><div className="font-bold text-[#1A1A1A] text-xs">{row.assetName}</div><div className="text-[10px] text-[#6B7280]">{row.assetId}</div></div> },
    { key: 'route', label: 'Route', render: (row) => <div className="flex items-center gap-2 text-xs"><span>{row.fromCampus}<small className="block text-[10px] text-[#6B7280]">{row.fromDepartment}</small></span><ArrowLeftRight className="w-3.5 h-3.5 text-[#6B7280]" /><span>{row.toCampus}<small className="block text-[10px] text-[#6B7280]">{row.toDepartment}</small></span></div> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} size="sm" /> },
    { key: 'actions', label: 'Actions', render: (row) => {
      const canAuthorize = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HEAD_OF_DEPARTMENT].includes(user?.role as any);
      if (row.status === 'Pending' && canAuthorize) {
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => handleStatusUpdate(row.id, 'Approved')} className="px-3 py-1.5 bg-[#2F6650] text-white rounded-lg text-xs font-bold">Approve</button>
            <button onClick={() => handleStatusUpdate(row.id, 'Rejected')} className="px-3 py-1.5 bg-[#8B232A] text-white rounded-lg text-xs font-bold">Reject</button>
          </div>
        );
      }
      return <span className="text-[11px] text-[#6B7280]">No action</span>;
    }},
  ];

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await transferService.updateStatus(id, status);
    if (res.success) {
      showToast(`Transfer updated to ${status}`, 'success');
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><span className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Logistics</span><h2 className="text-2xl font-black text-[#1B3A5C]">Inter-Campus Transfers</h2></div>
        <div className="flex gap-2">
          <ExportButton data={visibleTransfers} filename="IAA_Asset_Transfers" exportFormat="pdf" />
          {!isIctOfficer && (
            <button onClick={handleOpenNew} className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#1B3A5C] rounded-xl"><Plus className="w-4 h-4" />New Transfer</button>
          )}
        </div>
      </div>
      <Table columns={columns} data={visibleTransfers} loading={loading} emptyMessage="No transfers found." />
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initiate Transfer" maxWidth="lg" footer={<><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Submit</button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Asset" name="assetId" type="select" value={formData.assetId} onChange={(e) => setFormData({ ...formData, assetId: e.target.value })} required options={selectableAssets.map((asset) => ({ value: asset.id, label: `${asset.assetTag} — ${asset.name}` }))} />
          {isIctOfficer ? (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Source Department" name="sourceDepartmentId" type="select" value={formData.sourceDepartmentId} onChange={(e) => setFormData({ ...formData, sourceDepartmentId: e.target.value })} required options={campusDepartments.map((department) => ({ value: department.id, label: department.name }))} />
              <FormField label="Destination Department" name="destinationDepartmentId" type="select" value={formData.destinationDepartmentId} onChange={(e) => setFormData({ ...formData, destinationDepartmentId: e.target.value })} required options={campusDepartments.map((department) => ({ value: department.id, label: department.name }))} />
            </div>
          ) : isCampusAdmin ? (
            <FormField label="Destination Campus" name="destinationCampusId" type="select" value={formData.destinationCampusId} onChange={(e) => setFormData({ ...formData, destinationCampusId: e.target.value })} required options={campuses.filter((c) => c.id?.toString() !== formData.sourceCampusId).map((c) => ({ value: c.id?.toString() || '', label: c.name }))} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Source Campus" name="sourceCampusId" type="select" value={formData.sourceCampusId} onChange={(e) => setFormData({ ...formData, sourceCampusId: e.target.value })} options={campuses.map((c) => ({ value: c.id?.toString() || '', label: c.name }))} />
              <FormField label="Destination Campus" name="destinationCampusId" type="select" value={formData.destinationCampusId} onChange={(e) => setFormData({ ...formData, destinationCampusId: e.target.value })} options={campuses.map((c) => ({ value: c.id?.toString() || '', label: c.name }))} />
            </div>
          )}
          <FormField label="Reason" name="reason" type="textarea" rows={3} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
        </form>
      </Modal>
    </div>
  );
};

export default TransferList;
