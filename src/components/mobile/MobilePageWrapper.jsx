import React from 'react';
import useIsMobile from '../hooks/useIsMobile';

export default function MobilePageWrapper({ 
  mobileComponent: MobileComponent, 
  desktopComponent: DesktopComponent,
  ...props 
}) {
  const isMobile = useIsMobile();

  if (isMobile && MobileComponent) {
    return <MobileComponent {...props} />;
  }

  return <DesktopComponent {...props} />;
}