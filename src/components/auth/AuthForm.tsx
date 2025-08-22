import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, signup, forgotPassword } from '@/lib/api';
import { useLoading } from '@/hooks/use-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { Mail, Lock, User } from 'lucide-react';
import { GoogleAuth } from './GoogleAuth';
import { Captcha, CaptchaRef } from '@/components/ui/captcha';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AuthForm() {
  const { isLoading: isLoginLoading, execute: executeLogin } = useLoading();
  const { isLoading: isSignupLoading, execute: executeSignup } = useLoading();
  const { isLoading: isForgotPasswordLoading, execute: executeForgotPassword } = useLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  
  const isLoading = isLoginLoading || isSignupLoading || isForgotPasswordLoading;
  
  const captchaRef = useRef<CaptchaRef>(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  // Handle tab switching based on URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'login') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Validation Error', {
        description: 'Please enter both email and password',
      });
      return;
    }

    await executeLogin(
      async () => {
        const response = await login(email, password);
        console.log("Login successful, response:", response);
        // Check if we have the required tokens and user data
        if (response.accessToken && response.user) {
          return response;
        } else {
          throw new Error('Incomplete login response');
        }
      },
      {
        onSuccess: async () => {
          // Small delay to allow state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          // Navigate to dashboard
          navigate('/dashboard', { replace: true });
        },
        onError: (error: unknown) => {
          console.error('Login error:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          
          // Clear form on error
          setEmail('');
          setPassword('');
          
          toast.error(errorMessage, {
            description: 'Login Failed',
          });
        }
      }
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields',
      });
      return;
    }

    // Additional password strength validation
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long', {
        description: 'Weak Password',
      });
      return;
    }

    // Captcha validation
    if (recaptchaSiteKey && !captchaToken) {
      toast.error('Please complete the captcha verification', {
        description: 'Captcha Required',
      });
      return;
    }

    await executeSignup(
      async () => {
        const response = await signup(email, password, firstName, lastName, captchaToken);
        console.log("Signup successful, response:", response);

        if (response.accessToken && response.user) {
          return response;
        } else {
          throw new Error('Incomplete signup response');
        }
      },
      {
        onSuccess: async () => {
          // Small delay to allow state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Navigate to dashboard
          navigate('/dashboard', { replace: true });
          
          toast.success('Your account has been created successfully', {
            description: 'Welcome to WiseCV!',
          });
        },
        onError: (error: unknown) => {
          console.error('Signup error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Could not create account';
          
          // Reset captcha on error
          if (captchaRef.current) {
            captchaRef.current.reset();
            setCaptchaToken(null);
          }
          
          // Clear form on error
          setPassword('');
          setFirstName('');
          setLastName('');
          
          toast.error(errorMessage, {
            description: 'Signup Failed',
          });
        }
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotPasswordEmail(email); // Pre-fill with current email if any
                    setForgotPasswordOpen(true);
                  }}
                  className="text-sm text-cvwise-blue hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <GoogleAuth
                mode="login"
                isLoading={isLoading}
                onSuccess={(response) => {
                  // Navigate to dashboard on success
                  navigate('/dashboard', { replace: true });
                }}
                onError={(error) => {
                  toast.error(error, {
                    description: 'Login Failed',
                  });
                }}
              />
            </div>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="First Name"
                  className="pl-10"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Last Name"
                  className="pl-10"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Captcha */}
            {recaptchaSiteKey && (
              <div className="mb-4">
                <Captcha
                  ref={captchaRef}
                  siteKey={recaptchaSiteKey}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                  theme="light"
                  size="normal"
                  className="flex justify-center"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <GoogleAuth
                mode="signup"
                isLoading={isLoading}
                onSuccess={(response) => {
                  // Navigate to dashboard on success
                  navigate('/dashboard', { replace: true });
                }}
                onError={(error) => {
                  toast.error(error, {
                    description: 'Signup Failed',
                  });
                }}
              />
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-cvwise-blue hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-cvwise-blue hover:underline">
                Privacy Policy
              </a>
            </p>
          </form>
        </TabsContent>
      </Tabs>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!forgotPasswordEmail) {
                toast.error('Please enter your email address');
                return;
              }

              await executeForgotPassword(
                async () => {
                  await forgotPassword(forgotPasswordEmail);
                },
                {
                  onSuccess: () => {
                    toast.success('Password reset email sent', {
                      description: 'Please check your inbox for further instructions',
                    });
                    setForgotPasswordOpen(false);
                  },
                  onError: (error) => {
                    console.error('Forgot password error:', error);
                    toast.error('Failed to send reset email', {
                      description: 'Please try again later',
                    });
                  }
                }
              );
            }}
            className="space-y-4 py-4"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotPasswordOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
