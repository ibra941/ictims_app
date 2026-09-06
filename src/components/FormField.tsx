import React from 'react';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'textarea';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  options?: { value: string | number; label: string }[];
  rows?: number;
  helperText?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  options = [],
  rows = 3,
  helperText,
  className = '',
}) => {
  const inputId = `field-${name}`;
  const baseInputStyles = `w-full rounded-xl border px-4 py-2.5 text-xs font-medium text-[#1A1A1A] placeholder-[#6B7280] bg-[#F5F6F8] transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1B3A5C] disabled:bg-[#E9EBEF] disabled:cursor-not-allowed ${
    error
      ? 'border-[#8B232A] focus:border-[#8B232A] focus:ring-[#8B232A]/20'
      : 'border-[#E9EBEF] focus:border-[#1B3A5C]'
  }`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
        {label}
        {required && <span className="text-[#8B232A] ml-1">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseInputStyles} cursor-pointer`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt, index) => (
            <option key={`${name}-${opt.value}-${index}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={baseInputStyles}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={baseInputStyles}
        />
      )}

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-bold text-[#8B232A] mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7280] font-medium mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;
