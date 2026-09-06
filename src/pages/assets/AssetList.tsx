import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Send, Check, X, Download, ChevronDown, Wrench, ArrowLeftRight, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { assetService } from '../../services/assetService';
import { categoryService, AssetCategoryRecord } from '../../services/categoryService';
import { maintenanceService } from '../../services/maintenanceService';
import { assetRequestService, AssetRequest } from '../../services/assetRequestService';
import { transferService } from '../../services/transferService';
import { disposalService } from '../../services/disposalService';
import { assignmentService } from '../../services/assignmentService';
import { employeeService } from '../../services/employeeService';
import { Asset, AssetStatus, AssignmentLocation, Campus, Department, Employee } from '../../types';
import { ASSET_STATUSES } from '../../utils/constants';
import { campusService } from '../../services/campusService';
import { departmentService } from '../../services/departmentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { downloadPDFReport } from '../../utils/reportExportHelper';
import { ROLES } from '../../config/roles';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';

const ASSET_TYPES = ['Hardware', 'Software', 'All'];

export const AssetList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignmentLocations, setAssignmentLocations] = useState<AssignmentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [requestAsset, setRequestAsset] = useState<Asset | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [transferAsset, setTransferAsset] = useState<Asset | null>(null);
  const [assignmentAsset, setAssignmentAsset] = useState<Asset | null>(null);
  const [transferFormData, setTransferFormData] = useState({ sourceDepartmentId: '', destinationDepartmentId: '', reason: '', transferDate: new Date().toISOString().split('T')[0] });

  // Bulk action states
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [bulkActionModal, setBulkActionModal] = useState<{ open: boolean; action: 'transfer' | 'maintenance' | 'disposal' | null }>({ open: false, action: null });
  const [bulkFormData, setBulkFormData] = useState({ destinationCampusId: '', reason: '' });
  const [assignmentFormData, setAssignmentFormData] = useState({ departmentId: '', employeeId: '', assignmentType: 'Department', locationName: '', assignDate: new Date().toISOString().split('T')[0] });

  // Filters
  const [filterCampus, setFilterCampus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    model: '',
    campusId: '',
    categoryId: '',
    status: 'Available' as AssetStatus,
    cost: 0,
    purchaseDate: '',
    location: '',
  });

  const fetchAssets = async () => {
    setLoading(true);
    const res = await assetService.getAll();
    if (res.success && res.data) setAssets(res.data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([fetchAssets(), campusService.getAll(), departmentService.getAll(), categoryService.getAll(), employeeService.getAll()]).then(([, campusResponse, deptResponse, categoryResponse, employeeResponse]) => {
      if (campusResponse.success && campusResponse.data) setCampuses(campusResponse.data);
      if (deptResponse.success && deptResponse.data) setDepartments(deptResponse.data);
      if (categoryResponse.success && categoryResponse.data) setCategories(categoryResponse.data);
      if (employeeResponse.success && employeeResponse.data) setEmployees(employeeResponse.data);
    });
  }, []);

  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const isIctOfficer = user?.role === ROLES.ICT_OFFICER;
  const isOverallAdmin = user?.role === ROLES.OVERALL_ADMIN;
  const canManageAssets = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER].includes(user?.role as any);
  // ICT Officers move assets department-to-department within their own campus via a dedicated row action,
  // not the bulk campus-to-campus transfer used by Campus Admins.
  const canTransfer = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HEAD_OF_DEPARTMENT].includes(user?.role as any);
  const canMaintain = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER].includes(user?.role as any);
  const canDispose = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER].includes(user?.role as any);
  const canAssign = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER].includes(user?.role as any);

  useEffect(() => {
    if (isEmployee || isIctOfficer) {
      assetRequestService.getAll().then((response) => {
        if (response.success && response.data) setRequests(response.data);
      });
    }
  }, [isEmployee, isIctOfficer]);

  // Derived filters
  const departmentsForCampus = filterCampus !== 'All' ? departments.filter((d) => d.campus === filterCampus) : departments;
  const filteredAssets = assets
    .filter((a) => filterCampus === 'All' || a.campus === filterCampus)
    .filter((a) => filterDepartment === 'All' || a.department === filterDepartment)
    .filter((a) => filterType === 'All' || a.categoryType === filterType)
    .filter((a) => filterStatus === 'All' || a.status === filterStatus);

  const handleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleSelectAll = (toSelect: boolean) => {
    if (toSelect) {
      const newSelected = new Set(filteredAssets.map((a) => a.id));
      setSelectedAssets(newSelected);
    } else {
      setSelectedAssets(new Set());
    }
  };

  const handleBulkAction = async (action: 'transfer' | 'maintenance' | 'disposal') => {
    if (selectedAssets.size === 0) {
      showToast('Please select at least one asset', 'error');
      return;
    }
    setBulkActionModal({ open: true, action });
  };

  const handleBulkActionSubmit = async () => {
    if (selectedAssets.size === 0 || !bulkActionModal.action) return;

    try {
      let successCount = 0;
      const selectedAssetList = Array.from(selectedAssets).map((id) => assets.find((a) => a.id === id)).filter(Boolean) as Asset[];

      if (bulkActionModal.action === 'transfer') {
        for (const asset of selectedAssetList) {
          await transferService.create({
            asset_id: asset.id,
            from_campus_id: Number(asset.campusId),
            to_campus_id: Number(bulkFormData.destinationCampusId),
            transfer_date: new Date().toISOString().split('T')[0],
            reason: bulkFormData.reason,
            status: 'Pending',
          });
          successCount++;
        }
      } else if (bulkActionModal.action === 'maintenance') {
        for (const asset of selectedAssetList) {
          await maintenanceService.create({
            asset_id: asset.id,
            description: bulkFormData.reason || 'Bulk maintenance request',
            maintenance_date: new Date().toISOString().split('T')[0],
            status: 'In Progress',
          });
          successCount++;
        }
      } else if (bulkActionModal.action === 'disposal') {
        for (const asset of selectedAssetList) {
          await disposalService.create({
            asset_id: asset.id,
            method: 'Write-off',
            reason: bulkFormData.reason || 'Bulk disposal',
            disposal_date: new Date().toISOString().split('T')[0],
          });
          successCount++;
        }
      }

      showToast(`${successCount} asset(s) processed successfully`, 'success');
      setBulkActionModal({ open: false, action: null });
      setSelectedAssets(new Set());
      setBulkFormData({ destinationCampusId: '', reason: '' });
      fetchAssets();
    } catch (error: any) {
      showToast(`Error: ${error.message || 'Failed to process bulk action'}`, 'error');
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAsset || !requestReason.trim()) {
      showToast('Please provide a reason for this request', 'error');
      return;
    }
    try {
      await assetRequestService.create(requestAsset.id, requestReason.trim());
      showToast('Asset request submitted for ICT approval', 'success');
      setRequestAsset(null);
      setRequestReason('');
      const response = await assetRequestService.getAll();
      if (response.success && response.data) setRequests(response.data);
    } catch (error: any) {
      showToast(error.message || 'Failed to submit asset request', 'error');
    }
  };

  const handleRequestStatus = async (request: AssetRequest, status: 'Approved' | 'Rejected') => {
    try {
      await assetRequestService.updateStatus(request.id, status);
      showToast(`Asset request ${status.toLowerCase()}`, 'success');
      await fetchAssets();
      const response = await assetRequestService.getAll();
      if (response.success && response.data) setRequests(response.data);
    } catch (error: any) {
      showToast(error.message || 'Failed to update asset request', 'error');
    }
  };

  const sameId = (left: string | number | undefined, right: string | number | undefined) =>
    String(left ?? '') === String(right ?? '');
  const ownCampus = isIctOfficer ? campuses.find((campus) => campus.name === user?.campus) : undefined;
  const campusDepartments = departments.filter((department) => sameId(department.campusId, ownCampus?.id));

  const handleOpenTransfer = (asset: Asset) => {
    const sourceDepartment = campusDepartments.find((department) => sameId(department.id, asset.departmentId)) || campusDepartments[0];
    const otherDepartment = campusDepartments.find((department) => !sameId(department.id, sourceDepartment?.id)) || campusDepartments[0];
    setTransferAsset(asset);
    setTransferFormData({
      sourceDepartmentId: sourceDepartment?.id || '',
      destinationDepartmentId: otherDepartment?.id || '',
      reason: '',
      transferDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAsset) return;
    if (!transferFormData.sourceDepartmentId || !transferFormData.destinationDepartmentId) {
      showToast('Please select both source and destination departments', 'error');
      return;
    }
    if (transferFormData.sourceDepartmentId === transferFormData.destinationDepartmentId) {
      showToast('Source and destination departments must be different', 'error');
      return;
    }
    if (!transferFormData.reason.trim()) {
      showToast('Please specify the official reason for the transfer', 'error');
      return;
    }
    try {
      const res = await transferService.create({
        asset_id: transferAsset.id,
        from_campus_id: Number(ownCampus?.id),
        to_campus_id: Number(ownCampus?.id),
        from_dept_id: Number(transferFormData.sourceDepartmentId),
        to_dept_id: Number(transferFormData.destinationDepartmentId),
        transfer_date: transferFormData.transferDate,
        reason: transferFormData.reason,
        status: 'Pending',
      });
      if (res.success) {
        await assetService.update(transferAsset.id, { status: 'Assigned' });
        showToast('Transfer request submitted successfully', 'success');
        setTransferAsset(null);
        fetchAssets();
      }
    } catch {
      showToast('Failed to submit transfer request', 'error');
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedAsset(null);
    setFormData({ serialNumber: '', name: '', model: '', campusId: '', categoryId: '', status: 'Available', cost: 0, purchaseDate: '', location: '' });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setIsEditing(true);
    setSelectedAsset(asset);
    setFormData({ serialNumber: asset.serialNumber, name: asset.name, model: asset.model, campusId: asset.campusId?.toString() || '', categoryId: asset.categoryId?.toString() || '', status: asset.status, cost: asset.cost, purchaseDate: asset.purchaseDate || '', location: asset.location || '' });
    setIsFormModalOpen(true);
  };

  const assignmentDepartments = departments.filter((department) => sameId(department.campusId, assignmentAsset?.campusId));
  const assignmentEmployees = employees.filter((employee) => employee.campus === assignmentAsset?.campus);
  const matchingLocations = assignmentLocations.filter((location) => location.type === assignmentFormData.assignmentType);

  const handleOpenAssign = async (asset: Asset) => {
    if (asset.status !== 'Available') {
      showToast('Only available assets can be assigned', 'error');
      return;
    }
    setAssignmentAsset(asset);
    const department = departments.find((item) => sameId(item.id, asset.departmentId) && sameId(item.campusId, asset.campusId))
      || departments.find((item) => sameId(item.campusId, asset.campusId));
    setAssignmentFormData({ departmentId: department?.id || '', employeeId: '', assignmentType: 'Department', locationName: '', assignDate: new Date().toISOString().split('T')[0] });
    const response = await assignmentService.getLocations(asset.campusId);
    if (response.success && response.data) setAssignmentLocations(response.data);
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignmentAsset || !assignmentFormData.departmentId || !assignmentFormData.employeeId) {
      showToast('Select a department and employee or custodian', 'error');
      return;
    }
    if (assignmentFormData.assignmentType !== 'Department' && !assignmentFormData.locationName.trim()) {
      showToast('Select or enter the lab or office name', 'error');
      return;
    }
    try {
      const response = await assignmentService.create({ assetId: assignmentAsset.id, employeeId: assignmentFormData.employeeId, departmentId: assignmentFormData.departmentId, assignmentType: assignmentFormData.assignmentType, locationName: assignmentFormData.locationName, assignDate: assignmentFormData.assignDate });
      if (!response.success) throw new Error(response.message || 'Failed to assign asset');
      showToast('Asset assigned successfully', 'success');
      setAssignmentAsset(null);
      fetchAssets();
    } catch (error: any) {
      showToast(error?.message || 'Failed to assign asset', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, categoryId: formData.categoryId ? Number(formData.categoryId) : undefined };
      if (isEditing && selectedAsset) {
        await assetService.update(selectedAsset.id, payload);
        showToast('Asset updated successfully', 'success');
      } else {
        await assetService.create(payload);
        showToast('Asset registered successfully', 'success');
      }
      setIsFormModalOpen(false);
      fetchAssets();
    } catch {
      showToast('Failed to save asset', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      await downloadPDFReport(filteredAssets, {
        reportTitle: 'ICT Assets Registry',
        reportSubtitle: `Campus: ${filterCampus} | Department: ${filterDepartment} | Status: ${filterStatus}`,
        campusFilter: filterCampus !== 'All' ? filterCampus : 'All Campuses',
        departmentFilter: filterDepartment !== 'All' ? filterDepartment : undefined,
        statusFilter: filterStatus !== 'All' ? filterStatus : 'All',
        generatedBy: user?.name || user?.username,
        reportType: 'full_inventory',
      });
      showToast('PDF exported successfully', 'success');
    } catch (error: any) {
      showToast(`Failed to export PDF: ${error.message}`, 'error');
    }
  };

  const columns: Column<Asset>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedAssets.has(row.id)}
          onChange={() => handleSelectAsset(row.id)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
    { key: 'assetTag', label: 'Tag', render: (row) => <span className="font-black text-[#1B3A5C]">{row.assetTag}</span> },
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'category', label: 'Type', render: (row) => <span className="text-xs">{row.category}</span> },
    ...(isOverallAdmin ? [{ key: 'campus', label: 'Campus', render: (row: Asset) => row.campus || '—' }] : []),
    { key: 'department', label: 'Department', render: (row) => row.department || '—' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'cost', label: 'Cost', render: (row) => formatCurrency(row.cost) },
  ];

  // Edit, per-asset transfer, and request only make sense for a single selected asset.
  const singleSelectedAsset = selectedAssets.size === 1
    ? assets.find((a) => selectedAssets.has(a.id)) || null
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1B3A5C]">ICT Assets Registry</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200">
            <Download className="w-4 h-4" /> Get PDF
          </button>
          {canManageAssets && (
            <button onClick={handleOpenAdd} className="bg-[#1B3A5C] text-white px-4 py-2 rounded-lg text-xs font-bold">
              <Plus className="w-4 h-4 inline" /> Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs space-y-4">
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isOverallAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {/* Campus Filter */}
          {isOverallAdmin && (
            <div>
              <label className="block text-xs font-bold text-[#6B7280] mb-2">Campus</label>
              <select value={filterCampus} onChange={(e) => { setFilterCampus(e.target.value); setFilterDepartment('All'); }} className="w-full px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]">
                <option value="All">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-bold text-[#6B7280] mb-2">Department</label>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="w-full px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]">
              <option value="All">All Departments</option>
              {departmentsForCampus.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-bold text-[#6B7280] mb-2">Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]">
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-[#6B7280] mb-2">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]">
              <option value="All">All Statuses</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAssets.size > 0 && (
        <div className="rounded-2xl border border-[#1B3A5C]/20 bg-[#1B3A5C]/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#1B3A5C]">{selectedAssets.size} asset(s) selected</span>
          <div className="flex flex-wrap gap-2">
            {isEmployee && (
              <button onClick={() => singleSelectedAsset && setRequestAsset(singleSelectedAsset)} disabled={!singleSelectedAsset} title={!singleSelectedAsset ? 'Select exactly one asset' : undefined} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#1B3A5C] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                <Send className="w-3.5 h-3.5" /> Request
              </button>
            )}
            {canManageAssets && (
              <button onClick={() => singleSelectedAsset && handleOpenEdit(singleSelectedAsset)} disabled={!singleSelectedAsset} title={!singleSelectedAsset ? 'Select exactly one asset' : undefined} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-600 hover:bg-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {canAssign && (
              <button onClick={() => singleSelectedAsset && handleOpenAssign(singleSelectedAsset)} disabled={!singleSelectedAsset || singleSelectedAsset.status !== 'Available'} title={!singleSelectedAsset ? 'Select exactly one available asset' : singleSelectedAsset.status !== 'Available' ? 'Only available assets can be assigned' : undefined} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                Assign
              </button>
            )}
            {isIctOfficer && (
              <button onClick={() => singleSelectedAsset && handleOpenTransfer(singleSelectedAsset)} disabled={!singleSelectedAsset} title={!singleSelectedAsset ? 'Select exactly one asset' : 'Transfer between departments'} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
              </button>
            )}
            {canTransfer && (
              <button onClick={() => handleBulkAction('transfer')} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
              </button>
            )}
            {canMaintain && (
              <button onClick={() => handleBulkAction('maintenance')} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg">
                <Wrench className="w-3.5 h-3.5" /> Maintenance
              </button>
            )}
            {canDispose && (
              <button onClick={() => handleBulkAction('disposal')} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" /> Dispose
              </button>
            )}
          </div>
        </div>
      )}

      {/* Assets Table */}
      <Table columns={columns} data={filteredAssets} loading={loading} />

      {/* Pending Requests Section */}
      {isIctOfficer && (
        <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
          <h3 className="mb-4 text-sm font-black text-[#1B3A5C]">Pending asset requests</h3>
          {requests.filter((request) => request.status === 'Pending').length === 0 ? (
            <p className="text-sm text-[#6B7280]">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {requests
                .filter((request) => request.status === 'Pending')
                .map((request) => (
                  <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-[#E9EBEF] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1B3A5C]">{request.assetName}</p>
                      <p className="text-xs text-[#6B7280]">{request.employeeName} · {request.reason || 'No reason provided'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequestStatus(request, 'Approved')} className="inline-flex items-center gap-1 rounded-lg bg-[#2F6650] px-3 py-1.5 text-xs font-bold text-white">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => handleRequestStatus(request, 'Rejected')} className="inline-flex items-center gap-1 rounded-lg bg-[#8B232A] px-3 py-1.5 text-xs font-bold text-white">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {/* Asset Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={isEditing ? 'Edit Asset' : 'Register Asset'} maxWidth="xl" footer={<><button onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 text-xs">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Save</button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Serial Number" name="serialNumber" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} required />
            <FormField label="Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <FormField label="Model" name="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
            <FormField label="Category" name="categoryId" type="select" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} options={categories.map((cat) => ({ value: cat.id.toString(), label: `${cat.name} (${cat.type})` }))} placeholder="Select category" />
            <FormField label="Campus" name="campusId" type="select" value={formData.campusId} onChange={(e) => setFormData({ ...formData, campusId: e.target.value })} options={campuses.map((campus) => ({ value: campus.id, label: campus.name }))} placeholder="Select campus" />
            <FormField label="Status" name="status" type="select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} options={ASSET_STATUSES.map((s) => ({ value: s, label: s }))} />
            <FormField label="Cost" name="cost" type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!assignmentAsset} onClose={() => setAssignmentAsset(null)} title={`Assign ${assignmentAsset?.name || 'Asset'}`} maxWidth="lg" footer={<><button type="button" onClick={() => setAssignmentAsset(null)} className="px-4 py-2 text-xs">Cancel</button><button type="button" onClick={handleAssign} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Assign</button></>}>
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Department" name="departmentId" type="select" value={assignmentFormData.departmentId} onChange={(event) => setAssignmentFormData({ ...assignmentFormData, departmentId: event.target.value })} required options={assignmentDepartments.map((department) => ({ value: department.id, label: department.name }))} placeholder="Select department" />
            <FormField label={assignmentFormData.assignmentType === 'Lab' ? 'Lab Manager / Custodian' : 'Employee'} name="employeeId" type="select" value={assignmentFormData.employeeId} onChange={(event) => setAssignmentFormData({ ...assignmentFormData, employeeId: event.target.value })} required options={assignmentEmployees.map((employee) => ({ value: employee.id || '', label: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() }))} placeholder="Select employee" />
            <FormField label="Assign To" name="assignmentType" type="select" value={assignmentFormData.assignmentType} onChange={(event) => setAssignmentFormData({ ...assignmentFormData, assignmentType: event.target.value, locationName: '' })} required options={[{ value: 'Department', label: 'Department' }, { value: 'Lab', label: 'Lab' }, { value: 'Office', label: 'Office' }]} />
            <FormField label="Assign Date" name="assignDate" type="date" value={assignmentFormData.assignDate} onChange={(event) => setAssignmentFormData({ ...assignmentFormData, assignDate: event.target.value })} required />
          </div>
          {assignmentFormData.assignmentType !== 'Department' && <FormField label={`${assignmentFormData.assignmentType} Name`} name="locationName" value={assignmentFormData.locationName} onChange={(event) => setAssignmentFormData({ ...assignmentFormData, locationName: event.target.value })} required list="assignment-location-options" placeholder={`Enter or select ${assignmentFormData.assignmentType.toLowerCase()}`} />}
          {assignmentFormData.assignmentType !== 'Department' && <datalist id="assignment-location-options">{matchingLocations.map((location) => <option key={location.id} value={location.name} />)}</datalist>}
        </form>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal isOpen={bulkActionModal.open} onClose={() => setBulkActionModal({ open: false, action: null })} title={`Bulk ${bulkActionModal.action?.charAt(0).toUpperCase()}${bulkActionModal.action?.slice(1)}`} maxWidth="lg" footer={<><button onClick={() => setBulkActionModal({ open: false, action: null })} className="px-4 py-2 text-xs">Cancel</button><button onClick={handleBulkActionSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Confirm</button></>}>
        <form className="space-y-4">
          {bulkActionModal.action === 'transfer' && (
            <FormField label="Destination Campus" name="destinationCampusId" type="select" value={bulkFormData.destinationCampusId} onChange={(e) => setBulkFormData({ ...bulkFormData, destinationCampusId: e.target.value })} options={campuses.map((c) => ({ value: c.id?.toString() || '', label: c.name }))} required />
          )}
          <FormField label={bulkActionModal.action === 'transfer' ? 'Transfer Reason' : bulkActionModal.action === 'maintenance' ? 'Issue Description' : 'Disposal Reason'} name="reason" type="textarea" rows={3} value={bulkFormData.reason} onChange={(e) => setBulkFormData({ ...bulkFormData, reason: e.target.value })} required />
        </form>
      </Modal>

      {/* Asset Request Modal */}
      <Modal isOpen={!!requestAsset} onClose={() => setRequestAsset(null)} title="Request Asset" maxWidth="lg" footer={<><button onClick={() => setRequestAsset(null)} className="px-4 py-2 text-xs">Cancel</button><button onClick={handleRequest} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Submit Request</button></>}>
        <form onSubmit={handleRequest} className="space-y-4">
          <p className="text-sm text-[#4B5563]">Requesting <strong>{requestAsset?.name}</strong>. ICT Officer approval is required before assignment.</p>
          <FormField label="Reason" name="requestReason" type="textarea" rows={4} value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required />
        </form>
      </Modal>

      {/* ICT Officer department-to-department Transfer Modal */}
      <Modal isOpen={!!transferAsset} onClose={() => setTransferAsset(null)} title="Transfer Asset" maxWidth="lg" footer={<><button onClick={() => setTransferAsset(null)} className="px-4 py-2 text-xs">Cancel</button><button onClick={handleTransferSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Submit</button></>}>
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <p className="text-sm text-[#4B5563]">Move <strong>{transferAsset?.name}</strong> between departments within {ownCampus?.name || 'your campus'}.</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Source Department" name="sourceDepartmentId" type="select" value={transferFormData.sourceDepartmentId} onChange={(e) => setTransferFormData({ ...transferFormData, sourceDepartmentId: e.target.value })} required options={campusDepartments.map((department) => ({ value: department.id, label: department.name }))} />
            <FormField label="Destination Department" name="destinationDepartmentId" type="select" value={transferFormData.destinationDepartmentId} onChange={(e) => setTransferFormData({ ...transferFormData, destinationDepartmentId: e.target.value })} required options={campusDepartments.map((department) => ({ value: department.id, label: department.name }))} />
          </div>
          <FormField label="Reason" name="reason" type="textarea" rows={3} value={transferFormData.reason} onChange={(e) => setTransferFormData({ ...transferFormData, reason: e.target.value })} required />
        </form>
      </Modal>
    </div>
  );
};

export default AssetList;
