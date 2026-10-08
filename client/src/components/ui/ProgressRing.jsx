import React from 'react';

export default function ProgressRing({ value = 0, size = 144, stroke = 10, label, children, className = '' }) {
  const score = Math.max(0, Math.min(Number(value) || 0, 100));
  const inset = stroke / size * 100;
  return (
    <div
      role="img"
      aria-label={label || `${score}% complete`}
      className={`relative grid shrink-0 place-items-center rounded-full ${className}`}
      style={{ width: size, height: size, background: `conic-gradient(#a89bff ${score * 3.6}deg, #282b37 0deg)` }}
    >
      <div className="grid h-full w-full place-items-center rounded-full" style={{ padding: `${inset}%` }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#11131a] text-center">{children}</div>
      </div>
    </div>
  );
}
