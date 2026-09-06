import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, TrendingUp, Users, Laptop, Wrench, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reportService, DashboardMetrics } from '../../services/reportService';
import { auditService } from '../../services/auditService';
import { userService } from '../../services/userService';
import { assetService } from '../../services/assetService';
import { AuditLog, Asset, User } from '../../types';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatCurrencyCompact, formatDateTime } from '../../utils/formatters';
import { ROLES } from '../../config/roles';
import { RoleDashboard } from './DashboardWidgets';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const canViewAudit = user.role === ROLES.OVERALL_ADMIN || user.role === ROLES.CAMPUS_ADMIN;
    const metricsPromise = reportService.getDashboardMetrics(user);
    const logsPromise = canViewAudit ? auditService.getAll() : Promise.resolve({ success: true, data: [] as AuditLog[] });
    let extraPromise: Promise<any> = Promise.resolve({ success: true, data: [] });

    if (user.role === ROLES.EMPLOYEE) extraPromise = assetService.getAll();
    else if (user.role === ROLES.OVERALL_ADMIN || user.role === ROLES.CAMPUS_ADMIN) extraPromise = userService.getAll();

    Promise.allSettled([metricsPromise, logsPromise, extraPromise]).then(([metricsResult, logsResult, extraResult]) => {
      if (metricsResult.status === 'fulfilled' && metricsResult.value.success && metricsResult.value.data) setMetrics(metricsResult.value.data);
      else if (metricsResult.status === 'rejected') setDashboardError(metricsResult.reason?.message || 'Dashboard metrics could not be loaded.');
      if (logsResult.status === 'fulfilled' && logsResult.value.success && logsResult.value.data) setRecentLogs(logsResult.value.data.slice(0, 6));
      if (extraResult.status === 'fulfilled' && extraResult.value?.success && extraResult.value.data) {
        if (user.role === ROLES.EMPLOYEE) {
          const myEquipment = (extraResult.value.data as Asset[]).filter((a) => a.assignedTo === user.id || a.assignedEmployeeName?.toLowerCase().includes(user.name?.toLowerCase() ?? ''));
          setUserAssets(myEquipment);
        }
        if (user.role === ROLES.OVERALL_ADMIN || user.role === ROLES.CAMPUS_ADMIN) setAllUsersList(extraResult.value.data as User[]);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading || !user) return <div className="py-24"><Loading message="Compiling personalized dashboard..." /></div>;
  if (dashboardError || !metrics) return <div className="py-24 text-center text-[#6B7280]">{dashboardError || 'Dashboard data is unavailable right now.'}</div>;

  return <RoleDashboard user={user} metrics={metrics} recentLogs={recentLogs} userAssets={userAssets} allUsers={allUsersList} />;
};

export default Dashboard;
