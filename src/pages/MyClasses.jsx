import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function MyClasses() {
  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Get teacher profile
        if (currentUser?.teacher_profile_id) {
          const teacher = await base44.entities.Teacher.get(currentUser.teacher_profile_id);
          setTeacherId(teacher?.id);
        } else if (currentUser?.id) {
          const teachers = await base44.entities.Teacher.filter({ user_id: currentUser.id });
          setTeacherId(teachers[0]?.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: allocations = [] } = useQuery({
    queryKey: ['teacher-allocations', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      return await base44.entities.SubjectAllocation.filter({ teacher_id: teacherId });
    },
    enabled: !!teacherId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', allocations],
    queryFn: async () => {
      if (allocations.length === 0) return [];
      const classArmIds = [...new Set(allocations.map(a => a.class_arm_id))];
      const allClassArms = await base44.entities.ClassArm.list();
      return allClassArms.filter(ca => classArmIds.includes(ca.id));
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
                <div className="pt-3 border-t">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    classArm.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {classArm.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}