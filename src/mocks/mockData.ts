import {
  Asset,
  AssetAssignment,
  AssetTransfer,
  MaintenanceRecord,
  DisposalRecord,
  Supplier,
  PurchaseOrder,
  Campus,
  Department,
  Employee,
  User,
  AuditLog,
} from '../types';

// Data is intentionally kept empty here so the application reads from the database
// instead of relying on legacy hard-coded user and institutional records.
export const initialUsers: User[] = [];

export const initialCampuses: Campus[] = [];

export const initialDepartments: Department[] = [];

export const initialEmployees: Employee[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialPurchases: PurchaseOrder[] = [];

export const initialAssets: Asset[] = [];

export const initialAssignments: AssetAssignment[] = [];

export const initialTransfers: AssetTransfer[] = [];

export const initialMaintenance: MaintenanceRecord[] = [];

export const initialDisposals: DisposalRecord[] = [];

export const initialAuditLogs: AuditLog[] = [];
