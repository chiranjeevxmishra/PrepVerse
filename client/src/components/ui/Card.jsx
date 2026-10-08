import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`pv-card rounded-xl p-5 text-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`flex flex-col space-y-1.5 pb-4 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-base font-semibold leading-none tracking-tight text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '' }) => {
  return <p className={`text-xs text-slate-400 ${className}`}>{children}</p>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`pt-0 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center pt-4 border-t border-slate-800/60 mt-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
