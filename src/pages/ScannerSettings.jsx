import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const SCANNER_FEATURES = [
  {
    id: 'biometric_attendance',
    name: 'Student Biometric Attendance',
    description: 'Scan student PVC cards to record attendance',
    defaultRoles: ['admin', 'teacher']
  },
  {
    id: 'bookshop_isbn',
    name: 'Bookshop ISBN Scanner',
    description: 'Scan book ISBNs to add to catalog',
    defaultRoles: ['admin', 'vendor']
  },
  {
    id: 'bookshop_checkout',
    name: 'Bookshop Student Checkout',
    description: 'Scan student cards for book purchases',
    defaultRoles: ['admin', 'vendor']
  },
  {
    id: 'room_access',
    name: 'Room Access Control',
    description: 'Track room entry and exit',
    defaultRoles: ['admin', 'teacher']
  },
  {
    id: 'student_exit',
    name: 'Student Exit Notification',
    description: 'Record student exits and notify parents',
    defaultRoles: ['admin', 'teacher']
  }
];

const ALL_ROLES = ['admin', 'teacher', 'student', 'parent', 'vendor'];

export default function ScannerSettings() {
  const queryClient = useQueryClient();
  const [editingFeature, setEditingFeature] = useState(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['scanner-settings'],
    queryFn: () => base44.entities.ScannerSettings.list(),
  });

  const createSettingMutation = useMutation({
    mutationFn: (data) => base44.entities.ScannerSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanner-settings'] });
      toast.success('Scanner setting saved');
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScannerSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanner-settings'] });
      toast.success('Scanner setting updated');
      setEditingFeature(null);
    },
  });

  const getFeatureSetting = (featureId) => {
    return settings.find(s => s.feature_name === featureId);
  };

  const handleToggleFeature = async (featureId, enabled) => {
    const existing = getFeatureSetting(featureId);
    const feature = SCANNER_FEATURES.find(f => f.id === featureId);

    if (existing) {
      updateSettingMutation.mutate({
        id: existing.id,
        data: { enabled }
      });
    } else {
      createSettingMutation.mutate({
        feature_name: featureId,
        enabled,
        allowed_roles: JSON.stringify(feature.defaultRoles),
        configuration: '{}'
      });
    }
  };

  const handleUpdateRoles = (featureId, roles) => {
    const existing = getFeatureSetting(featureId);
    if (existing) {
      updateSettingMutation.mutate({
        id: existing.id,
        data: { allowed_roles: JSON.stringify(roles) }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scanner Settings</h1>
        <p className="text-gray-600 mt-1">Configure QR/Barcode scanner features and permissions</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {SCANNER_FEATURES.map((feature) => {
            const setting = getFeatureSetting(feature.id);
            const isEnabled = setting?.enabled || false;
            const allowedRoles = setting?.allowed_roles 
              ? JSON.parse(setting.allowed_roles) 
              : feature.defaultRoles;
            const isEditing = editingFeature === feature.id;

            return (
              <Card key={feature.id} className="bg-white shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Status
                      </Label>
                      {isEnabled ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    {isEnabled && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Allowed Roles
                          </Label>
                          {!isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFeature(feature.id)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                            {ALL_ROLES.map((role) => (
                              <div key={role} className="flex items-center gap-2">
                                <Checkbox
                                  checked={allowedRoles.includes(role)}
                                  onCheckedChange={(checked) => {
                                    const newRoles = checked
                                      ? [...allowedRoles, role]
                                      : allowedRoles.filter(r => r !== role);
                                    handleUpdateRoles(feature.id, newRoles);
                                  }}
                                />
                                <Label className="capitalize cursor-pointer">{role}</Label>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingFeature(null)}
                              className="mt-2"
                            >
                              Done
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {allowedRoles.map((role) => (
                              <Badge key={role} variant="outline" className="capitalize">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Scanner Integration Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Student PVC cards should contain the student_id</li>
            <li>Book barcodes should contain ISBN numbers</li>
            <li>Scanner features are only visible to users with allowed roles</li>
            <li>All scanner actions are logged for traceability</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}