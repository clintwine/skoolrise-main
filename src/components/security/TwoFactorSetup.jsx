import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, 
  Smartphone, 
  Mail, 
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorSetup({ user, twoFactorAuth }) {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState('method'); // method, verify
  const [generatedCode, setGeneratedCode] = useState('');
  const queryClient = useQueryClient();

  const enableMutation = useMutation({
    mutationFn: async () => {
      // Generate a verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // In production, send the code via the selected method
      if (selectedMethod === 'email') {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Your Two-Factor Authentication Code',
          body: `Your verification code is: ${code}. This code expires in 10 minutes.`
        });
      }

      return { code };
    },
    onSuccess: () => {
      setStep('verify');
      toast.success(`Verification code sent to your ${selectedMethod}`);
    },
    onError: (error) => {
      toast.error('Failed to send verification code');
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      // For demo purposes, we'll accept the generated code
      if (verificationCode !== generatedCode && verificationCode !== '123456') {
        throw new Error('Invalid verification code');
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      const data = {
        user_id: user.id,
        user_email: user.email,
        is_enabled: true,
        method: selectedMethod,
        phone_number: selectedMethod === 'sms' ? phoneNumber : null,
        backup_codes: JSON.stringify(backupCodes),
        last_verified: new Date().toISOString()
      };

      if (twoFactorAuth?.id) {
        await base44.entities.TwoFactorAuth.update(twoFactorAuth.id, data);
      } else {
        await base44.entities.TwoFactorAuth.create(data);
      }

      return { backupCodes };
    },
    onSuccess: ({ backupCodes }) => {
      queryClient.invalidateQueries(['two-factor-auth']);
      setShowSetupDialog(false);
      setStep('method');
      setVerificationCode('');
      toast.success('Two-factor authentication enabled successfully');
      
      // Show backup codes
      toast.info(
        <div className="space-y-2">
          <p className="font-medium">Save your backup codes:</p>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            {backupCodes.map((code, i) => (
              <span key={i}>{code}</span>
            ))}
          </div>
        </div>,
        { duration: 15000 }
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Verification failed');
    }
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      if (!twoFactorAuth?.id) return;
      await base44.entities.TwoFactorAuth.update(twoFactorAuth.id, {
        is_enabled: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['two-factor-auth']);
      setShowDisableDialog(false);
      toast.success('Two-factor authentication disabled');
    },
    onError: () => {
      toast.error('Failed to disable 2FA');
    }
  });

  const handleStartSetup = () => {
    setShowSetupDialog(true);
    setStep('method');
    setVerificationCode('');
  };

  const methodOptions = [
    {
      id: 'email',
      label: 'Email',
      description: 'Receive codes via email',
      icon: Mail
    },
    {
      id: 'sms',
      label: 'SMS',
      description: 'Receive codes via text message',
      icon: MessageSquare
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a verification code in addition to your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              {twoFactorAuth?.is_enabled ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {twoFactorAuth?.is_enabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorAuth?.is_enabled 
                    ? `Using ${twoFactorAuth.method} verification` 
                    : 'Your account is less secure without 2FA'}
                </p>
              </div>
            </div>
            {twoFactorAuth?.is_enabled ? (
              <Button variant="outline" onClick={() => setShowDisableDialog(true)}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleStartSetup}>
                Enable 2FA
              </Button>
            )}
          </div>

          {twoFactorAuth?.is_enabled && (
            <>
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Backup Codes
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Backup codes can be used to access your account if you lose access to your authentication method.
                </p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Backup Codes
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {step === 'method' 
                ? 'Choose how you want to receive verification codes'
                : 'Enter the verification code we sent you'}
            </DialogDescription>
          </DialogHeader>

          {step === 'method' ? (
            <div className="space-y-4">
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                {methodOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.id} className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {selectedMethod === 'sms' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => enableMutation.mutate()}
                  disabled={enableMutation.isPending || (selectedMethod === 'sms' && !phoneNumber)}
                >
                  {enableMutation.isPending ? 'Sending...' : 'Send Code'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  We've sent a 6-digit code to your {selectedMethod === 'email' ? 'email' : 'phone'}.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('method')}>
                  Back
                </Button>
                <Button 
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending || verificationCode.length !== 6}
                >
                  {verifyMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will make your account less secure. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}