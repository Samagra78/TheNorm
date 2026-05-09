import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: "bg-surface-card text-ink",
    orange: "bg-badge-orange text-ink",
    pink: "bg-badge-pink text-ink",
    violet: "bg-badge-violet text-ink",
    emerald: "bg-badge-emerald text-ink",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-[13px] font-medium tracking-normal",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
