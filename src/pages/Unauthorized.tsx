import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-[var(--color-gray-100)] shadow-xs max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 text-[var(--color-maroon)] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-navy-dark)] mb-2">Access Restricted</h2>
        <p className="text-xs text-[var(--color-gray-500)] leading-relaxed mb-6">
          Your current account role (<span className="font-semibold text-[var(--color-gray-900)]">{user?.role}</span>) does
          not have permission to view this module. Please contact the ICT Directorate if you require elevated privileges.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--color-navy)] hover:bg-[var(--color-navy-dark)] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
