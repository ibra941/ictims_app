export const ROLES = {
  OVERALL_ADMIN: 'Overall Administrator',
  CAMPUS_ADMIN: 'Campus Administrator',
  AUDIT_OFFICER: 'Audit Officer',
  ICT_OFFICER: 'ICT Officer',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  HEAD_OF_DEPARTMENT: 'Head of Department',
  LAB_MANAGER: 'Lab Manager',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Employee',

  // Legacy aliases retained to avoid breaking older screens and code paths.
  SYSTEM_ADMIN: 'Overall Administrator',
  DEPARTMENT_HEAD: 'Head of Department',
  SENIOR_MANAGEMENT: 'Overall Administrator',
  UNIT_APPROVER: 'Head of Department',
  ASSET_OFFICER: 'ICT Officer',
  AUDITOR_EXECUTIVE: 'Overall Administrator',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_ID_MAP: Record<number, Role> = {
  1: ROLES.OVERALL_ADMIN,
  2: ROLES.CAMPUS_ADMIN,
  9: ROLES.AUDIT_OFFICER,
  3: ROLES.ICT_OFFICER,
  4: ROLES.PROCUREMENT_OFFICER,
  5: ROLES.HEAD_OF_DEPARTMENT,
  6: ROLES.LAB_MANAGER,
  7: ROLES.TECHNICIAN,
  8: ROLES.EMPLOYEE,
};

export const ROLE_NAME_TO_ID: Record<Role, number> = {
  [ROLES.OVERALL_ADMIN]: 1,
  [ROLES.CAMPUS_ADMIN]: 2,
  [ROLES.AUDIT_OFFICER]: 9,
  [ROLES.ICT_OFFICER]: 3,
  [ROLES.PROCUREMENT_OFFICER]: 4,
  [ROLES.HEAD_OF_DEPARTMENT]: 5,
  [ROLES.LAB_MANAGER]: 6,
  [ROLES.TECHNICIAN]: 7,
  [ROLES.EMPLOYEE]: 8,
};

export const canRole = (role: Role | undefined, permission: string): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.some((granted) =>
    granted === '*' || granted === permission || (granted.endsWith('.*') && permission.startsWith(granted.slice(0, -1)))
  ) ?? false;
};

// Note: These permissions are now configurable in the database via the admin panel.
// Admins can add/update roles and permissions without touching source code.
// The permissions below serve as defaults and can be overridden by database values.
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.OVERALL_ADMIN]: ['*'],
  [ROLES.CAMPUS_ADMIN]: ['dashboard.view', 'assets.*', 'assignments.*', 'maintenance.*', 'disposal.*', 'transfers.*', 'employees.*', 'users.*', 'system.*', 'audit.*', 'reports.view'],
  [ROLES.AUDIT_OFFICER]: ['dashboard.view', 'audit.*', 'reports.view'],
  [ROLES.ICT_OFFICER]: ['dashboard.view', 'assets.*', 'assignments.*', 'maintenance.*', 'procurement.*', 'suppliers.*', 'disposal.*', 'transfers.*', 'employees.view', 'requests.*', 'audit.view'],
  [ROLES.PROCUREMENT_OFFICER]: ['dashboard.view', 'procurement.*', 'suppliers.*', 'assets.view'],
  [ROLES.HEAD_OF_DEPARTMENT]: ['dashboard.view', 'assets.view', 'assignments.view', 'maintenance.view', 'transfers.approve', 'requests.approve', 'employees.view'],
  [ROLES.LAB_MANAGER]: ['dashboard.view', 'assets.*', 'maintenance.*', 'requests.approve'],
  [ROLES.TECHNICIAN]: ['dashboard.view', 'assets.view', 'maintenance.*', 'requests.view'],
  [ROLES.EMPLOYEE]: ['dashboard.view', 'assets.view', 'my-assets.view', 'requests.create', 'requests.view', 'maintenance.view', 'maintenance.create'],
};
