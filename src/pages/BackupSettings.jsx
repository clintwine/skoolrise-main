import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HardDrive, Database, FileText, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupSettings() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      checkConnection();
    };
    fetchUser();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await base44.functions.invoke('checkGoogleDriveConnection', {});
      setIsConnected(result.data?.connected || false);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Request OAuth authorization for Google Drive
      const authUrl = await base44.connectors.requestAuthorization('googledrive', {
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });
      
      // Open authorization window
      window.open(authUrl, '_blank');
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        try {
          const result = await base44.functions.invoke('checkGoogleDriveConnection', {});
          if (result.data?.connected) {
            setIsConnected(true);
            clearInterval(pollInterval);
            toast.success('Successfully connected to Google Drive!');
          }
        } catch (pollError) {
          // Ignore polling errors
        }
      }, 3000);
      
      // Clear interval after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!isConnected) {
          toast.error('Connection timed out. Please try again.');
        }
      }, 120000);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to Google Drive. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await base44.functions.invoke('disconnectGoogleDrive', {});
      if (result.data.success) {
        setIsConnected(false);
        toast.success('Successfully disconnected from Google Drive.');
      } else {
        toast.error(result.data.error || 'Failed to disconnect.');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect from Google Drive. Please try again.');
    }
  };

  const handleBackup = async (backupType) => {
    setLoading(true);
    setBackupStatus(null);
    
    try {
      const result = await base44.functions.invoke('backupToGoogleDrive', { backupType });
      
      if (result.data.success) {
        setBackupStatus({
          type: 'success',
          message: result.data.message,
          fileName: result.data.fileName
        });
      } else {
        setBackupStatus({
          type: 'error',
          message: result.data.error || 'Backup failed'
        });
      }
    } catch (error) {
      console.error('Backup error:', error);
      setBackupStatus({
        type: 'error',
        message: error.message || 'Backup failed'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>
            Only administrators can access backup settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Backup Settings</h1>
        <p className="text-gray-600 mt-1">Backup your school data to Google Drive</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Connect your Google Drive account to enable automated backups
              </p>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {!isConnected && (
                <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                  Connect to Google Drive
                </Button>
              )}
              {isConnected && (
                <Button onClick={handleDisconnect} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {backupStatus && (
        <Alert className={backupStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription className="flex items-center gap-2">
            {backupStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <div>
              <p className="font-medium">{backupStatus.message}</p>
              {backupStatus.fileName && (
                <p className="text-sm text-gray-600">File: {backupStatus.fileName}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <CardTitle>Full Backup</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Backup all data including students, teachers, classes, assignments, exams, attendance, fees, and more.
            </p>
            <Button
              onClick={() => handleBackup('full')}
              disabled={!isConnected || loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Backup All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <CardTitle>Reports Backup</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Backup all report cards and academic reports generated for students.
            </p>
            <Button
              onClick={() => handleBackup('reports')}
              disabled={!isConnected || loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Backup Reports
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <CardTitle>Exam Results Backup</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Backup all exam results, attempts, and assessment data.
            </p>
            <Button
              onClick={() => handleBackup('results')}
              disabled={!isConnected || loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Backup Results
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• All backups are saved as JSON files in your connected Google Drive account</p>
            <p>• Backup files are timestamped for easy identification</p>
            <p>• Only administrators can access and perform backups</p>
            <p>• Backups include all data up to the moment of backup creation</p>
            <p>• Recommended to perform regular backups (weekly or monthly)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}