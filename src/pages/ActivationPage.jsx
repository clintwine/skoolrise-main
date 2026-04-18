import React, { useState, useEffect } from 'react';
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
            navigate('/ProfileSetupPage', { replace: true });
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

  const redirectToDashboard = (u) => {
    const userType = u.user_type || '';
    const isAdmin = u.role === 'admin' || userType === 'admin';

    if (isAdmin) {
      navigate('/AdminDashboard', { replace: true });
    } else if (userType === 'teacher') {
      navigate('/TeacherDashboard', { replace: true });
    } else if (userType === 'student') {
      navigate('/StudentDashboard', { replace: true });
    } else if (userType === 'parent') {
      navigate('/ParentPortal', { replace: true });
    } else if (userType === 'vendor') {
      navigate('/VendorDashboard', { replace: true });
    } else {
      navigate('/AdminDashboard', { replace: true });
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
        navigate('/ProfileSetupPage', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Key className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Activate Your Account</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter the activation code provided by your administrator to access SkoolRise
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {user && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          <form onSubmit={handleActivation} className="space-y-4">
            <div>
              <Label htmlFor="activation_code" className="text-sm">Activation Code</Label>
              <Input
                id="activation_code"
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Enter your activation code"
                required
                className="text-center text-base sm:text-lg tracking-wider font-mono py-2.5 sm:py-3"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full text-sm sm:text-base py-2.5 sm:py-3" disabled={loading}>
              {loading ? 'Verifying...' : 'Activate Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Don't have an activation code? Contact your school administrator.
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-4 text-sm sm:text-base py-2.5 sm:py-3"
            onClick={() => base44.auth.logout(window.location.origin)}
          >
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}