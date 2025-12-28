import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ActivationPage() {
  const navigate = useNavigate();
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // If already activated, redirect
        if (currentUser.is_activated) {
          if (!currentUser.profile_completed) {
            navigate('/profile-setup');
          } else {
            // Redirect based on user type
            redirectToDashboard(currentUser);
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    checkUser();
  }, [navigate]);

  const redirectToDashboard = (user) => {
    if (user.role === 'admin' || user.user_type === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.user_type === 'teacher') {
      navigate('/teacher-dashboard');
    } else if (user.user_type === 'student') {
      navigate('/student-dashboard');
    } else if (user.user_type === 'parent') {
      navigate('/parent-portal');
    } else {
      navigate('/dashboard');
    }
  };

  const handleActivation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('verifyAndActivateUser', {
        activation_code: activationCode.trim()
      });

      if (response.data.success) {
        // Refresh user data
        const updatedUser = await base44.auth.me();
        
        // Redirect to profile setup
        navigate('/profile-setup');
      } else {
        setError(response.data.message || 'Invalid or expired activation code');
      }
    } catch (err) {
      setError('Failed to verify activation code. Please try again.');
      console.error('Activation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Activate Your Account</CardTitle>
          <CardDescription>
            Enter the activation code provided by your administrator to access SkoolRise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          <form onSubmit={handleActivation} className="space-y-4">
            <div>
              <Label htmlFor="activation_code">Activation Code</Label>
              <Input
                id="activation_code"
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Enter your activation code"
                required
                className="text-center text-lg tracking-wider font-mono"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Activate Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an activation code? Contact your school administrator.
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => base44.auth.logout(window.location.origin)}
          >
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}