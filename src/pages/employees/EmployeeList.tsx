import React, { useState, useEffect } from 'react';
import { Plus, Edit2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services/employeeService';
import { auditService } from '../../services/auditService';
import { Employee } from '../../types';
import { IAA_CAMPUSES } from '../../utils/constants';
import { ROLES } from '../../config/roles';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

export const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  // Only roles holding the employees.manage permission may edit or change employee status.
  const canManageEmployees = [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN].includes(user?.role as any);

  const [formData, setFormData] = useState({
    employeeNumber: '',
    fullName: '',
    email: '',
    phone: '',
    campus: user?.campus || 'Arusha Main Campus',
    department: 'Accounting and Finance',
    designation: '',
    status: 'Active' as Employee['status'],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAll();
      if (res.success && res.data) setEmployees(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNew = () => {
    setIsEditing(false);
    setEditingEmployeeId(null);
    setFormData({
      employeeNumber: `IAA-EMP-00${employees.length + 1}`,
      fullName: '',
      email: '',
      phone: '+255 ',
      campus: user?.campus || 'Arusha Main Campus',
      department: 'Computing and Information Technology',
      designation: 'Lecturer',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (employee: Employee) => {
    setIsEditing(true);
    setEditingEmployeeId(employee.id || null);
    setFormData({
      employeeNumber: employee.employeeNo || '',
      fullName: employee.fullName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      campus: employee.campus || user?.campus || 'Arusha Main Campus',
      department: employee.department || '',
      designation: employee.designation || '',
      status: employee.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSelectEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAllEmployees = (toSelect: boolean) => {
    setSelectedEmployees(toSelect ? new Set(employees.map((emp) => emp.id || '')) : new Set());
  };

  const singleSelectedEmployee = selectedEmployees.size === 1
    ? employees.find((emp) => selectedEmployees.has(emp.id || '')) || null
    : null;

  const handleToggleStatus = async (isActive: boolean) => {
    if (selectedEmployees.size === 0) return;
    try {
      await Promise.all(Array.from(selectedEmployees).map((id) => employeeService.setStatus(id, isActive)));
      showToast(`${selectedEmployees.size} employee(s) ${isActive ? 'activated' : 'deactivated'}`, 'success');
      setSelectedEmployees(new Set());
      fetchData();
    } catch {
      showToast('Failed to update employee status', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const res = isEditing && editingEmployeeId
        ? await employeeService.update(editingEmployeeId, { ...formData })
        : await employeeService.create({ ...formData });

      if (res.success) {
        if (user) {
          const auditUser = { id: user.id, name: user.name || user.username, role: user.role, campus: user.campus || '' };
          auditService.logAction(isEditing ? 'UPDATE' : 'CREATE', 'Employees', `${isEditing ? 'Updated' : 'Added'} employee record for ${formData.fullName}`, auditUser);
        }
        showToast(`Employee ${isEditing ? 'updated' : 'registered'} successfully`, 'success');
        setIsModalOpen(false);
        setSelectedEmployees(new Set());
        fetchData();
      }
    } catch {
      showToast(`Failed to ${isEditing ? 'update' : 'add'} employee`, 'error');
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedEmployees.size === employees.length && employees.length > 0}
          onChange={(e) => handleSelectAllEmployees(e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedEmployees.has(row.id || '')}
          onChange={() => handleSelectEmployee(row.id || '')}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      key: 'employeeNo',
      label: 'Staff ID',
      sortable: true,
      render: (row) => <span className="font-bold text-(--color-navy)">{row.employeeNo}</span>,
    },
    {
      key: 'fullName',
      label: 'Full Name & Designation',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-[var(--color-gray-900)]">{row.fullName}</div>
          <div className="text-[11px] text-[var(--color-gray-500)]">{row.designation}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Dept & Campus',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--color-gray-900)]">{row.department}</div>
          <div className="text-[11px] text-[var(--color-gray-500)]">{row.campus}</div>
        </div>
      ),
    },
    {
      key: 'contacts',
      label: 'Contact Info',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[var(--color-gray-900)]">{row.email}</div>
          <div className="text-[11px] text-[var(--color-gray-500)]">{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'assignedAssetsCount',
      label: 'Assets In Custody',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-xs text-[var(--color-navy)]">
          {row.assignedAssetsCount} units
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-navy-dark)]">Faculty & Staff Directory</h2>
          <p className="text-xs text-[var(--color-gray-500)] mt-0.5">
            IAA employees eligible for institutional ICT equipment assignments and custodian agreements
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButton data={employees} filename="IAA_Employees_Directory" exportFormat="pdf" />
          {canManageEmployees && (
            <button
              id="register-employee-btn"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--color-navy)] hover:bg-[var(--color-navy-dark)] rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Selection Actions */}
      {selectedEmployees.size > 0 && canManageEmployees && (
        <div className="rounded-2xl border border-[var(--color-navy)]/20 bg-[var(--color-navy)]/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-bold text-(--color-navy)">{selectedEmployees.size} employee(s) selected</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => singleSelectedEmployee && handleOpenEdit(singleSelectedEmployee)}
              disabled={!singleSelectedEmployee}
              title={!singleSelectedEmployee ? 'Select exactly one employee' : undefined}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-600 hover:bg-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => handleToggleStatus(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#2F6650] hover:bg-emerald-700 rounded-lg">
              <UserCheck className="w-3.5 h-3.5" /> Activate
            </button>
            <button onClick={() => handleToggleStatus(false)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#8B232A] hover:bg-red-700 rounded-lg">
              <UserX className="w-3.5 h-3.5" /> Deactivate
            </button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees registered."
        emptyActionLabel="Add Employee"
        onEmptyAction={handleOpenNew}
        searchPlaceholder="Search by name, employee ID, email, or department..."
      />

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Institutional Staff Member' : 'Add Institutional Staff Member'}
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[var(--color-gray-900)] hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-navy)] hover:bg-[var(--color-navy-dark)] rounded-lg shadow-xs transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Register Employee'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Staff ID / Employee #"
              name="employeeNumber"
              value={formData.employeeNumber}
              onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
              required
            />
            <FormField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="e.g. Dr. Frank Minja"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Institutional Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="name@iaa.ac.tz"
            />
            <FormField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+255 754 000 000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Campus"
              name="campus"
              type="select"
              value={formData.campus}
              onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
              required
              options={IAA_CAMPUSES.map((c) => ({ value: c, label: c }))}
            />
            <FormField
              label="Department"
              name="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              placeholder="e.g. Accounting & Finance"
            />
          </div>

          <FormField
            label="Designation / Academic Title"
            name="designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            required
            placeholder="e.g. Senior Lecturer, IT Support Officer, Dean"
          />
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeList;
