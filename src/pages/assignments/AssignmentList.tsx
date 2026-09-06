import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { AssetAssignment } from '../../types';
import { ROLES } from '../../config/roles';
import Table, { Column } from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

export const AssignmentList: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [campusFilter, setCampusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [labFilter, setLabFilter] = useState('All');
  const [officeFilter, setOfficeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const isOverallAdmin = user?.role === ROLES.OVERALL_ADMIN;

  const fetchData = async () => {
    setLoading(true);
    try {
      const assignRes = await assignmentService.getAll();
      if (assignRes.success && assignRes.data) setAssignments(assignRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const campuses = [...new Set(assignments.map((assignment) => assignment.campus).filter(Boolean))];
  const departments = [...new Set(assignments.map((assignment) => assignment.department).filter(Boolean))];
  const labs = [...new Set(assignments.filter((assignment) => assignment.assignmentType === 'Lab').map((assignment) => assignment.location).filter(Boolean))];
  const offices = [...new Set(assignments.filter((assignment) => assignment.assignmentType === 'Office').map((assignment) => assignment.location).filter(Boolean))];
  const filteredAssignments = assignments
    .filter((assignment) => campusFilter === 'All' || assignment.campus === campusFilter)
    .filter((assignment) => departmentFilter === 'All' || assignment.department === departmentFilter)
    .filter((assignment) => labFilter === 'All' || assignment.location === labFilter)
    .filter((assignment) => officeFilter === 'All' || assignment.location === officeFilter)
    .filter((assignment) => statusFilter === 'All' || assignment.status === statusFilter);

  const columns: Column<AssetAssignment>[] = [
    { key: 'assetName', label: 'Asset', sortable: true, render: (row) => (
      <div>
        <div className="font-bold text-[#1B3A5C]">{row.assetName}</div>
        <div className="text-[10px] text-[#6B7280]">{row.assetId}</div>
      </div>
    )},
    ...(!isOverallAdmin ? [{ key: 'location', label: 'Department / Lab / Office', sortable: true, render: (row: AssetAssignment) => (
      <div>
        <div className="font-bold text-[#1A1A1A]">{row.location}</div>
        <div className="text-[10px] text-[#6B7280]">{row.assignmentType}</div>
      </div>
    )}] : []),
    { key: 'employeeName', label: isOverallAdmin ? 'Department' : 'Employee / Custodian', sortable: true, render: (row) => (
      <div>
        <div className="font-bold text-[#1A1A1A]">{isOverallAdmin ? row.department : row.employeeName}</div>
        {!isOverallAdmin && <div className="text-[10px] text-[#6B7280]">{row.office || row.employeeId}</div>}
      </div>
    )},
    ...(isOverallAdmin ? [{ key: 'assetType', label: 'Type', sortable: true, render: (row: AssetAssignment) => <span className="text-xs text-[#1A1A1A]">{row.assetType || '—'}</span> }] : []),
    { key: 'assignDate', label: 'Date', sortable: true, render: (row) => (
      <span className="text-xs text-[#1A1A1A]">{row.assignDate}</span>
    )},
    ...(isOverallAdmin ? [{ key: 'campus', label: 'Campus', sortable: true, render: (row: AssetAssignment) => (
      <span className="text-xs text-[#1A1A1A]">{row.campus || 'Unassigned campus'}</span>
    )}] : []),
    { key: 'status', label: 'Status', sortable: true, render: (row) => (
      <StatusBadge status={row.status} size="sm" />
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280]">Asset Management</span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C]">Assigned Assets</h2>
        </div>
        <div className="flex items-center gap-2.5">
          <ExportButton data={filteredAssignments} filename="IAA_Assigned_Assets" exportFormat="pdf" />
        </div>
      </div>
      <div className="rounded-2xl border border-[#E9EBEF] bg-white p-4 shadow-xs flex flex-wrap gap-3">
        {isOverallAdmin && <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value)} className="px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg"><option value="All">All Campuses</option>{campuses.map((campus) => <option key={campus} value={campus}>{campus}</option>)}</select>}
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg"><option value="All">All Departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select>
        {!isOverallAdmin && <><select value={labFilter} onChange={(event) => setLabFilter(event.target.value)} className="px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg"><option value="All">All Labs</option>{labs.map((lab) => <option key={lab} value={lab}>{lab}</option>)}</select><select value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value)} className="px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg"><option value="All">All Offices</option>{offices.map((office) => <option key={office} value={office}>{office}</option>)}</select></>}
        {isOverallAdmin && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 text-xs border border-[#E9EBEF] rounded-lg"><option value="All">All Statuses</option><option value="Active">Active</option><option value="Returned">Returned</option><option value="Overdue">Overdue</option></select>}
      </div>
      <Table columns={columns} data={filteredAssignments} loading={loading} emptyMessage="No assigned assets found." searchPlaceholder="Search assigned assets..." />
    </div>
  );
};

export default AssignmentList;
