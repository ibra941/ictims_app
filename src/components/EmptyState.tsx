import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#F5F6F8] border border-[#E9EBEF] flex items-center justify-center text-[#1B3A5C] mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-black tracking-tight text-[#1B3A5C] uppercase mb-1">{title}</h4>
      <p className="text-xs text-[#6B7280] font-medium leading-relaxed mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#1B3A5C] hover:bg-[#12294A] rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
