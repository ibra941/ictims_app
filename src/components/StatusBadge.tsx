import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Wrench } from 'lucide-react';

type StatusType = 'Active' | 'Inactive' | 'Available' | 'Assigned' | 'Under Maintenance' | 'Disposed' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Returned' | 'Overdue' | 'Scheduled' | 'In Progress' | 'Cancelled' | 'Draft' | 'Ordered' | 'Received' | 'Lost';

interface StatusBadgeProps {
  status: StatusType | string | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const getBadgeStyle = (status: string): { bg: string; text: string; icon: React.ReactNode } => {
  const s = status?.toLowerCase() || '';
  
  if (s.includes('active') || s.includes('available') || s.includes('completed') || s.includes('approved') || s.includes('received')) {
    return { bg: 'bg-green-50', text: 'text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> };
  }
  if (s.includes('pending') || s.includes('scheduled') || s.includes('ordered') || s.includes('draft')) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> };
  }
  if (s.includes('rejected') || s.includes('cancelled') || s.includes('disposed') || s.includes('lost') || s.includes('inactive')) {
    return { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> };
  }
  if (s.includes('maintenance') || s.includes('progress') || s.includes('repair')) {
    return { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Wrench className="w-3 h-3" /> };
  }
  if (s.includes('returned') || s.includes('overdue')) {
    return { bg: 'bg-orange-50', text: 'text-orange-700', icon: <AlertTriangle className="w-3 h-3" /> };
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', icon: <Clock className="w-3 h-3" /> };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  if (!status) return null; // Inaepuka tatizo la undefined
  
  const style = getBadgeStyle(status);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${style.bg} ${style.text} ${sizeClasses[size]}`}>
      {style.icon}
      {status}
    </span>
  );
};

export default StatusBadge;
