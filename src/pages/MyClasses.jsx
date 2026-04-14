import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, MapPin, Sparkles } from 'lucide-react';

export default function MyClasses() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });
  console.log('🟢 MyClasses - User:', user);

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await base44.entities.Teacher.filter({ user_id: user.id });
      console.log('🟢 MyClasses - Teachers:', result);
      return result;
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];
  console.log('🟢 MyClasses - Teacher Profile:', teacherProfile);

  const { data: allocations = [] } = useQuery({
    queryKey: ['teacher-allocations', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) {
        console.log('🟢 MyClasses - No teacher ID, skipping allocations fetch');
        return [];
      }
      const result = await base44.entities.SubjectAllocation.filter({ teacher_id: teacherProfile.id });
      console.log('🟢 MyClasses - Subject Allocations:', result);
      return result;
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', allocations],
    queryFn: async () => {
      if (allocations.length === 0) {
        console.log('🟢 MyClasses - No allocations, skipping classes fetch');
        return [];
      }
      const classArmIds = [...new Set(allocations.map(a => a.class_arm_id))];
      console.log('🟢 MyClasses - Class Arm IDs from allocations:', classArmIds);
      const allClassArms = await base44.entities.ClassArm.list();
      console.log('🟢 MyClasses - All Class Arms:', allClassArms);
      const filtered = allClassArms.filter(ca => classArmIds.includes(ca.id));
      console.log('🟢 MyClasses - Filtered Classes:', filtered);
      return filtered;
    },
    enabled: allocations.length > 0,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const getClassStudentCount = (classArmId) => {
    const classArm = classes.find(c => c.id === classArmId);
    if (!classArm) return 0;
    return students.filter(s => s.grade_level === classArm.grade_level).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Classes</p>
          <p className="text-2xl font-bold text-blue-600">{classes.filter(c => c.status === 'Active').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Classes Assigned</h2>
              <p className="text-gray-600">You don't have any classes assigned yet. Please contact your administrator to get classes assigned to you.</p>
            </CardContent>
          </Card>
        ) : (
          classes.map((classArm) => (
            <Card key={classArm.id} className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {classArm.grade_level}{classArm.arm_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{getClassStudentCount(classArm.id)} Students</span>
                </div>
                {classArm.class_teacher_name && (
                  <div className="text-sm text-gray-600">
                    Form Teacher: {classArm.class_teacher_name}
                  </div>
                )}
                {classArm.room && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Room {classArm.room}</span>
                  </div>
                )}
                <div className="pt-3 border-t space-y-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    classArm.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {classArm.status}
                  </span>
                  <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <p className="text-xs font-semibold text-indigo-900">Suggested AI pathway</p>
                    </div>
                    <p className="text-xs text-indigo-800">Use support, core, or stretch activities for this class based on current student performance patterns.</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-white text-indigo-700 border border-indigo-200 hover:bg-white">Support</Badge>
                      <Badge className="bg-white text-indigo-700 border border-indigo-200 hover:bg-white">Core</Badge>
                      <Badge className="bg-white text-indigo-700 border border-indigo-200 hover:bg-white">Stretch</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}