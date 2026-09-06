import React, { useState } from 'react';
import { Download, Check, FileText } from 'lucide-react';
import { exportToCSV } from '../utils/formatters';
import { downloadBrandedPDFReport } from '../utils/reportExportHelper';
import { useAuth } from '../context/AuthContext';

export interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  label?: string;
  exportFormat?: 'csv' | 'pdf';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  label = 'Export',
  exportFormat = 'csv',
  className = '',
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const { user } = useAuth();

  const handleExport = async () => {
    try {
      if (exportFormat === 'csv') {
        exportToCSV(data, filename);
      } else if (exportFormat === 'pdf') {
        await downloadBrandedPDFReport(data, {
          reportTitle: filename.replace(/[_-]/g, ' '),
          filename,
          generatedBy: user?.name || user?.username,
          campus: user?.campus || undefined,
          department: user?.department || user?.office || undefined,
        });
      }
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const displayFormat = exportFormat === 'pdf' ? 'PDF' : 'CSV';

  return (
    <button
      id={`export-${filename}`}
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${className}`}
      title={`Export records to ${displayFormat}`}
    >
      {downloaded ? (
        <>
          <Check className="w-4 h-4" />
          <span>Exported</span>
        </>
      ) : (
        <>
          {exportFormat === 'pdf' ? (
            <FileText className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Get {displayFormat}</span>
        </>
      )}
    </button>
  );
};

export default ExportButton;
