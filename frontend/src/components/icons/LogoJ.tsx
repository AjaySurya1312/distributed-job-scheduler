import React from 'react';

export function LogoJ({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      fill="none" 
      className={className}
    >
      <defs>
        <linearGradient id="jGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path 
        d="M 75 35 L 75 65 A 25 25 0 0 1 25 65 L 25 55" 
        stroke="url(#jGrad)" 
        strokeWidth="18" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx="75" cy="12" r="10" fill="#EC4899" />
    </svg>
  );
}
