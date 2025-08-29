import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  const baseClasses = 'px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed';
  const errorClasses = error ? 'border-danger-500 focus:ring-danger-500' : '';
  const iconClasses = Icon ? 'pl-12' : '';
  
  const inputClasses = [
    baseClasses,
    errorClasses,
    iconClasses,
    fullWidth ? 'w-full' : '',
    className
  ].join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-luxury-ice mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-luxury-ice/70">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
