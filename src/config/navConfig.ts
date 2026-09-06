import { ROLES, UserRole } from './roles';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: string;
  allowedRoles: UserRole[];
  dividerAfter?: boolean;
}

const ALL_ROLES: UserRole[] = Object.values(ROLES);

const UNIQUE_ROLES = [...new Set(Object.values(ROLES))] as UserRole[];

// Note: Reports functionality has been moved to individual list pages (Assets, Employees, Users, etc.)
// Users can now export PDFs directly from any list page using the "Get PDF" button at the top
export const navConfig: NavItemConfig[] = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', allowedRoles: UNIQUE_ROLES },
  { label: 'Assets', path: '/assets', icon: 'Laptop', allowedRoles: UNIQUE_ROLES },
  { label: 'My Assets', path: '/my-assets', icon: 'ClipboardList', allowedRoles: [ROLES.EMPLOYEE, ROLES.LAB_MANAGER] },
  { label: 'Assigned Assets', path: '/assignments', icon: 'UserCheck', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER] },
  { label: 'Transfers', path: '/transfers', icon: 'ArrowLeftRight', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER, ROLES.HEAD_OF_DEPARTMENT] },
  { label: 'Maintenance', path: '/maintenance', icon: 'Wrench', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER, ROLES.LAB_MANAGER, ROLES.TECHNICIAN, ROLES.HEAD_OF_DEPARTMENT, ROLES.EMPLOYEE] },
  { label: 'Procurement', path: '/purchases', icon: 'ShoppingCart', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.PROCUREMENT_OFFICER] },
  { label: 'Suppliers', path: '/suppliers', icon: 'Truck', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.PROCUREMENT_OFFICER] },
  { label: 'Locations', path: '/campuses', icon: 'Building2', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN] },
  { label: 'Employees', path: '/employees', icon: 'Users', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER, ROLES.HEAD_OF_DEPARTMENT] },
  // Reports navigation removed - users can export PDFs from individual list pages
  { label: 'Disposal', path: '/disposal', icon: 'Trash2', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.ICT_OFFICER] },
  { label: 'Audit Trail', path: '/audit', icon: 'ShieldCheck', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.AUDIT_OFFICER, ROLES.ICT_OFFICER] },
  { label: 'Users', path: '/users', icon: 'Users', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN] },
  { label: 'Roles & Permissions', path: '/roles', icon: 'ShieldCheck', allowedRoles: [ROLES.OVERALL_ADMIN] },
  { label: 'Settings', path: '/settings', icon: 'Settings', allowedRoles: [ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN], dividerAfter: true },
];
