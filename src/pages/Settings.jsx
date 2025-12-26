import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Users, Bell, Lock, HardDrive } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure system preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to={createPageUrl('UserManagement')} className="block">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('NotificationsSettings')} className="block">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configure notification preferences</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('SecuritySettings')} className="block">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Security and authentication settings</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('GeneralSettings')} className="block">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">General system configuration</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('BackupSettings')} className="block">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Backup data to Google Drive</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}