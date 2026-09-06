import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Settings, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';

interface SystemGovernancePageProps {
  mode: 'roles' | 'settings';
}

const content = {
  roles: {
    title: 'Roles & Permissions',
    description: 'Review the six approved ICTIMS roles and their least-privilege access boundaries.',
    icon: ShieldCheck,
  },
  settings: {
    title: 'System Settings',
    description: 'System-wide configuration and operational settings are managed here.',
    icon: Settings,
  },
};

const rolePermissions = [
  ['Overall Administrator', 'Full cross-campus access, governance configuration, system oversight, and unrestricted platform control'],
  ['Campus Administrator', 'Campus-level user administration, asset oversight, transfer approvals, and operational management for one campus'],
  ['Audit Officer', 'Monitors audit logs, investigates suspicious activity, and generates security reports for one campus'],
  ['ICT Officer', 'Registry maintenance, assignments, transfers, maintenance, and operational asset support'],
  ['Procurement Officer', 'Suppliers, purchasing, procurement workflow approvals, and related reporting'],
  ['Head of Department', 'Department-level asset approval, transfer review, and local operational governance'],
  ['Lab Manager', 'Lab asset accountability, maintenance coordination, and operational access for lab units'],
  ['Employee', 'Own assigned assets, request submissions, and personal asset access only'],
] as const;

const SystemGovernancePage: React.FC<SystemGovernancePageProps> = ({ mode }) => {
  const { title, description, icon: Icon } = content[mode];
  const { user } = useAuth();
  const canManageRoles = user?.role === ROLES.OVERALL_ADMIN;

  if (mode === 'roles') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">System governance</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1B3A5C]">{title}</h1>
          <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
        </div>
        <section className="overflow-hidden rounded-2xl border border-[#E9EBEF] bg-white shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#E9EBEF] p-5 text-[#1B3A5C]"><Icon className="h-5 w-5" /><h2 className="font-black">Approved role boundaries</h2></div>
          <div className="divide-y divide-[#F0F1F3]">
            {rolePermissions.map(([role, permissions]) => (
              <div key={role} className="grid gap-2 p-5 sm:grid-cols-[220px_1fr] sm:items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1B3A5C]"><Check className="h-4 w-4 text-emerald-700" />{role}</div>
                <p className="text-sm text-[#6B7280]">{permissions}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">System governance</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1B3A5C]">{title}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
      </div>
      <section className="rounded-2xl border border-[#E9EBEF] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 text-[#1B3A5C]"><Icon className="h-5 w-5" /><h2 className="font-black">Configuration overview</h2></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F7F8FA] p-4"><p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Session duration</p><p className="mt-2 text-lg font-black text-[#1B3A5C]">30 minutes</p><p className="mt-1 text-xs text-[#6B7280]">Automatic session expiry is enabled.</p></div>
          <div className="rounded-xl bg-[#F7F8FA] p-4"><p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Audit tracking</p><p className="mt-2 text-lg font-black text-emerald-800">Enabled</p><p className="mt-1 text-xs text-[#6B7280]">Create, update, delete, assignment, and transfer actions are recorded.</p></div>
          <div className="rounded-xl bg-[#F7F8FA] p-4"><p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Access model</p><p className="mt-2 text-lg font-black text-[#1B3A5C]">Least privilege</p><p className="mt-1 text-xs text-[#6B7280]">Users only receive modules allowed for their role.</p></div>
          <div className="rounded-xl bg-[#F7F8FA] p-4"><p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">System status</p><p className="mt-2 text-lg font-black text-emerald-800">Operational</p><p className="mt-1 text-xs text-[#6B7280]">Authentication and API services are available.</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E9EBEF] bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3A5C]" />
          <div className="min-w-0">
            <h2 className="font-black text-[#1B3A5C]">Access control</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Signed in as <span className="font-bold text-[#1B3A5C]">{user?.role || 'Authorized User'}</span>.
              {canManageRoles
                ? ' You can create roles and change their permissions.'
                : ' You can manage system operations for your campus; role definitions and permissions are controlled by the Overall Administrator.'}
            </p>
            {canManageRoles && (
              <Link
                to="/roles"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1B3A5C] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#12294A]"
              >
                <ShieldCheck className="h-4 w-4" />
                Manage Roles & Permissions
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SystemGovernancePage;
