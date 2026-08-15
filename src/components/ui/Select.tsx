import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, id, options, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    
    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            disabled:opacity-50 disabled:bg-gray-50 transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} 
            ${className}`}
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
