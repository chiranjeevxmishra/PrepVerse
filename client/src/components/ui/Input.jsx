import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      className = '',
      type = 'text',
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`block w-full rounded-lg border bg-slate-900 text-slate-100 placeholder-slate-500 text-sm transition-colors
              ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2.5
              ${
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-800 hover:border-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }
              focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
