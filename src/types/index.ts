import type { Role } from '../config/roles';

export type UserRole = Role;

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: UserRole;
  role_id?: number;
  campus?: string | null;
  department?: string | null;
  office?: string | null;
  phone?: string;
  createdAt?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface DisposalRecord {
  id: string;
  disposalNumber: string;
  batchId?: string;
  assetId: string;
  assetName: string;
  assetTag?: string;
  method: 'Auction' | 'Scrap' | 'Donation' | 'Write-off' | string;
  reason: string;
  disposalDate: string;
  status: 'Disposed' | string;
  recordedBy?: string;
  disposalOfficer?: string;
  recipientName?: string;
  recipientContact?: string;
  procurementSignatory?: string;
  campusAdminSignatory?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId?: string;
  supplierName: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  currency: string;
  status: 'Draft' | 'Ordered' | 'Received' | 'Confirmed' | 'Cancelled' | string;
  itemCount: number;
  itemsSummary: string;
  campus?: string;
}

export interface PurchaseOrderInput {
  supplierId: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  currency: string;
  status: 'Draft' | 'Ordered' | 'Received' | 'Confirmed' | 'Cancelled';
  itemCount: number;
  itemsSummary: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  isActive?: boolean;
  status?: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  assetName: string;
  assetType?: string;
  employeeId: string;
  employeeName: string;
  campus?: string;
  department?: string;
  assignmentType?: 'Department' | 'Lab' | 'Office' | string;
  location?: string;
  office?: string;
  assignDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue' | string;
  notes?: string;
}

export interface AssignmentLocation {
  id: string;
  departmentId?: string;
  type: 'Lab' | 'Office';
  name: string;
}

export interface AssetTransfer {
  id: string;
  transferNumber: string;
  assetId: string;
  assetName: string;
  fromCampus: string;
  fromDepartment?: string;
  toCampus: string;
  toDepartment?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | string;
  transferDate: string;
  reason?: string;
}

export interface Employee {
  id?: string;
  employeeId?: string;
  employeeNo?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  departmentId?: number | string;
  campus?: string;
  designation?: string;
  jobTitle?: string;
  isActive?: boolean;
  assignedAssetsCount?: number;
  createdAt?: string;
  status?: string;
}

export interface Asset {
  id: string;
  serialNumber: string;
  name: string;
  model: string;
  category: string;
  categoryId?: number;
  categoryType?: 'Hardware' | 'Software';
  campus: string;
  campusId?: number;
  department: string;
  departmentId?: number;
  supplier: string;
  supplierId?: number;
  status: 'Available' | 'Assigned' | 'Under Maintenance' | 'Disposed' | 'Lost';
  disposalReady?: boolean;
  cost: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  description?: string;
  imageUrl?: string;
  qrCode?: string;
  assetTag?: string;
  assignedTo?: string;
  assignDate?: string;
  expectedReturnDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  location?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  campusId?: string;
  campus?: string | Campus;
  description?: string;
  headOfDepartment?: string;
  totalEmployees?: number;
  totalAssets?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  tableName?: string;
  recordId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'TRANSFER' | 'MAINTENANCE' | 'DISPOSAL' | 'LOGIN' | 'LOGIN_FAILED' | string;
  module: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  createdAt?: string;
  userName: string;
  userRole: string;
  campus: string;
  department: string;
}
