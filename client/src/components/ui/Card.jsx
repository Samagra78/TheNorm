import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ 
  className, 
  variant = 'feature', // feature, product-mockup, testimonial, pricing
  children, 
  ...props 
}, ref) => {
  const variants = {
    feature: "bg-surface-card rounded-lg p-xl",
    "product-mockup": "bg-canvas rounded-lg p-lg shadow-sm border border-hairline",
    testimonial: "bg-surface-card rounded-lg p-lg",
    pricing: "bg-canvas rounded-lg p-xl shadow-sm border border-hairline",
    "pricing-featured": "bg-surface-dark text-on-dark rounded-lg p-xl",
  };

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
