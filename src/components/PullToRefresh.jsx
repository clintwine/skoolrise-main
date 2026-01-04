import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function PullToRefresh({ children, onRefresh }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const queryClient = useQueryClient();

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, maxPull);
      setPullDistance(distance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          await queryClient.invalidateQueries();
        }
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, queryClient]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-50 transition-opacity duration-200"
        style={{ 
          top: Math.max(pullDistance - 50, -50),
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center ${
          isRefreshing ? 'animate-spin' : ''
        }`}>
          <RefreshCw 
            className={`w-5 h-5 text-blue-600 transition-transform duration-200`}
            style={{ transform: isRefreshing ? 'none' : `rotate(${rotation}deg)` }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${isRefreshing ? threshold * 0.3 : pullDistance * 0.3}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}