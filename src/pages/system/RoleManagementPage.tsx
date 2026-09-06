import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Users, KeyRound, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { roleService, RoleRecord, PermissionCatalog } from '../../services/roleService';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const permKey = (module: string, action: string) => `${module}:${action}`;

const RoleManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog>({});
  const [loading, setLoading] = useState(true);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, catalogRes] = await Promise.all([roleService.getAll(), roleService.getCatalog()]);
      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (catalogRes.success && catalogRes.data) setCatalog(catalogRes.data);
    } catch {
      showToast('Failed to load roles and permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenNewRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setSelectedPerms(new Set());
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleRecord) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || '' });
    setIsRoleModalOpen(true);
  };

  const handleOpenPermissions = (role: RoleRecord) => {
    setEditingRole(role);
    setSelectedPerms(new Set(role.permissions.map((p) => permKey(p.module, p.action))));
    setIsPermModalOpen(true);
  };

  const handleOpenDelete = (role: RoleRecord) => {
    setEditingRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      showToast('Please provide a role name', 'error');
      return;
    }
    try {
      if (editingRole) {
        const res = await roleService.update(editingRole.id, { name: roleForm.name.trim(), description: roleForm.description.trim() || null });
        if (res.success) {
          showToast('Role updated successfully', 'success');
          setIsRoleModalOpen(false);
          fetchData();
        } else {
          showToast(res.message || 'Failed to update role', 'error');
        }
      } else {
        const permissions = Array.from(selectedPerms).map((key) => {
          const [module, action] = key.split(':');
          return { module, action };
        });
        const res = await roleService.create({ name: roleForm.name.trim(), description: roleForm.description.trim() || undefined, permissions });
        if (res.success) {
          showToast('Role created successfully', 'success');
          setIsRoleModalOpen(false);
          fetchData();
        } else {
          showToast(res.message || 'Failed to create role', 'error');
        }
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to save role', 'error');
    }
  };

  const handleTogglePerm = (module: string, action: string) => {
    const key = permKey(module, action);
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    const permissions = Array.from(selectedPerms).map((key) => {
      const [module, action] = key.split(':');
      return { module, action };
    });
    try {
      const res = await roleService.updatePermissions(editingRole.id, permissions);
      if (res.success) {
        showToast('Permissions updated successfully', 'success');
        setIsPermModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || 'Failed to update permissions', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update permissions', 'error');
    }
  };

  const handleDeleteRole = async () => {
    if (!editingRole) return;
    try {
      const res = await roleService.delete(editingRole.id);
      if (res.success) {
        showToast('Role deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || 'Failed to delete role', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to delete role', 'error');
    }
  };

  const describePermissions = (role: RoleRecord): string => {
    if (role.permissions.some((p) => p.module === '*')) return 'Full system access';
    if (role.permissions.length === 0) return 'No permissions assigned';
    return role.permissions.map((p) => `${p.module}.${p.action}`).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280] block mb-1">System Governance</span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C] tracking-tight">Roles & Permissions</h2>
          <p className="text-xs text-[#6B7280] font-medium mt-1.5">Add, update, or remove roles and their permissions without touching source code.</p>
        </div>
        <button onClick={handleOpenNewRole} className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl transition-colors shadow-xs">
          <Plus className="w-4 h-4" /><span>Add Role</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E9EBEF] p-10 text-center text-sm text-[#6B7280]">Loading roles…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-5 rounded-2xl border border-[#E9EBEF] shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B3A5C]" />
                  <h3 className="font-black text-sm text-[#1B3A5C]">{role.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B7280]">
                  <Users className="w-3.5 h-3.5" />{role.userCount} user{role.userCount === 1 ? '' : 's'}
                </div>
              </div>
              {role.description && <p className="text-xs text-[#6B7280]">{role.description}</p>}
              <p className="text-[11px] text-[#6B7280] bg-[#F5F6F8] rounded-lg p-2.5 leading-relaxed wrap-break-word">{describePermissions(role)}</p>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => handleOpenEditRole(role)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1B3A5C] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                <button onClick={() => handleOpenPermissions(role)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"><KeyRound className="w-3.5 h-3.5" />Permissions</button>
                <button onClick={() => handleOpenDelete(role)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#8B232A] bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"><Trash2 className="w-3.5 h-3.5" />Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit role modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Add New Role'}
        maxWidth={editingRole ? 'md' : 'lg'}
        footer={<>
          <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmitRole} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl shadow-xs transition-colors">{editingRole ? 'Save' : 'Create Role'}</button>
        </>}
      >
        <form onSubmit={handleSubmitRole} className="space-y-4">
          <FormField label="Role Name" name="name" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required placeholder="e.g. Store Keeper" />
          <FormField label="Description" name="description" type="textarea" rows={2} value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="What this role is responsible for" />
          {!editingRole && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A1A1A]">Initial Permissions</label>
              <div className="border border-[#E9EBEF] rounded-xl p-3 max-h-64 overflow-y-auto space-y-3">
                {Object.entries(catalog).map(([module, actions]) => (
                  <div key={module}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">{module}</div>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <label key={action} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[11px] font-semibold ${selectedPerms.has(permKey(module, action)) ? 'border-[#1B3A5C] bg-[#1B3A5C]/5 text-[#1B3A5C]' : 'border-[#E9EBEF] text-[#6B7280]'}`}>
                          <input type="checkbox" checked={selectedPerms.has(permKey(module, action))} onChange={() => handleTogglePerm(module, action)} className="text-[#1B3A5C] focus:ring-[#1B3A5C]" />
                          {action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Manage permissions modal */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={`Permissions: ${editingRole?.name}`}
        maxWidth="lg"
        footer={<>
          <button type="button" onClick={() => setIsPermModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button>
          <button type="button" onClick={handleSavePermissions} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl shadow-xs transition-colors">Save Permissions</button>
        </>}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {Object.entries(catalog).map(([module, actions]) => (
            <div key={module} className="border border-[#E9EBEF] rounded-xl p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">{module}</div>
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <label key={action} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[11px] font-semibold ${selectedPerms.has(permKey(module, action)) ? 'border-[#1B3A5C] bg-[#1B3A5C]/5 text-[#1B3A5C]' : 'border-[#E9EBEF] text-[#6B7280]'}`}>
                    <input type="checkbox" checked={selectedPerms.has(permKey(module, action))} onChange={() => handleTogglePerm(module, action)} className="text-[#1B3A5C] focus:ring-[#1B3A5C]" />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Role"
        maxWidth="sm"
        footer={<>
          <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button>
          <button type="button" onClick={handleDeleteRole} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#8B232A] hover:bg-red-800 rounded-xl shadow-xs transition-colors">Remove</button>
        </>}
      >
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-[#8B232A] flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div>
          <p className="text-center text-xs text-[#1A1A1A]">Are you sure you want to remove <strong>{editingRole?.name}</strong>? {editingRole && editingRole.userCount > 0 && (
            <span className="block mt-1 text-[#8B232A] font-bold">{editingRole.userCount} user(s) are still assigned to this role and must be reassigned first.</span>
          )}</p>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagementPage;
