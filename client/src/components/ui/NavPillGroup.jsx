import React from 'react';
import { cn } from '../../utils/cn';

export const NavPillGroup = ({ items, activeItem, onChange, className }) => {
  return (
    <div className={cn("inline-flex bg-surface-soft rounded-pill p-[6px]", className)}>
      {items.map((item) => {
        const isActive = activeItem === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              "px-[14px] py-[8px] rounded-md text-[14px] font-medium transition-all",
              isActive 
                ? "bg-canvas text-ink shadow-sm" 
                : "bg-transparent text-muted hover:text-ink"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
