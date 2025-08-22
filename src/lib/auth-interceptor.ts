import { AxiosInstance, AxiosError } from 'axios';
import { toast } from '@/components/ui/sonner';

/**
 * Global 401 error handler that redirects to auth page and shows session expired toast
 */
export function setupAuthInterceptor(axiosInstance: AxiosInstance) {
  // Add response interceptor for 401 handling
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Check if the error is a 401 Unauthorized
      if (error.response?.status === 401) {
        // Clear all authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('fcm_token');
        localStorage.removeItem('profile');
        
        // Show session expired toast
        toast.error('Session Expired', {
          description: 'Your session has expired. Please log in again.',
          duration: 5000,
        });
        
        // Redirect to auth page
        // Use a small delay to ensure the toast is shown before navigation
        setTimeout(() => {
          window.location.href = '/auth';
        }, 100);
      }
      
      // Re-throw the error so it can still be handled by the calling code if needed
      return Promise.reject(error);
    }
  );
}

/**
 * Setup auth interceptor for multiple axios instances
 */
export function setupAuthInterceptors(axiosInstances: AxiosInstance[]) {
  axiosInstances.forEach(instance => {
    setupAuthInterceptor(instance);
  });
}