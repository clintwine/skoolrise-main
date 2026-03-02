import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Accessible icon-only button with proper aria-label
export function IconButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = "ghost",
  size = "icon",
  className,
  disabled,
  loading,
  ...props 
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      className={cn("relative", className)}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </Button>
  );
}

// Accessible action button with loading state
export function ActionButton({
  children,
  onClick,
  loading,
  disabled,
  loadingText = "Loading...",
  className,
  ...props
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn("relative", className)}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Confirmation button that requires double-click or hold
export function ConfirmButton({
  children,
  onConfirm,
  confirmText = "Click again to confirm",
  variant = "destructive",
  className,
  ...props
}) {
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  const handleClick = () => {
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <Button
      variant={confirming ? variant : "outline"}
      onClick={handleClick}
      className={cn(
        "transition-all",
        confirming && "animate-pulse",
        className
      )}
      aria-label={confirming ? confirmText : undefined}
      {...props}
    >
      {confirming ? confirmText : children}
    </Button>
  );
}