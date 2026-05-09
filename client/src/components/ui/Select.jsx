import React from 'react';
import { cn } from '../../utils/cn';

export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        "flex h-[40px] w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow appearance-none",
        className
      )}
      {...props}
    >
      {props.children}
    </select>
  );
}
