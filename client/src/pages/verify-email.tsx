import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (!token || !emailParam) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link or request a new verification email.');
      return;
    }

    // Verify the email
    verifyEmail(token, emailParam);
  }, []);

  const verifyEmail = async (token: string, email: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus('success');
        setMessage(data.message || 'Your email has been verified successfully!');
        toast({
          title: "Email Verified",
          description: "Your account is now active. You can sign in to start using NODE CRM.",
        });
      } else {
        setVerificationStatus('error');
        setMessage(data.error || 'Email verification failed. Please try again.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Network error occurred. Please check your connection and try again.');
      console.error('Verification error:', error);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email address not found. Please try signing up again.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Email Sent",
          description: "A new verification email has been sent to your inbox.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to resend verification email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const goToLogin = () => {
    window.location.href = '/';
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <RefreshCw className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Verifying...</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Verified</Badge>;
      case 'error':
        return <Badge variant="destructive">Verification Failed</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Email Verification
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                {email && `Verifying ${email}`}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="space-y-3">
              {verificationStatus === 'success' && (
                <Button 
                  onClick={goToLogin} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  data-testid="button-sign-in"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Sign In to Your Account
                </Button>
              )}

              {verificationStatus === 'error' && (
                <>
                  <Button 
                    onClick={resendVerification}
                    disabled={isResending || !email}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    data-testid="button-resend"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={goToLogin}
                    className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    data-testid="button-back-to-login"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </>
              )}

              {verificationStatus === 'verifying' && (
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Please wait while we verify your email address...
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Having trouble? Check your spam folder or contact support.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Need help? Contact{' '}
            <a 
              href="mailto:support@argilette.org" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              support@argilette.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}