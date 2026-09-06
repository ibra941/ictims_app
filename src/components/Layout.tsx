import React, { useState } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Laptop,
  UserCheck,
  ArrowLeftRight,
  Wrench,
  Truck,
  ShoppingCart,
  Trash2,
  Building2,
  Users,
  ShieldCheck,
  FileBarChart,
  FileText,
  Settings,
  QrCode,
  Menu,
  X,
  LogOut,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navConfig, NavItemConfig } from '../config/navConfig';
import { Branding } from './Branding';
import { SessionExpirationWarning } from './SessionExpirationWarning';
import Modal from './Modal';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Laptop,
  UserCheck,
  ArrowLeftRight,
  Wrench,
  Truck,
  ShoppingCart,
  Trash2,
  Building2,
  Users,
  ShieldCheck,
  FileBarChart,
  FileText,
  Settings,
  QrCode,
};

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const currentNavItem = navConfig.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNavItem ? currentNavItem.label : 'ICTIMS';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password_confirmation) {
      showToast('Please complete all password fields.', 'error');
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      showToast('New password confirmation does not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    const result = await authService.changePassword({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      new_password_confirmation: passwordForm.new_password_confirmation,
    });

    if (result.success) {
      showToast('Password changed successfully.', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } else {
      showToast(result.message || 'Unable to change password.', 'error');
    }

    setPasswordLoading(false);
  };

  const isAllowed = (item: NavItemConfig): boolean => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#1B3A5C] text-white">
      <div className="p-3.5 sm:p-4 mb-1 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Branding variant="compact" showText={false} className="[&_img]:brightness-110" />
          <div className="min-w-0">
            <span className="text-base font-black tracking-tight text-white block leading-none truncate">IAA</span>
            <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-[#C9A227] block mt-0.5 truncate">INVENTORY</span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close sidebar menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 text-xs font-medium">
        {navConfig.map((item) => {
          if (!isAllowed(item)) return null;
          const Icon = iconMap[item.icon] || Laptop;
          const isActive =
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

          return (
            <React.Fragment key={`${item.label}-${item.path}`}>
              <NavLink
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-all text-xs ${
                  isActive
                    ? 'bg-[#12294A] text-white font-bold opacity-100 shadow-xs border-l-2 border-[#C9A227]'
                    : 'text-white/70 hover:text-white hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
              {item.dividerAfter && (
                <div className="pt-2 pb-0.5 border-t border-white/10 mx-1.5 mt-1.5">
                  <span className="text-[8px] uppercase tracking-widest text-[#C9A227]/70 font-bold">Configuration</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="p-2.5 border-t border-white/10 md:hidden bg-[#0F2238]">
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SessionExpirationWarning />
      <div className="min-h-screen flex bg-[#F5F6F8] font-sans text-[#1A1A1A]">
        <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-30 shadow-md">
          {navContent}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/20 transition-opacity animate-in fade-in duration-150 cursor-pointer"
              onClick={() => setMobileOpen(false)}
              aria-label="Click to close menu and view page"
            />
            <div className="relative flex-1 flex flex-col w-52 max-w-[215px] sm:w-56 sm:max-w-[230px] rounded-r-2xl shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-hidden border-r border-[#12294A]">
              {navContent}
            </div>
          </div>
        )}

        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <header className="h-16 sm:h-20 bg-white border-b border-[#E9EBEF] flex items-center justify-between px-3.5 sm:px-8 shrink-0 sticky top-0 z-20 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl text-[#1B3A5C] hover:bg-[#F5F6F8] border border-[#E9EBEF] min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6B7280]">IAA</p>
                <h1 className="text-base sm:text-2xl font-black text-[#1B3A5C] tracking-tight truncate max-w-[170px] sm:max-w-none">
                  {pageTitle === 'Dashboard' ? 'Inventory Management System' : pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              <div className="flex items-center gap-2.5 sm:gap-3 select-none">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs sm:text-sm font-bold text-[#1A1A1A] leading-tight truncate max-w-[160px]">
                    {user?.name || 'Authorized User'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-white bg-[#1B3A5C] px-2 py-0.5 rounded uppercase tracking-wider mt-0.5">
                    {user?.role || 'Staff'}
                  </span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1B3A5C]/10 rounded-full border-2 border-white shadow-xs flex items-center justify-center overflow-hidden font-black text-xs text-[#1B3A5C] shrink-0">
                  {user?.name
                    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                    : <UserIcon className="w-4 h-4 text-[#6B7280]" />}
                </div>
              </div>

              <button
                id="header-change-password-btn"
                onClick={() => setShowPasswordModal(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-[#1B3A5C] hover:text-[#12294A] hover:bg-[#EDF3FF] text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#E9EBEF]"
                title="Change password"
              >
                <KeyRound className="w-4 h-4" />
                <span className="hidden md:inline">Change Password</span>
              </button>

              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-[#6B7280] hover:text-[#8B232A] hover:bg-[#F9ECEE] text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#E9EBEF]"
                title="Sign out of ICTIMS"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        maxWidth="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">Current password</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#1B3A5C] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">New password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#1B3A5C] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">Confirm new password</label>
            <input
              type="password"
              value={passwordForm.new_password_confirmation}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#1B3A5C] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1B3A5C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-xl bg-[#1B3A5C] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#12294A] disabled:opacity-60"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Layout;
