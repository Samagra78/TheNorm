import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'default', 
  children, 
  disabled,
  ...props 
}, ref) => {
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted",
    secondary: "bg-canvas text-ink border border-hairline hover:bg-surface-soft",
    textLink: "bg-transparent text-ink hover:underline p-0 h-auto",
    iconCircular: "bg-canvas text-ink rounded-full border border-hairline hover:bg-surface-soft flex items-center justify-center p-0",
  };

  const sizes = {
    default: "h-[40px] px-5 py-3",
    icon: "h-[36px] w-[36px]",
    none: "",
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus:outline-none",
        variants[variant],
        sizes[variant === 'iconCircular' ? 'icon' : size === 'none' ? 'none' : 'default'],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
