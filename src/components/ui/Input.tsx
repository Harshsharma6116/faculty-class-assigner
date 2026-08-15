import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    
    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            disabled:opacity-50 disabled:bg-gray-50 transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} 
            ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
