import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeFCMForUser } from '@/lib/messaging';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  emailVerified: boolean;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Function to check if token is expired
  const checkTokenExpiry = (): boolean => {
    const expiryTimeStr = localStorage.getItem('tokenExpiresAt');
    
    // If no expiry time is stored, we consider the token as expired
    if (!expiryTimeStr) {
      return true;
    }
    
    const expiryTime = parseInt(expiryTimeStr);
    const currentTime = Date.now();
    
    // Check if the token is actually expired - no buffer
    const isExpired = currentTime >= expiryTime;
    
    // Only return true if the current time is actually past the expiry time
    return isExpired;
  };

  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      const userStr = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      // If any auth data is missing, just set loading to false
      if (!userStr || !accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }
      
      // Check if token is expired - only on initial load
      const initialTokenCheck = checkTokenExpiry();
      if (initialTokenCheck) {
        console.warn('Access token has expired');
        setIsTokenExpired(true);
        // Clear all auth data on expiry
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiresAt');
        setIsLoading(false);
        return;
      }
      
      // Set up periodic token expiry check (every 5 minutes)
      tokenCheckInterval = setInterval(() => {
        if (checkTokenExpiry()) {
          console.warn('Access token has expired during session');
          setIsTokenExpired(true);
          // Clear all auth data on expiry
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiresAt');
          setUser(null);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      try {
        const userData = JSON.parse(userStr);
        // Basic validation of user data
        if (!userData?.id || !userData?.email) {
          throw new Error('Invalid user data');
        }
        setUser(userData);
        setIsTokenExpired(false);
        
        // Initialize FCM for the restored user session (without fetching from server)
        try {
          await initializeFCMForUser(false);
        } catch (fcmError) {
          console.warn('FCM initialization failed during session restoration:', fcmError);
        }
        
        console.log('User authentication restored successfully:', userData.id);
      } catch (error) {
        console.error('Authentication error:', error);
        // Clear all auth data on error
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiresAt');
        setUser(null);
        setIsTokenExpired(true);
      } finally {
        setIsLoading(false);
        setIsAuthReady(true);
      }
    };
    
    initializeAuth();
    
    // Clean up interval on unmount
    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, []);

  // Get query client for cache clearing
  const queryClient = useQueryClient();

  // Logout function to clear all storage and reset state
  const logout = () => {
    // Clear all localStorage items
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('fcm_token');
    localStorage.removeItem('profile');
    localStorage.removeItem('wisecv_profile'); // Clear profile cache
    
    // Clear all sessionStorage items
    sessionStorage.removeItem('resumeAnalysis');
    
    // Clear any other potential storage items
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear React Query cache to prevent stale data
    queryClient.clear();
    
    // Reset state
    setUser(null);
    setIsTokenExpired(true);
    
    // Force page reload to ensure complete state reset
    window.location.href = '/auth';
  };

  return { user, isLoading, isTokenExpired, isAuthReady, logout };
}
