import React, { useState, useEffect } from 'react';
import { Search, UserPlus, ShieldCheck, Trash2, Edit2, UserX, UserCheck, RefreshCw, Crown, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { campusService } from '../../services/campusService';
import { departmentService } from '../../services/departmentService';
import { User, UserRole, Campus, Department } from '../../types';
import { USER_ROLES, ROLES } from '../../utils/constants';
import { ROLE_NAME_TO_ID } from '../../config/roles';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

interface UserFormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  campus: string;
  department: string;
  office: string;
  password: string;
}

const emptyForm = (defaultRole: UserRole, defaultCampus: string): UserFormData => ({
  name: '',
  username: '',
  email: '',
  phone: '+255 ',
  role: defaultRole,
  campus: defaultCampus,
  department: '',
  office: '',
  password: 'password123',
});

export const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isOverallAdmin = currentUser?.role === ROLES.OVERALL_ADMIN;
  const isCampusAdmin = currentUser?.role === ROLES.CAMPUS_ADMIN;
  const MAX_OVERALL_ADMINS = 3;
  const [users, setUsers] = useState<User[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [campusFilter, setCampusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<UserFormData>(emptyForm(ROLES.ASSET_OFFICER, currentUser?.campus || ''));
  const [bulkNewRole, setBulkNewRole] = useState<UserRole>(ROLES.ASSET_OFFICER);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      if (res.success && res.data) setUsers(res.data);
    } catch {
      showToast('Failed to load user accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    const [campusRes, deptRes] = await Promise.all([campusService.getAll(), departmentService.getAll()]);
    if (campusRes.success && campusRes.data) setCampuses(campusRes.data);
    if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
  };

  useEffect(() => { fetchData(); fetchLookups(); }, []);

  const departmentsForCampus = (campusName: string) => departments.filter((d) => d.campus === campusName);

  const overallAdminCount = users.filter((u) => u.role === ROLES.OVERALL_ADMIN).length;

  // Overall admins may assign any role (capped at MAX_OVERALL_ADMINS); campus admins may only assign roles below Campus Administrator.
  const getSelectableRoles = (targetCurrentRole?: UserRole): UserRole[] => {
    if (isOverallAdmin) {
      const overallAdminLimitReached = overallAdminCount >= MAX_OVERALL_ADMINS && targetCurrentRole !== ROLES.OVERALL_ADMIN;
      return overallAdminLimitReached ? USER_ROLES.filter((r) => r !== ROLES.OVERALL_ADMIN) : USER_ROLES;
    }
    return USER_ROLES.filter((r) => r !== ROLES.OVERALL_ADMIN && r !== ROLES.CAMPUS_ADMIN);
  };

  const handleOpenCreate = () => {
    setFormData(emptyForm(ROLES.ASSET_OFFICER, currentUser?.campus || campuses[0]?.name || ''));
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name || '',
      username: userToEdit.username || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '+255 ',
      role: userToEdit.role,
      campus: userToEdit.campus || '',
      department: userToEdit.department || '',
      office: userToEdit.office || '',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const target = users.find((u) => selectedIds.has(u.id));
    if (target) handleOpenEdit(target);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = (toSelect: boolean) => {
    if (toSelect) {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.campus || !formData.department) {
      showToast('Please fill all mandatory account fields', 'error');
      return;
    }
    if (isCampusAdmin && (formData.role === ROLES.OVERALL_ADMIN || formData.role === ROLES.CAMPUS_ADMIN)) {
      showToast('You are not authorized to provision this role', 'error');
      return;
    }
    if (isCampusAdmin && formData.campus !== currentUser?.campus) {
      showToast('You can only provision users within your own campus', 'error');
      return;
    }
    if (formData.role === ROLES.OVERALL_ADMIN && overallAdminCount >= MAX_OVERALL_ADMINS) {
      showToast(`Maximum of ${MAX_OVERALL_ADMINS} Overall Administrator accounts allowed`, 'error');
      return;
    }
    try {
      const res = await userService.create({
        name: formData.name.trim(),
        username: formData.username.toLowerCase().trim(),
        email: formData.email.trim(),
        password: formData.password || 'password123',
        role_id: ROLE_NAME_TO_ID[formData.role],
        campus: formData.campus,
        department: formData.department,
        office: formData.office.trim() || undefined,
        phone: formData.phone,
      });
      if (res.success) {
        showToast(`User account for "${formData.name}" created`, 'success');
        setIsCreateModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || 'Failed to create user account', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to create user account', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (isCampusAdmin && (formData.role === ROLES.OVERALL_ADMIN || formData.role === ROLES.CAMPUS_ADMIN)) {
      showToast('You are not authorized to assign this role', 'error');
      return;
    }
    if (isCampusAdmin && formData.campus !== currentUser?.campus) {
      showToast('You can only manage users within your own campus', 'error');
      return;
    }
    if (formData.role === ROLES.OVERALL_ADMIN && selectedUser.role !== ROLES.OVERALL_ADMIN && overallAdminCount >= MAX_OVERALL_ADMINS) {
      showToast(`Maximum of ${MAX_OVERALL_ADMINS} Overall Administrator accounts allowed`, 'error');
      return;
    }
    try {
      const res = await userService.update(selectedUser.id, {
        name: formData.name.trim(),
        username: formData.username.toLowerCase().trim(),
        email: formData.email.trim(),
        role_id: ROLE_NAME_TO_ID[formData.role],
        campus: formData.campus,
        department: formData.department,
        office: formData.office.trim() || undefined,
        phone: formData.phone,
      });
      if (res.success) {
        showToast(`Account for ${formData.name} updated`, 'success');
        setIsEditModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || 'Failed to update user account', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update user account', 'error');
    }
  };

  const handleOpenBulkRole = () => {
    if (selectedIds.size === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    setBulkNewRole(ROLES.ASSET_OFFICER);
    setIsRoleModalOpen(true);
  };

  const handleBulkRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let count = 0;
      for (const id of selectedIds) {
        const res = await userService.changeRole(id, bulkNewRole);
        if (res.success) count++;
      }
      showToast(`Role updated to "${bulkNewRole}" for ${count} user(s)`, 'success');
      setIsRoleModalOpen(false);
      setSelectedIds(new Set());
      fetchData();
    } catch {
      showToast('Failed to update role for the selected users', 'error');
    }
  };

  const handleBulkToggleStatus = async (activate: boolean) => {
    if (selectedIds.size === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    const targets = users.filter((u) => selectedIds.has(u.id) && Boolean(u.isActive) !== activate);
    const skippedSelf = targets.some((u) => currentUser && (u.id === currentUser.id || u.username === currentUser.username)) && !activate;
    const eligible = targets.filter((u) => !(!activate && currentUser && (u.id === currentUser.id || u.username === currentUser.username)));

    if (eligible.length === 0) {
      showToast('No eligible users to update', 'info');
      return;
    }

    try {
      let count = 0;
      for (const u of eligible) {
        const res = await userService.toggleStatus(u.id);
        if (res.success) count++;
      }
      showToast(`${count} user(s) ${activate ? 'activated' : 'suspended'}${skippedSelf ? ' (your own account was skipped)' : ''}`, 'success');
      setSelectedIds(new Set());
      fetchData();
    } catch {
      showToast('Failed to update account status for the selected users', 'error');
    }
  };

  const handleOpenBulkDelete = () => {
    if (selectedIds.size === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleBulkDeleteSubmit = async () => {
    const eligibleIds = Array.from(selectedIds).filter((id) => {
      const u = users.find((usr) => usr.id === id);
      return !(u && currentUser && (u.id === currentUser.id || u.username === currentUser.username));
    });
    const skippedSelf = eligibleIds.length !== selectedIds.size;

    try {
      let count = 0;
      for (const id of eligibleIds) {
        const res = await userService.delete(id);
        if (res.success) count++;
      }
      showToast(`${count} user account(s) removed${skippedSelf ? ' (your own account was skipped)' : ''}`, 'info');
      setIsDeleteModalOpen(false);
      setSelectedIds(new Set());
      fetchData();
    } catch {
      showToast('Failed to remove the selected user accounts', 'error');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case ROLES.SYSTEM_ADMIN: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#1B3A5C] text-[#C9A227] border border-[#C9A227]/30 shadow-xs"><Crown className="w-3 h-3 text-[#C9A227]" /><span>Super Admin</span></span>;
      case ROLES.UNIT_APPROVER: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-900 text-blue-100 border border-blue-700"><ShieldCheck className="w-3 h-3 text-blue-300" /><span>Unit Approver</span></span>;
      case ROLES.ASSET_OFFICER: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">{role}</span>;
      case ROLES.PROCUREMENT_OFFICER: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">{role}</span>;
      case ROLES.AUDITOR_EXECUTIVE: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">{role}</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">{role}</span>;
    }
  };

  const filteredUsers = users
    .filter((u) => roleFilter === 'All' || u.role === roleFilter)
    .filter((u) => campusFilter === 'All' || u.campus === campusFilter)
    .filter((u) => departmentFilter === 'All' || u.department === departmentFilter)
    .filter((u) => statusFilter === 'All' || (statusFilter === 'Active' ? u.isActive : !u.isActive))
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
    });

  const departmentOptions = [...new Set(departments.map((d) => d.name))];

  const totalUsersCount = users.length;
  const adminCount = users.filter((u) => u.role === ROLES.SYSTEM_ADMIN).length;
  const activeUsersCount = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;

  const allVisibleSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));

  const columns: Column<User>[] = [
    { key: 'select', label: '', render: (row) => (
      <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleToggleSelect(row.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 cursor-pointer" />
    )},
    { key: 'name', label: 'User & Credentials', sortable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1B3A5C]/10 border border-[#1B3A5C]/20 flex items-center justify-center font-black text-xs text-[#1B3A5C] shrink-0">{(row.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
        <div>
          <div className="font-bold text-xs text-[#1A1A1A]">{row.name}</div>
          <div className="text-[11px] text-[#6B7280] font-mono">@{row.username}</div>
        </div>
      </div>
    )},
    { key: 'role', label: 'System Role', sortable: true, render: (row) => getRoleBadge(row.role) },
    ...(isOverallAdmin ? [{ key: 'campus', label: 'Campus', sortable: true, render: (row: User) => <span className="font-semibold text-xs text-[#1A1A1A]">{row.campus || 'N/A'}</span> }] : []),
    { key: 'department', label: 'Department / Office / Lab', sortable: true, render: (row) => <div><div className="font-semibold text-xs text-[#1A1A1A]">{row.department || 'N/A'}</div><div className="text-[11px] text-[#6B7280]">{row.office || '—'}</div></div> },
    { key: 'email', label: 'Contact', render: (row) => <div><div className="text-xs text-[#1A1A1A]">{row.email}</div><div className="text-[11px] text-[#6B7280]">{row.phone || '—'}</div></div> },
    { key: 'isActive', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.isActive ? 'Active' : 'Terminated'} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280] block mb-1">System Administration</span><h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C] tracking-tight">User Access Management</h2><p className="text-xs text-[#6B7280] font-medium mt-1.5">Manage user accounts and assign access by role.</p></div>
        <div className="flex items-center gap-2.5 flex-wrap"><button onClick={fetchData} className="p-2 text-[#6B7280] hover:text-[#1B3A5C] hover:bg-white rounded-xl border border-[#E9EBEF] transition-colors" title="Refresh"><RefreshCw className="w-4 h-4" /></button><ExportButton data={filteredUsers} filename="IAA_System_Users_Privileges" exportFormat="pdf" /><button id="new-user-btn" onClick={handleOpenCreate} className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl transition-colors shadow-xs"><UserPlus className="w-4 h-4" /><span>Provision User</span></button></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E9EBEF] shadow-xs"><div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Total Users</div><div className="text-2xl sm:text-3xl font-black text-[#1B3A5C] mt-1">{totalUsersCount}</div></div>
        <div className="bg-white p-4 rounded-2xl border border-[#E9EBEF] shadow-xs"><div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Admins</div><div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{adminCount}</div></div>
        <div className="bg-white p-4 rounded-2xl border border-[#E9EBEF] shadow-xs"><div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Active</div><div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{activeUsersCount}</div></div>
        <div className="bg-white p-4 rounded-2xl border border-[#E9EBEF] shadow-xs"><div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Suspended</div><div className="text-2xl sm:text-3xl font-black text-red-600 mt-1">{suspendedCount}</div></div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-[#1B3A5C]/5 border border-[#1B3A5C]/20 rounded-2xl p-3.5 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-[#1B3A5C] mr-1">{selectedIds.size} user(s) selected</span>
          <button onClick={handleEditSelected} disabled={selectedIds.size !== 1} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1B3A5C] bg-white border border-[#E9EBEF] hover:bg-[#F5F6F8] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><Edit2 className="w-3.5 h-3.5" />Edit</button>
          <button onClick={handleOpenBulkRole} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"><ShieldCheck className="w-3.5 h-3.5" />Assign Role</button>
          <button onClick={() => handleBulkToggleStatus(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"><UserCheck className="w-3.5 h-3.5" />Activate</button>
          <button onClick={() => handleBulkToggleStatus(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"><UserX className="w-3.5 h-3.5" />Suspend</button>
          <button onClick={handleOpenBulkDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#8B232A] hover:bg-red-800 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
          <button onClick={() => setSelectedIds(new Set())} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#6B7280] hover:bg-white rounded-lg transition-colors ml-auto"><X className="w-3.5 h-3.5" />Clear</button>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-[#E9EBEF] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6B7280] shrink-0" title="Select all visible users">
              <input type="checkbox" checked={allVisibleSelected} onChange={(e) => handleSelectAllVisible(e.target.checked)} className="w-4 h-4 cursor-pointer" />
              All
            </label>
            <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl text-xs font-medium text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]" /></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-1.5 bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl text-[#1A1A1A] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] cursor-pointer"><option value="All">All Roles</option>{USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            {isOverallAdmin && <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="px-3 py-1.5 bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl text-[#1A1A1A] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] cursor-pointer"><option value="All">All Campuses</option>{campuses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select>}
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-1.5 bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl text-[#1A1A1A] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] cursor-pointer"><option value="All">All Departments</option>{departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl text-[#1A1A1A] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] cursor-pointer"><option value="All">All Status</option><option value="Active">Active</option><option value="Suspended">Suspended</option></select>
          </div>
        </div>
      </div>
      <Table columns={columns} data={filteredUsers} loading={loading} searchable={false} emptyMessage="No users found." emptyActionLabel="Provision New Account" onEmptyAction={handleOpenCreate} />

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Provision New ICTIMS User" maxWidth="lg" footer={<><button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button><button type="button" onClick={handleCreateSubmit} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl shadow-xs transition-colors">Provision</button></>}>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Full Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. John Mushi" /><FormField label="Username" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required placeholder="e.g. john.mushi" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="name@iaa.ac.tz" /><FormField label="Phone Number" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+255..." /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Role" name="role" type="select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} required options={getSelectableRoles().map((r) => ({ value: r, label: r }))} />
            <FormField label="Campus" name="campus" type="select" value={formData.campus} onChange={(e) => setFormData({ ...formData, campus: e.target.value, department: '' })} required disabled={isCampusAdmin} options={campuses.map((c) => ({ value: c.name, label: c.name }))} placeholder="Select campus" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Department" name="department" type="select" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required disabled={!formData.campus} options={departmentsForCampus(formData.campus).map((d) => ({ value: d.name, label: d.name }))} placeholder="Select department" />
            <FormField label="Office / Lab" name="office" value={formData.office} onChange={(e) => setFormData({ ...formData, office: e.target.value })} placeholder="e.g. ICT Lab 2" />
          </div>
          <FormField label="Default Password" name="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Default: password123" helperText="The user can change this after signing in." />
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit User: ${selectedUser?.name}`} maxWidth="lg" footer={<><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button><button type="button" onClick={handleEditSubmit} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl shadow-xs transition-colors">Save</button></>}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Full Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /><FormField label="Username" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /><FormField label="Phone Number" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Role" name="role" type="select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} required options={getSelectableRoles(selectedUser?.role).map((r) => ({ value: r, label: r }))} />
            <FormField label="Campus" name="campus" type="select" value={formData.campus} onChange={(e) => setFormData({ ...formData, campus: e.target.value, department: '' })} required disabled={isCampusAdmin} options={campuses.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Department" name="department" type="select" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required disabled={!formData.campus} options={departmentsForCampus(formData.campus).map((d) => ({ value: d.name, label: d.name }))} />
            <FormField label="Office / Lab" name="office" value={formData.office} onChange={(e) => setFormData({ ...formData, office: e.target.value })} placeholder="e.g. ICT Lab 2" />
          </div>
        </form>
      </Modal>

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={`Assign Role to ${selectedIds.size} User(s)`} maxWidth="md" footer={<><button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button><button type="button" onClick={handleBulkRoleSubmit} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl shadow-xs transition-colors">Apply</button></>}>
        <form onSubmit={handleBulkRoleSubmit} className="space-y-4"><div className="space-y-2"><label className="block text-xs font-bold text-[#1A1A1A]">Choose New Role:</label><div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">{getSelectableRoles().map((r) => (<label key={r} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${bulkNewRole === r ? 'border-[#1B3A5C] bg-[#1B3A5C]/5 text-[#1B3A5C] font-bold shadow-xs' : 'border-[#E9EBEF] hover:bg-[#F5F6F8] text-[#1A1A1A]'}`}><div className="flex items-center gap-2.5"><input type="radio" name="bulkRoleOption" checked={bulkNewRole === r} onChange={() => setBulkNewRole(r)} className="text-[#1B3A5C] focus:ring-[#1B3A5C]" /><span className="text-xs">{r}</span></div>{getRoleBadge(r)}</label>))}</div></div></form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove User(s)" maxWidth="sm" footer={<><button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button><button type="button" onClick={handleBulkDeleteSubmit} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#8B232A] hover:bg-red-800 rounded-xl shadow-xs transition-colors">Remove</button></>}>
        <div className="space-y-3"><div className="w-12 h-12 rounded-full bg-red-100 text-[#8B232A] flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div><p className="text-center text-xs text-[#1A1A1A]">Are you sure you want to remove <strong>{selectedIds.size}</strong> selected user account(s)? This cannot be undone.</p></div>
      </Modal>
    </div>
  );
};

export default UserList;
