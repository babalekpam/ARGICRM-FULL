import { useState, useEffect } from 'react';

interface TrialData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  companySize: string;
  industry: string;
  useCase: string;
  source: string;
  signupDate: string;
  trialExpiresAt: string;
  status: 'active' | 'expired' | 'converted';
}

export function useTrial() {
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const checkTrialStatus = () => {
      const storedTrialData = localStorage.getItem('trial_data');
      const authToken = localStorage.getItem('auth_token');

      if (storedTrialData && authToken?.startsWith('trial_')) {
        try {
          const trial = JSON.parse(storedTrialData) as TrialData;
          const expiresAt = new Date(trial.trialExpiresAt);
          const now = new Date();
          const msRemaining = expiresAt.getTime() - now.getTime();
          const daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

          setTrialData(trial);
          setDaysRemaining(daysLeft);
          
          if (daysLeft > 0 && trial.status === 'active') {
            setIsTrialActive(true);
          } else {
            // Trial expired
            setIsTrialActive(false);
            if (trial.status === 'active') {
              // Update status to expired
              const updatedTrial = { ...trial, status: 'expired' as const };
              localStorage.setItem('trial_data', JSON.stringify(updatedTrial));
              setTrialData(updatedTrial);
            }
          }
        } catch (error) {
          console.error('Error parsing trial data:', error);
          setIsTrialActive(false);
        }
      } else {
        setIsTrialActive(false);
      }
    };

    checkTrialStatus();
    // Check trial status every hour
    const interval = setInterval(checkTrialStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const startTrial = (data: Omit<TrialData, 'signupDate' | 'trialExpiresAt' | 'status'>) => {
    const trialData: TrialData = {
      ...data,
      signupDate: new Date().toISOString(),
      trialExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };

    localStorage.setItem('trial_data', JSON.stringify(trialData));
    localStorage.setItem('auth_token', 'trial_' + Date.now());
    
    setTrialData(trialData);
    setIsTrialActive(true);
    setDaysRemaining(15);
  };

  const convertTrial = () => {
    if (trialData) {
      const updatedTrial = { ...trialData, status: 'converted' as const };
      localStorage.setItem('trial_data', JSON.stringify(updatedTrial));
      localStorage.setItem('auth_token', 'user_' + Date.now());
      setTrialData(updatedTrial);
    }
  };

  const endTrial = () => {
    localStorage.removeItem('trial_data');
    localStorage.removeItem('auth_token');
    setTrialData(null);
    setIsTrialActive(false);
    setDaysRemaining(0);
  };

  return {
    isTrialActive,
    trialData,
    daysRemaining,
    startTrial,
    convertTrial,
    endTrial
  };
}