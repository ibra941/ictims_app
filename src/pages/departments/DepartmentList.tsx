import React, { useState, useEffect } from 'react';
import { Network, Users, Laptop } from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { Department } from '../../types';
import Table, { Column } from '../../components/Table';
import ExportButton from '../../components/ExportButton';

export const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    departmentService.getAll().then((res) => {
      if (res.success && res.data) setDepartments(res.data);
      setLoading(false);
    });
  }, []);

  const columns: Column<Department>[] = [
    {
      key: 'code',
      label: 'Dept Code',
      sortable: true,
      render: (row) => <span className="font-bold text-[var(--color-navy)]">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'Department Name',
      sortable: true,
      render: (row) => <div className="font-semibold text-[var(--color-gray-900)]">{row.name}</div>,
    },
    {
      key: 'campus',
      label: 'Campus',
      sortable: true,
      render: (row) => <div className="text-xs text-[var(--color-gray-500)]">{row.campus}</div>,
    },
    {
      key: 'headOfDepartment',
      label: 'Head of Department (HOD)',
      sortable: true,
      render: (row) => <div className="font-medium text-[var(--color-navy)]">{row.headOfDepartment}</div>,
    },
    {
      key: 'stats',
      label: 'Staff & Asset Allocation',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-[var(--color-gray-900)] font-medium">
            <Users className="w-3.5 h-3.5 text-[var(--color-gray-500)]" />
            {row.totalEmployees} Staff
          </span>
          <span className="flex items-center gap-1 text-[var(--color-navy)] font-semibold">
            <Laptop className="w-3.5 h-3.5" />
            {row.totalAssets} Assets
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#6B7280] block mb-1">
            Organisational Structure
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B3A5C] tracking-tight">Academic and Administrative Departments</h2>
          <p className="text-xs text-[#6B7280] font-medium mt-1.5">
            Faculty directorates, administrative units, and staff allocations
          </p>
        </div>

        <ExportButton data={departments} filename="IAA_Departments" exportFormat="pdf" />
      </div>

      <Table
        columns={columns}
        data={departments}
        loading={loading}
        emptyMessage="No departments found."
        searchPlaceholder="Search by department name, code, campus, or HOD..."
      />
    </div>
  );
};

export default DepartmentList;
