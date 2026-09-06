import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Laptop, ShieldCheck, Users } from 'lucide-react';
import { DashboardMetrics } from '../../services/reportService';
import { AuditLog, Asset, User } from '../../types';
import { ROLES } from '../../config/roles';
import { formatCurrencyCompact, formatDateTime } from '../../utils/formatters';

interface DashboardData {
  user: User;
  metrics: DashboardMetrics;
  recentLogs: AuditLog[];
  userAssets: Asset[];
  allUsers: User[];
}

interface WidgetProps {
  title: string;
  value: string | number;
  detail?: string;
  icon: React.ElementType;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

const toneClasses = {
  blue: 'bg-blue-50 text-blue-900',
  green: 'bg-emerald-50 text-emerald-900',
  amber: 'bg-amber-50 text-amber-900',
  red: 'bg-red-50 text-red-900',
};

export const MetricWidget: React.FC<WidgetProps> = ({ title, value, detail, icon: Icon, tone = 'blue' }) => (
  <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">{title}</p>
        <p className="mt-2 text-2xl font-black tracking-tight text-[#1B3A5C]">{value}</p>
        {detail && <p className="mt-1 text-xs text-[#6B7280]">{detail}</p>}
      </div>
      <div className={`rounded-xl p-2.5 ${toneClasses[tone]}`}><Icon className="h-5 w-5" /></div>
    </div>
  </section>
);

export const StatusWidget: React.FC<{ metrics: DashboardMetrics }> = ({ metrics }) => (
  <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
    <div className="mb-4 flex items-center gap-2"><Laptop className="h-4 w-4 text-[#1B3A5C]" /><h2 className="text-sm font-black text-[#1B3A5C]">Assets by status</h2></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div><p className="text-xs text-[#6B7280]">In store</p><p className="text-xl font-black text-[#1B3A5C]">{metrics.availableAssets}</p></div>
      <div><p className="text-xs text-[#6B7280]">In use</p><p className="text-xl font-black text-[#1B3A5C]">{metrics.assignedAssets}</p></div>
      <div><p className="text-xs text-[#6B7280]">Under repair</p><p className="text-xl font-black text-[#1B3A5C]">{metrics.underMaintenance}</p></div>
      <div><p className="text-xs text-[#6B7280]">Disposed</p><p className="text-xl font-black text-[#1B3A5C]">{metrics.disposedAssets}</p></div>
    </div>
  </section>
);

export const ActivityWidget: React.FC<{ logs: AuditLog[]; title?: string }> = ({ logs, title = 'Recent activity' }) => (
  <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
    <div className="mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-[#1B3A5C]" /><h2 className="text-sm font-black text-[#1B3A5C]">{title}</h2></div>
    {logs.length === 0 ? <p className="text-sm text-[#6B7280]">No activity available.</p> : <div className="space-y-3">{logs.slice(0, 5).map((log) => <div key={log.id} className="flex items-start justify-between gap-3 border-b border-[#F0F1F3] pb-3 last:border-0"><div><p className="text-xs font-bold text-[#1A1A1A]">{log.description}</p><p className="mt-1 text-[11px] text-[#6B7280]">{log.userName} · {log.action}</p></div><time className="shrink-0 text-[10px] text-[#6B7280]">{formatDateTime(log.timestamp)}</time></div>)}</div>}
  </section>
);

export const AssetListWidget: React.FC<{ assets: Asset[]; title?: string }> = ({ assets, title = 'My assigned assets' }) => (
  <section className="rounded-2xl border border-[#E9EBEF] bg-white p-5 shadow-xs">
    <div className="mb-4 flex items-center gap-2"><Laptop className="h-4 w-4 text-[#1B3A5C]" /><h2 className="text-sm font-black text-[#1B3A5C]">{title}</h2></div>
    {assets.length === 0 ? <p className="text-sm text-[#6B7280]">No assigned assets.</p> : <div className="space-y-2">{assets.slice(0, 6).map((asset) => <div key={asset.id} className="flex items-center justify-between rounded-lg bg-[#F7F8FA] px-3 py-2"><span className="text-xs font-bold text-[#1A1A1A]">{asset.assetTag} · {asset.name}</span><span className="text-[10px] font-bold text-[#6B7280]">{asset.status}</span></div>)}</div>}
  </section>
);

const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">ICTIMS dashboard</p><h1 className="mt-1 text-2xl font-black tracking-tight text-[#1B3A5C]">Operational overview</h1></div>{children}</div>;

export const RoleDashboard: React.FC<DashboardData> = ({ user, metrics, recentLogs, userAssets, allUsers }) => {
  const common = <StatusWidget metrics={metrics} />;

  if (user.role === ROLES.EMPLOYEE) {
    return <DashboardShell><div className="grid gap-4 sm:grid-cols-3"><MetricWidget title="My assets" value={userAssets.length} icon={Laptop} /><MetricWidget title="Open issues" value={metrics.underMaintenance} icon={AlertTriangle} tone="amber" /><MetricWidget title="Asset value" value={formatCurrencyCompact(userAssets.reduce((sum, asset) => sum + (asset.purchaseCost || 0), 0))} icon={CheckCircle2} tone="green" /></div><AssetListWidget assets={userAssets} /><ActivityWidget logs={recentLogs} title="My asset history" /></DashboardShell>;
  }

  if (user.role === ROLES.SYSTEM_ADMIN) {
    return <DashboardShell><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricWidget title="Total users" value={allUsers.length} icon={Users} /><MetricWidget title="Total assets" value={metrics.totalAssets} icon={Laptop} /><MetricWidget title="Pending approvals" value={metrics.pendingTransfers + metrics.underMaintenance} icon={Clock} tone="amber" /><MetricWidget title="System health" value="Healthy" detail="API responding" icon={ShieldCheck} tone="green" /></div>{common}<ActivityWidget logs={recentLogs} title="Recent audit activity" /></DashboardShell>;
  }

  if (user.role === ROLES.ASSET_OFFICER) {
    return <DashboardShell><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricWidget title="Pending assignment" value={metrics.availableAssets} icon={Clock} tone="amber" /><MetricWidget title="Maintenance due" value={metrics.underMaintenance} icon={AlertTriangle} tone="red" /><MetricWidget title="Total assets" value={metrics.totalAssets} icon={Laptop} /><MetricWidget title="Transfers pending" value={metrics.pendingTransfers} icon={Activity} /></div>{common}<ActivityWidget logs={recentLogs} title="Recent transfers and operations" /></DashboardShell>;
  }

  if (user.role === ROLES.PROCUREMENT_OFFICER) {
    return <DashboardShell><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricWidget title="Open purchase orders" value={metrics.pendingTransfers} icon={Clock} tone="amber" /><MetricWidget title="Supplier count" value={metrics.campusBreakdown.length} icon={Users} /><MetricWidget title="Recent activity" value={recentLogs.length} icon={Activity} /><MetricWidget title="Spend summary" value={formatCurrencyCompact(metrics.totalAssetValue)} icon={CheckCircle2} tone="green" /></div><ActivityWidget logs={recentLogs} title="Recent procurement activity" /></DashboardShell>;
  }

  if (user.role === ROLES.UNIT_APPROVER) {
    return <DashboardShell><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricWidget title="Unit assets" value={metrics.totalAssets} icon={Laptop} /><MetricWidget title="Pending approvals" value={metrics.pendingTransfers + metrics.underMaintenance} icon={Clock} tone="amber" /><MetricWidget title="Assigned assets" value={metrics.assignedAssets} icon={Users} /><MetricWidget title="Upcoming maintenance" value={metrics.underMaintenance} icon={AlertTriangle} tone="red" /></div>{common}<ActivityWidget logs={recentLogs} title="Recent unit activity" /></DashboardShell>;
  }

  return <DashboardShell><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricWidget title="Total assets" value={metrics.totalAssets} icon={Laptop} /><MetricWidget title="Asset value" value={formatCurrencyCompact(metrics.totalAssetValue)} icon={CheckCircle2} tone="green" /><MetricWidget title="Under maintenance" value={metrics.underMaintenance} icon={AlertTriangle} tone="amber" /><MetricWidget title="Campuses" value={metrics.campusBreakdown.length} icon={Users} /></div>{common}<ActivityWidget logs={[]} title="Institutional activity" /></DashboardShell>;
};
