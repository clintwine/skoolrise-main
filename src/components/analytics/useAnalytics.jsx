import { useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Generate a unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export function useAnalytics() {
  const startTimeRef = useRef(Date.now());
  const sessionId = getSessionId();

  const trackEvent = useCallback(async (eventType, eventName, properties = {}) => {
    try {
      const user = await base44.auth.me().catch(() => null);
      
      await base44.entities.AnalyticsEvent.create({
        event_type: eventType,
        event_name: eventName,
        user_id: user?.id || 'anonymous',
        user_type: user?.user_type || 'unknown',
        page_name: window.location.pathname,
        properties: JSON.stringify(properties),
        session_id: sessionId,
        duration_ms: Date.now() - startTimeRef.current,
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [sessionId]);

  const trackPageView = useCallback((pageName) => {
    trackEvent('page_view', `viewed_${pageName}`, { page: pageName });
    startTimeRef.current = Date.now();
  }, [trackEvent]);

  const trackFeatureUse = useCallback((featureName, details = {}) => {
    trackEvent('feature_use', featureName, details);
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm, resultCount) => {
    trackEvent('search', 'search_performed', { term: searchTerm, results: resultCount });
  }, [trackEvent]);

  const trackError = useCallback((errorName, errorDetails) => {
    trackEvent('error', errorName, { error: errorDetails });
  }, [trackEvent]);

  const trackExport = useCallback((exportType, recordCount) => {
    trackEvent('export', `exported_${exportType}`, { type: exportType, count: recordCount });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackFeatureUse,
    trackSearch,
    trackError,
    trackExport,
  };
}

export default useAnalytics;