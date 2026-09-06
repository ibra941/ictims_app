import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';
import { PurchaseOrder, PurchaseOrderInput, Supplier } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Table, { Column } from '../../components/Table';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';
import { downloadBrandedPDFReport } from '../../utils/reportExportHelper';

export const PurchaseList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PurchaseOrderInput>({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    totalAmount: 10000000,
    currency: 'TZS',
    status: 'Draft',
    itemCount: 10,
    itemsSummary: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, supRes] = await Promise.all([purchaseService.getAll(), supplierService.getAll()]);
      if (poRes.success && poRes.data) {
        setPurchases(poRes.data);
      }
      if (supRes.success && supRes.data) setSuppliers(supRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenNew = () => {
    setFormData({ supplierId: suppliers[0]?.id || '', orderDate: new Date().toISOString().split('T')[0], deliveryDate: '', totalAmount: 0, currency: 'TZS', status: 'Draft', itemCount: 1, itemsSummary: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.orderDate || formData.totalAmount <= 0 || formData.itemCount < 1) { showToast('Complete all required purchase order fields', 'error'); return; }
    if (!formData.itemsSummary.trim()) { showToast('Please provide a summary', 'error'); return; }
    try {
      const res = await purchaseService.create({ ...formData });
      if (res.success) { showToast('Purchase Order registered successfully', 'success'); setIsModalOpen(false); fetchData(); }
    } catch (error: any) {
      const fieldErrors = error?.errors ? Object.values(error.errors).flat().join(' ') : '';
      showToast(fieldErrors || error?.message || 'Failed to create purchase order', 'error');
    }
  };

  const handleStatusChange = async (purchase: PurchaseOrder, status: PurchaseOrder['status']) => {
    setUpdatingId(purchase.id);
    try {
      const response = await purchaseService.updateStatus(purchase.id, status);
      if (!response.success) throw response;
      setPurchases((current) => current.map((item) => item.id === purchase.id ? { ...item, status } : item));
      showToast('Purchase order status updated', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update purchase order status', 'error');
    } finally { setUpdatingId(null); }
  };

  const printConfirmedOrder = async (purchase: PurchaseOrder) => {
    await downloadBrandedPDFReport([{
      'PO Number': purchase.poNumber, Supplier: purchase.supplierName, Items: purchase.itemsSummary,
      Quantity: purchase.itemCount, Amount: formatCurrency(purchase.totalAmount, purchase.currency),
      'Order Date': formatDate(purchase.orderDate), Status: purchase.status,
      'Campus Admin Stamp / Signature': '____________________',
    }], { reportTitle: 'Confirmed Procurement Order', filename: purchase.poNumber, generatedBy: user?.name || user?.username, campus: user?.campus || undefined, department: user?.department || undefined });
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: 'poNumber', label: 'PO Number', sortable: true, render: (row) => <span className="font-bold text-[var(--color-navy)]">{row.poNumber}</span> },
    { key: 'supplierName', label: 'Vendor', sortable: true, render: (row) => <div><div className="font-semibold text-[var(--color-gray-900)]">{row.supplierName || 'Unknown supplier'}</div><div className="text-[11px] text-[var(--color-gray-500)]">{row.campus || 'Institutional procurement'}</div></div> },
    { key: 'itemsSummary', label: 'Items', render: (row) => <div><div className="font-medium text-xs text-[var(--color-gray-900)]">{row.itemsSummary}</div><div className="text-[11px] text-[var(--color-gray-500)]">{row.itemCount} units</div></div> },
    { key: 'totalAmount', label: 'Total', sortable: true, render: (row) => <span className="font-bold text-[var(--color-navy-dark)]">{formatCurrency(row.totalAmount, row.currency)}</span> },
    { key: 'orderDate', label: 'Date', sortable: true, render: (row) => formatDate(row.orderDate) },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} size="sm" /> },
    { key: 'actions', label: 'Update Status', render: (row) => <div className="flex items-center gap-2"><select aria-label={`Update status for ${row.poNumber}`} disabled={updatingId === row.id || row.status === 'Cancelled'} value={row.status} onChange={(e) => handleStatusChange(row, e.target.value as PurchaseOrder['status'])} className="border border-[#E9EBEF] rounded-lg px-2 py-1.5 text-xs font-semibold text-[#1B3A5C] bg-white"><option value="Draft">Draft</option><option value="Ordered">Ordered</option><option value="Received">Received</option><option value="Confirmed">Confirmed</option><option value="Cancelled">Cancelled</option></select>{row.status === 'Confirmed' && <button type="button" onClick={() => printConfirmedOrder(row)} className="p-2 text-[#1B3A5C] hover:bg-[#F5F6F8] rounded-lg" title="Print confirmation form"><FileText className="w-4 h-4" /></button>}</div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280]">Procurement</span><h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C]">ICT Purchase Orders</h2></div>
        <div className="flex items-center gap-2.5"><ExportButton data={purchases} filename="IAA_Procurement" exportFormat="pdf" /><button onClick={handleOpenNew} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-black text-white bg-[#1B3A5C] hover:bg-[#12294A] shadow-lg rounded-lg border-2 border-[#C9A227]"><Plus className="w-5 h-5" />Create Purchase Order</button></div>
      </div>
      <Table columns={columns} data={purchases} loading={loading} emptyMessage="No purchase orders." emptyActionLabel="Create PO" onEmptyAction={handleOpenNew} searchPlaceholder="Search PO..." />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Purchase Order" maxWidth="lg" footer={<><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-[#1A1A1A]">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-xs text-white bg-[#1B3A5C]">Create</button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vendor" name="supplierId" type="select" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} required placeholder="Select a supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
          <FormField label="Items Summary" name="itemsSummary" type="textarea" rows={2} value={formData.itemsSummary} onChange={(e) => setFormData({ ...formData, itemsSummary: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><FormField label="Total Units" name="itemCount" type="number" value={formData.itemCount} onChange={(e) => setFormData({ ...formData, itemCount: Number(e.target.value) || 0 })} required /><FormField label="Total Amount (TZS)" name="totalAmount" type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) || 0 })} required /><FormField label="Order Date" name="orderDate" type="date" value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} required /><FormField label="Expected Delivery" name="deliveryDate" type="date" value={formData.deliveryDate || ''} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} /></div>
          <FormField label="Status" name="status" type="select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as PurchaseOrderInput['status'] })} required options={['Draft', 'Ordered', 'Received', 'Confirmed', 'Cancelled'].map((status) => ({ value: status, label: status }))} />
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseList;
