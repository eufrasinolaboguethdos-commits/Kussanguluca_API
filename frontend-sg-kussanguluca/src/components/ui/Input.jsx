import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const Input = React.forwardRef(({ label, type = 'text', error, icon, className = '', ...props }, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition duration-200
            ${error
              ? 'border-red-500 focus:ring-red-200 text-red-900 placeholder-red-300'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-200'
            }
            ${icon ? 'pl-10' : ''}
            ${error ? 'pr-10' : ''}
          `}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <FiAlertCircle size={20} />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          {error.message}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;