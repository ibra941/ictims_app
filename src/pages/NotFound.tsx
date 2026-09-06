import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-[var(--color-gray-100)] shadow-xs max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] text-[var(--color-gray-500)] flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-navy-dark)] mb-2">Page Not Found</h2>
        <p className="text-xs text-[var(--color-gray-500)] leading-relaxed mb-6">
          The module or page you are searching for does not exist in the ICTIMS system.
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

export default NotFound;
