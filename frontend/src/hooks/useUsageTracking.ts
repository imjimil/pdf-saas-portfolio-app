import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Counts how many conversions a signed-out visitor has run, so the app can
 * suggest an account after a few. It is a nudge, not a paywall — the tools keep
 * working either way.
 */

const STORAGE_KEY = 'guest_conversions';
const SUGGEST_AFTER = 3;

export function useUsageTracking() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(Number(localStorage.getItem(STORAGE_KEY) ?? 0));
  }, []);

  const incrementUsage = useCallback(() => {
    if (isAuthenticated) return;
    setCount((current) => {
      const next = current + 1;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, [isAuthenticated]);

  const resetUsage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCount(0);
  }, []);

  return {
    count,
    incrementUsage,
    resetUsage,
    shouldSuggestAccount: !isAuthenticated && count >= SUGGEST_AFTER,
  };
}
