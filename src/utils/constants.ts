import { ROLES, UserRole } from '../config/roles';
import { navConfig, NavItemConfig } from '../config/navConfig';

export const USER_ROLES: UserRole[] = [...new Set(Object.values(ROLES))];
export { ROLES };
export type { NavItemConfig };
export const NAV_ITEMS = navConfig;

export const IAA_CAMPUSES = [
  'Arusha',
  'Babati',
  'Dar es Salaam',
  'Dodoma',
  'Songea',
  'Bukombe',
  'Zanzibar',
] as const;

export const ASSET_CATEGORIES = [
  'Laptops',
  'Desktops',
  'Servers',
  'Networking',
  'Printers',
  'Projectors',
  'Monitors',
  'Accessories',
] as const;

export const ASSET_STATUSES = [
  'Available',
  'Assigned',
  'Under Maintenance',
  'Pending Transfer',
  'Disposed',
] as const;

export const ASSET_CONDITIONS = [
  'New',
  'Good',
  'Fair',
  'Faulty',
  'Damaged',
] as const;

