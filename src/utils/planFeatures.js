const PLAN_FEATURES = {
  free: {
    maxStudents: 50,
    biometricAttendance: false,
    aiFeatures: false,
    customReports: false,
    smsNotifications: false,
    backupToGoogleDrive: false,
    examCbt: false,
    vendorShop: false,
  },
  starter: {
    maxStudents: 200,
    biometricAttendance: false,
    aiFeatures: false,
    customReports: true,
    smsNotifications: true,
    backupToGoogleDrive: true,
    examCbt: true,
    vendorShop: false,
  },
  pro: {
    maxStudents: 1000,
    biometricAttendance: true,
    aiFeatures: true,
    customReports: true,
    smsNotifications: true,
    backupToGoogleDrive: true,
    examCbt: true,
    vendorShop: true,
  },
  enterprise: {
    maxStudents: 999999,
    biometricAttendance: true,
    aiFeatures: true,
    customReports: true,
    smsNotifications: true,
    backupToGoogleDrive: true,
    examCbt: true,
    vendorShop: true,
  }
};

export function canAccess(feature, plan) {
  return PLAN_FEATURES[plan]?.[feature] ?? false;
}

export { PLAN_FEATURES };