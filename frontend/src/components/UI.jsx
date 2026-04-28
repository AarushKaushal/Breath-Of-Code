import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  isLoading, 
  disabled,
  ...props 
}) {
  const variants = {
    primary: 'indigo-gradient text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10',
    outline: 'bg-transparent border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/5',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative px-6 py-3 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className={cn("flex items-center justify-center gap-3 transition-opacity", isLoading ? 'opacity-0' : 'opacity-100')}>
        {children}
      </div>
    </button>
  );
}

export function InputField({ label, error, className, ...props }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium text-slate-400 ml-1">{label}</label>}
      <input
        className={cn(
          "w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3 text-slate-200 outline-none transition-all duration-200",
          "focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-600",
          error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400 ml-1 mt-1">{error}</p>}
    </div>
  );
}

export function Card({ children, title, description, className, ...props }) {
  return (
    <div className={cn("glass-card p-8", className)} {...props}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-bold text-slate-100">{title}</h3>}
          {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
