import React from 'react';
import logoImage from '@/assets/logo.jpeg';

interface BrandingProps {
  variant?: 'default' | 'compact' | 'large';
  showText?: boolean;
  className?: string;
}

export const Branding: React.FC<BrandingProps> = ({
  variant = 'default',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    compact: 'h-8',
    default: 'h-10',
    large: 'h-16',
  };

  const textSizeClasses = {
    compact: 'text-sm',
    default: 'text-base',
    large: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImage}
        alt="ICTIMS Logo"
        className={`${sizeClasses[variant]} w-auto object-contain`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {showText && (
        <span className={`font-black text-[#1B3A5C] tracking-tight ${textSizeClasses[variant]}`}>
          IAA
        </span>
      )}
    </div>
  );
};

export default Branding;