import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import useIsMobile from '../hooks/useIsMobile';

export default function MobileDialog({ 
  open, 
  onOpenChange, 
  title, 
  description,
  children,
  className = ""
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            {title && <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>}
            {description && <DrawerDescription className="text-sm text-gray-500">{description}</DrawerDescription>}
          </DrawerHeader>
          <div className={`px-4 pb-6 overflow-y-auto ${className}`}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-white max-w-lg ${className}`}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}