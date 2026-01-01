import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Bell, Shield, HardDrive, 
  Building2, Users, Database
} from 'lucide-react';

// Import settings components content
import NotificationsSettings from './NotificationsSettings';
import BackupSettings from './BackupSettings';

export default function SettingsHub() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Vertical Sidebar */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex-shrink-0"
      >
        <Card className="glass-morphism shadow-md rounded-2xl h-full">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-text mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h2>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-accent text-white shadow-lg scale-105'
                        : 'text-text hover:bg-gray-100 hover:scale-102'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && <GeneralSettingsContent />}
            {activeTab === 'notifications' && <NotificationsSettings />}
            {activeTab === 'security' && <SecuritySettingsContent />}
            {activeTab === 'backup' && <BackupSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function GeneralSettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-text">General Settings</h1>
        <p className="text-text-secondary mt-2">Configure your school's basic information and preferences</p>
      </div>
      
      <Card className="bg-white rounded-2xl shadow-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">General Settings</h3>
              <p className="text-text-secondary">School information, timezone, and regional settings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecuritySettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-text">Security Settings</h1>
        <p className="text-text-secondary mt-2">Manage authentication, permissions, and security policies</p>
      </div>
      
      <Card className="bg-white rounded-2xl shadow-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">Security Settings</h3>
              <p className="text-text-secondary">Password policies, two-factor authentication, and access controls</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}