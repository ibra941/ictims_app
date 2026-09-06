import React, { useState, useEffect } from 'react';
import { Plus, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

export const SupplierList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    tinNumber: '',
    status: 'Active' as string,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await supplierService.getAll();
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNew = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      tinNumber: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Please fill all required supplier information', 'error');
      return;
    }
    try {
      const res = await supplierService.create(formData);
      if (res.success) {
        if (user) {
          // Audit log (optional)
        }
        showToast('Supplier registered successfully', 'success');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error: any) {
      const fieldErrors = error?.errors ? Object.values(error.errors).flat().join(' ') : '';
      showToast(fieldErrors || error?.message || 'Failed to register vendor', 'error');
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      label: 'Supplier Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-[var(--color-navy)]">{row.name}</div>
          <div className="text-[11px] text-[var(--color-gray-500)]">TIN: {row.tin || '-'}</div>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Contact Person',
      sortable: true,
      render: (row) => <div className="font-medium text-[var(--color-gray-900)]">{row.contactPerson || '-'}</div>,
    },
    {
      key: 'contact',
      label: 'Direct Channels',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[var(--color-gray-900)] flex items-center gap-1">
            <Mail className="w-3 h-3 text-[var(--color-gray-500)]" />
            <span>{row.email || '-'}</span>
          </div>
          <div className="text-[var(--color-gray-500)] flex items-center gap-1 text-[11px]">
            <Phone className="w-3 h-3 text-[var(--color-gray-500)]" />
            <span>{row.phone || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status || 'Active'} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280] block mb-1">
            Procurement Partners
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C] tracking-tight">Approved ICT Vendors and Suppliers</h2>
          <p className="text-xs text-[#6B7280] font-medium mt-1.5">
            Procurement partners, authorized hardware warranty providers, and maintenance contractors
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButton data={suppliers} filename="IAA_Approved_Suppliers" exportFormat="pdf" />
          <button
            id="register-supplier-btn"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-black text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-lg transition-colors shadow-lg border-2 border-[#C9A227]"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vendor</span>
          </button>
        </div>
      </div>

      <Table
        columns={columns}
        data={suppliers}
        loading={loading}
        emptyMessage="No approved suppliers registered."
        emptyActionLabel="Register First Vendor"
        onEmptyAction={handleOpenNew}
        searchPlaceholder="Search vendor by name, TIN number, email..."
      />

      {/* New Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Approved ICT Supplier"
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
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 text-sm font-black uppercase tracking-wide text-white bg-[#1B3A5C] hover:bg-[#12294A] border-2 border-[#C9A227] rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-4 focus:ring-[#C9A227]/30"
            >
              <Plus className="w-4 h-4" />
              Register Supplier
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Simba Computer Systems Ltd"
            />
            <FormField
              label="TIN Number"
              name="tinNumber"
              value={formData.tinNumber}
              onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })}
              required
              placeholder="e.g. 104-558-921"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Contact Representative"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              required
              placeholder="Full name"
            />
            <FormField
              label="Business Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="sales@company.co.tz"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+255 22 211 4500"
            />
            <FormField
              label="Physical Business Address"
              name="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street / City"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SupplierList;
