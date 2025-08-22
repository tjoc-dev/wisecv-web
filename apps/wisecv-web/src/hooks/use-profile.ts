import { useEffect, useState, useCallback } from 'react';
import { ProfileData, getProfile, updateProfile as updateProfileApi } from '@/lib/api';

const PROFILE_STORAGE_KEY = 'wisecv_profile';
const PROFILE_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export function useProfile() {
  const [profile, setProfileState] = useState<ProfileData | null>(() => {
    // Initialize from localStorage if available
    const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!cached) return null;
    
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Check if cache is still valid
      if (Date.now() - timestamp < PROFILE_CACHE_TTL) {
        return data;
      }
    } catch (e) {
      console.error('Failed to parse cached profile', e);
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Save profile to both state and localStorage
  const setProfile = useCallback((data: ProfileData | null) => {
    setProfileState(data);
    if (data) {
      localStorage.setItem(
        PROFILE_STORAGE_KEY, 
        JSON.stringify({ 
          data, 
          timestamp: Date.now() 
        })
      );
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  const refreshProfile = useCallback(async (force = false) => {
    try {
      // Skip if we have a valid cached profile and not forcing refresh
      const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (cached && !force) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < PROFILE_CACHE_TTL) {
            setProfileState(data);
            return data;
          }
        } catch (e) {
          console.error('Failed to parse cached profile', e);
        }
      }

      setIsLoading(true);
      const data = await getProfile();
      setProfile(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setProfile]);

  // Update profile both locally and on the server
  const updateProfile = useCallback(async (data: Partial<ProfileData>) => {
    try {
      setIsLoading(true);
      const updatedProfile = await updateProfileApi(data);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setProfile]);

  // Clear profile cache (e.g., on logout)
  const clearProfile = useCallback(() => {
    setProfileState(null);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  }, []);

  // Initial load
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    clearProfile,
  };
}
