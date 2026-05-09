import React from 'react';
import { cn } from '../../utils/cn';

export const Avatar = ({ src, alt, initials, className, ...props }) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full overflow-hidden bg-surface-card text-ink h-[36px] w-[36px]",
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || "Avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className="text-caption">{initials}</span>
      )}
    </div>
  );
};
