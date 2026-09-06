import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { campusService } from '../../services/campusService';
import { ROLES } from '../../config/roles';
import { Campus } from '../../types';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import ExportButton from '../../components/ExportButton';

export const CampusList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', location: '', description: '' });
  const canAddCampus = user?.role === ROLES.OVERALL_ADMIN;

  const fetchData = () => {
    setLoading(true);
    campusService.getAll().then((res) => {
      if (res.success && res.data) {
        const mapped = res.data.map((c: any) => ({ ...c, id: c.id?.toString() || c.campus_id?.toString(), code: c.code || '', name: c.name || '', location: c.location || '' }));
        setCampuses(mapped);
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenNew = () => {
    setFormData({ name: '', code: '', location: '', description: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Please provide the campus name and code', 'error');
      return;
    }
    try {
      const res = await campusService.create({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        location: formData.location.trim() || undefined,
        description: formData.description.trim() || undefined,
      });
      if (res.success) {
        showToast('Campus added successfully', 'success');
        setIsModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || 'Failed to add campus', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to add campus', 'error');
    }
  };

  const columns: Column<Campus>[] = [
    { key: 'code', label: 'Code', sortable: true, render: (row) => <span className="font-bold text-[var(--color-navy)]">{row.code}</span> },
    { key: 'name', label: 'Name', sortable: true, render: (row) => <div><div className="font-bold text-[var(--color-gray-900)]">{row.name}</div><div className="text-[11px] text-[var(--color-gray-500)]">{row.location}</div></div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280]">Network</span><h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C]">IAA Campuses</h2></div>
        <div className="flex items-center gap-2.5">
          <ExportButton data={campuses} filename="IAA_Campuses" exportFormat="pdf" />
          {canAddCampus && (
            <button onClick={handleOpenNew} className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl transition-colors shadow-xs">
              <Plus className="w-4 h-4" /><span>Add Campus</span>
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {campuses.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-xl border border-[var(--color-gray-100)] shadow-xs">
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[var(--color-navy)]">{c.code}</span><Building2 className="w-4 h-4 text-[var(--color-navy)]" /></div>
            <h3 className="font-bold text-sm text-[var(--color-navy-dark)] mt-2">{c.name}</h3>
            <p className="text-[11px] text-[var(--color-gray-500)] mt-0.5">{c.location}</p>
          </div>
        ))}
      </div>
      <Table columns={columns} data={campuses} loading={loading} emptyMessage="No campuses." searchPlaceholder="Search..." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Campus"
        maxWidth="md"
        footer={<>
          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F6F8] rounded-xl transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl shadow-xs transition-colors">Add Campus</button>
        </>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Campus Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Zanzibar" />
            <FormField label="Code" name="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required placeholder="e.g. ZN" />
          </div>
          <FormField label="Location" name="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Zanzibar" />
          <FormField label="Description" name="description" type="textarea" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional campus description" />
        </form>
      </Modal>
    </div>
  );
};

export default CampusList;
