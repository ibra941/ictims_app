import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  message?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-[#1B3A5C] mb-3" />
      {message && <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">{message}</p>}
    </div>
  );
};

export default Loading;
