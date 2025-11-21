import { useState, useEffect } from 'react';

const USAGE_KEY = 'pdf_saas_usage_count';
const MAX_GUEST_USES = 3;

export const useUsageTracking = () => {
  const [usageCount, setUsageCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(USAGE_KEY) || '0', 10);
    setUsageCount(count);
    if (count >= MAX_GUEST_USES) {
      setShowPrompt(true);
    }
  }, []);

  const incrementUsage = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem(USAGE_KEY, newCount.toString());
    
    if (newCount >= MAX_GUEST_USES) {
      setShowPrompt(true);
    }
  };

  const resetUsage = () => {
    setUsageCount(0);
    setShowPrompt(false);
    localStorage.removeItem(USAGE_KEY);
  };

  return {
    usageCount,
    showPrompt,
    incrementUsage,
    resetUsage,
    maxGuestUses: MAX_GUEST_USES,
  };
};

