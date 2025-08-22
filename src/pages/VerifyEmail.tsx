import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { verifyEmail, requestEmailVerification } from '@/lib/api';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await verifyEmail(token);
        
        setStatus('success');
        setMessage('Your email has been successfully verified!');
        
        // Show success toast
        toast.success('Email verified successfully!', {
          description: 'Your email has been successfully verified!',
        });
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      } catch (error: any) {
        console.error('Email verification error:', error);
        
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          setStatus('expired');
          setMessage('This verification link has expired or is invalid.');
        } else {
          setStatus('error');
          setMessage('An error occurred during verification. Please try again.');
        }
        
        toast.error('Verification failed', {
          description: error.message || 'Please try again or contact support.',
        });
      }
    };

    handleVerification();
  }, [token, navigate]);

  const handleResendVerification = async () => {
    const email = localStorage.getItem('userEmail'); // You might need to store this during signup
    if (!email) {
      toast.error('Unable to resend verification. Please try signing up again.');
      return;
    }

    try {
      await requestEmailVerification(email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email');
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'expired':
        return 'Verification Link Expired';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Email Verification';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we verify your email address...';
      case 'success':
        return 'Your account is now fully activated. You will be redirected to the home page shortly.';
      case 'expired':
        return 'This verification link has expired. Please request a new one.';
      case 'error':
        return 'We encountered an issue verifying your email. Please try again.';
      default:
        return 'Verifying your email address...';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              {getStatusTitle()}
            </CardTitle>
            <CardDescription className="text-center">
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className={`p-4 rounded-lg text-center ${
                status === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              {status === 'success' && (
                <Button onClick={handleGoHome} className="w-full">
                  Go to Home Page
                </Button>
              )}
              
              {(status === 'error' || status === 'expired') && (
                <>
                  <Button onClick={handleResendVerification} className="w-full">
                    Request New Verification Link
                  </Button>
                  <Button variant="outline" onClick={handleGoHome} className="w-full">
                    Go to Home Page
                  </Button>
                </>
              )}
              
              {status === 'loading' && (
                <div className="text-center text-sm text-gray-500">
                  This may take a few moments...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}