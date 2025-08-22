import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/ui/sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isTokenExpired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If authentication check is complete and user is not logged in or token is expired
    if (!isLoading && (!user || isTokenExpired)) {
      // If token is expired, show an error toast to the user
      if (isTokenExpired) {
        console.warn('Your session has expired. Please log in again.');
        toast.error('Session Expired', {
          description: 'Your session has expired. Please log in again.',
        });
      }
      navigate('/auth');
    }
  }, [user, isLoading, isTokenExpired, navigate]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // If user is authenticated and token is not expired, render the children
  return user && !isTokenExpired ? <>{children}</> : null;
}
