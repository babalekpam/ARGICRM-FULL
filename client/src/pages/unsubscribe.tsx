import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function UnsubscribePage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'confirming'>('loading');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link');
      return;
    }

    // Verify token
    fetch(`/api/unsubscribe/verify?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmail(data.email);
          setStatus('confirming');
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid or expired link');
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage('Failed to verify unsubscribe link');
        console.error(err);
      });
  }, []);

  const handleUnsubscribe = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/unsubscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(`You have been successfully unsubscribed from our mailing list.`);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to unsubscribe');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred while processing your request');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Preferences</CardTitle>
          <CardDescription>Manage your email subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-gray-600">Processing...</p>
            </div>
          )}

          {status === 'confirming' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You are about to unsubscribe the following email from our mailing list:
                </p>
                <p className="font-medium text-gray-900 dark:text-white mt-2">{email}</p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleUnsubscribe}
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-confirm-unsubscribe"
                >
                  Confirm Unsubscribe
                </Button>
                <Button 
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Successfully Unsubscribed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  You will no longer receive marketing emails from us.
                </p>
              </div>
              <Button 
                onClick={() => setLocation('/')}
                variant="outline"
                data-testid="button-return-home"
              >
                Return to Home
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Unsubscribe Failed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </div>
              <Button 
                onClick={() => setLocation('/')}
                variant="outline"
                data-testid="button-return-home"
              >
                Return to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
