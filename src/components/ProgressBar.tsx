import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full bg-white/10 rounded-full h-2.5 ${className}`}>
      <div 
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}
