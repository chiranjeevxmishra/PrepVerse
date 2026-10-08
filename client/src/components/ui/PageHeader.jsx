import React from 'react';

export default function PageHeader({ eyebrow, title, description, icon: Icon, actions, className = '' }) {
  return (
    <header className={`flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="pv-label mb-2 flex items-center gap-2">{Icon && <Icon className="h-3.5 w-3.5 text-violet-300" />}{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
