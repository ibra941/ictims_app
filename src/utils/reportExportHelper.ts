import { Asset } from '../types';
import { formatCurrency } from './formatters';
import logoImage from '@/assets/logo.jpeg';

export interface ReportExportOptions {
  reportTitle: string;
  reportSubtitle?: string;
  campusFilter?: string;
  departmentFilter?: string;
  categoryFilter?: string;
  statusFilter?: string;
  generatedBy?: string;
  reportType: 'full_inventory' | 'campus_summary' | 'maintenance_log' | 'custody_list' | 'disposal_log';
}

export interface GenericReportExportOptions {
  reportTitle: string;
  filename?: string;
  generatedBy?: string;
  campus?: string;
  department?: string;
}

const formatColumnName = (name: string) => name
  .replace(/([A-Z])/g, ' $1')
  .replace(/[_-]/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase())
  .trim();

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const loadImageData = async (source: string): Promise<string | null> => {
  try {
    const response = await fetch(source);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const downloadBrandedPDFReport = async (
  records: Record<string, unknown>[],
  options: GenericReportExportOptions,
) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = 297;
  const pageHeight = 210;
  const generatedAt = new Date();
  const dateLabel = generatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const logoData = await loadImageData(logoImage);
  const excludedColumns = new Set(['id', 'userid', 'roleid', 'campusid', 'departmentid', 'imageurl', 'qrcode']);
  const columns = Object.keys(records[0] || {}).filter((key) => !excludedColumns.has(key.toLowerCase()));
  const headers = columns.map(formatColumnName);
  const rows = records.map((record) => columns.map((column) => formatCellValue(record[column])));

  const drawHeader = (isSignaturePage = false) => {
    doc.setFillColor(27, 58, 92);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFillColor(201, 162, 39);
    doc.rect(0, 25, pageWidth, 2, 'F');
    if (logoData) doc.addImage(logoData, 'JPEG', 12, 4, 18, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('INSTITUTE OF ACCOUNTANCY ARUSHA', 35, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ICT INVENTORY MANAGEMENT SYSTEM (ICTIMS)', 35, 18);
    doc.text(`Date: ${dateLabel}`, pageWidth - 14, 15, { align: 'right' });
    if (logoData) {
      doc.setGState(new (doc as any).GState({ opacity: 0.055 }));
      doc.addImage(logoData, 'JPEG', pageWidth / 2 - 43, isSignaturePage ? 55 : 63, 86, 86);
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(201, 162, 39);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ALL COMMUNICATION TO BE ADDRESSED TO THE RECTOR', pageWidth / 2, pageHeight - 11, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Njiro Hill, P.O. Box 2798, Arusha | Tel: +255 27 2970232 | Email: iaa@iaa.ac.tz | www.iaa.ac.tz', pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text(`Confidential Internal Document | Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 3, { align: 'right' });
  };

  drawHeader();
  doc.setTextColor(27, 58, 92);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(options.reportTitle.toUpperCase(), 14, 37);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(8.5);
  doc.text(`Campus: ${options.campus || 'All Campuses'}  |  Department / Office: ${options.department || 'All'}  |  Records: ${records.length}`, 14, 43);
  doc.text(`Prepared by: ${options.generatedBy || 'IAA ICTIMS'}  |  Generated: ${generatedAt.toLocaleString('en-GB')}`, 14, 48);

  autoTable(doc, {
    startY: 54,
    head: [headers],
    body: rows,
    theme: 'grid',
    margin: { left: 14, right: 14, top: 32, bottom: 24 },
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59], overflow: 'linebreak' },
    headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    willDrawPage: () => drawHeader(),
  });

  doc.addPage('a4', 'landscape');
  drawHeader(true);
  doc.setTextColor(27, 58, 92);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REPORT CERTIFICATION', pageWidth / 2, 48, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const certification = `This report was automatically generated from filtered ICTIMS records on ${dateLabel}. The information is submitted for review, investigation, and official record purposes.`;
  doc.text(doc.splitTextToSize(certification, 190), pageWidth / 2, 62, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Reportor Name:', 30, 88);
  doc.text(options.generatedBy || 'IAA ICTIMS User', 82, 88);
  doc.text('Role:', 30, 101);
  doc.text('Campus:', 30, 114);
  doc.text(options.campus || 'All Campuses', 82, 114);
  doc.text('Department / Office:', 30, 127);
  doc.text(options.department || 'Not specified', 82, 127);
  doc.text('Reported To:', 30, 140);
  doc.text('Campus / Department Administration', 82, 140);
  doc.setDrawColor(30, 41, 59);
  doc.line(30, 166, 126, 166);
  doc.line(171, 166, 267, 166);
  doc.setFont('helvetica', 'normal');
  doc.text('Reportor signature', 30, 173);
  doc.text('Date', 112, 173);
  doc.text('Campus / Department signature', 171, 173);
  doc.text('Date', 253, 173);
  doc.setFont('helvetica', 'italic');
  doc.text('(OFFICIAL STAMP)', pageWidth / 2, 190, { align: 'center' });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(page, totalPages);
  }

  doc.save(`${options.filename || options.reportTitle.replace(/\s+/g, '_')}_${generatedAt.toISOString().slice(0, 10)}.pdf`);
  return true;
};

/**
 * Downloads data as a CSV file with Excel-friendly UTF-8 BOM encoding.
 */
export const downloadCSVReport = (
  assets: Asset[],
  options: ReportExportOptions
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${options.reportTitle.replace(/\s+/g, '_')}_${dateStr}.csv`;

  // Define Headers
  const headers = [
    'Asset Tag',
    'Asset Name',
    'Category',
    'Brand and Model',
    'Serial Number',
    'Campus',
    'Department / Location',
    'Status',
    'Condition',
    'Assigned To',
    'Purchase Cost (TZS)',
    'Purchase Date',
    'Supplier',
  ];

  // Convert rows
  const rows = assets.map((asset) => [
    `"${asset.assetTag || ''}"`,
    `"${(asset.name || '').replace(/"/g, '""')}"`,
    `"${asset.category || ''}"`,
    `"${(asset.brand || '') + ' ' + (asset.model || '')}"`,
    `"${asset.serialNumber || ''}"`,
    `"${asset.campus || ''}"`,
    `"${(asset.department || '') + ' - ' + (asset.location || '')}"`,
    `"${asset.status || ''}"`,
    `"${asset.condition || ''}"`,
    `"${(asset.assignedEmployeeName || asset.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
    asset.purchaseCost || 0,
    `"${asset.purchaseDate || ''}"`,
    `"${(asset.supplierName || '').replace(/"/g, '""')}"`,
  ]);

  // Add CSV metadata summary header
  const metaRows = [
    `"INSTITUTE OF ACCOUNTANCY ARUSHA (IAA) - ICTIMS REPORT"`,
    `"Report: ${options.reportTitle}"`,
    `"Generated On: ${new Date().toLocaleString()}"`,
    `"Generated By: ${options.generatedBy || 'System Administrator'}"`,
    `"Campus Scope: ${options.campusFilter || 'All Campuses'}"`,
    `"Total Asset Count: ${assets.length}"`,
    `"Total Valuation: TZS ${assets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0).toLocaleString()}"`,
    '',
  ];

  const csvContent =
    '\uFEFF' +
    metaRows.join('\n') +
    headers.join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates and downloads a branded PDF report for IAA ICTIMS.
 * Uses dynamic import for jspdf to avoid build issues.
 */
export const downloadPDFReport = async (
  assets: Asset[],
  options: ReportExportOptions
) => {
  try {
    return await downloadBrandedPDFReport(assets as unknown as Record<string, unknown>[], {
      reportTitle: options.reportTitle,
      generatedBy: options.generatedBy,
      campus: options.campusFilter,
      department: options.departmentFilter,
    });
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
};

export default {
  downloadCSVReport,
  downloadPDFReport
};
