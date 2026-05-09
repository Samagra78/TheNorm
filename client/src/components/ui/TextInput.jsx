import React from 'react';
import { cn } from '../../utils/cn';

export const TextInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "bg-canvas text-ink text-body-md rounded-md px-[14px] py-[10px] h-[40px]",
        "border border-hairline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink",
        "placeholder:text-muted",
        className
      )}
      {...props}
    />
  );
});

TextInput.displayName = "TextInput";
