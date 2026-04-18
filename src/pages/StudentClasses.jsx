import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, User, Calendar, MapPin, Sparkles } from 'lucide-react';

export default function StudentClasses() {
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Student.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const studentProfile = students[0];

  useEffect(() => {
    if (studentProfile?.id) {
      setStudentId(studentProfile.id);
    }
  }, [studentProfile]);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      return await base44.entities.Enrollment.filter({ student_id: studentId });
    },
    enabled: !!studentId,
  });

  const schoolTenantId = studentProfile?.school_tenant_id || null;

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', schoolTenantId],
    queryFn: () => base44.entities.Class.filter(addSchoolFilter({}, schoolTenantId)),
    enabled: !!studentProfile,
  });

  const enrolledClasses = classes.filter(c => 
    enrollments.some(e => e.class_id === c.id && e.status === 'Enrolled')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Classes</p>
          <p className="text-2xl font-bold text-blue-600">{enrolledClasses.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledClasses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Classes Yet</h2>
              <p className="text-gray-600">You are not enrolled in any classes at the moment. Please contact your administrator for class enrollment.</p>
            </CardContent>
          </Card>
        ) : (
          enrolledClasses.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {classItem.class_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{classItem.teacher_name}</span>
                </div>
                {classItem.schedule && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{classItem.schedule}</span>
                  </div>
                )}
                {classItem.room && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Room {classItem.room}</span>
                  </div>
                )}
                <div className="pt-3 border-t space-y-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    classItem.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {classItem.status}
                  </span>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-900">Recommended learning path</p>
                    </div>
                    <p className="text-xs text-blue-800">Stay on your core path, and ask your teacher for support or stretch tasks when needed.</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-white text-blue-700 border border-blue-200 hover:bg-white">Core</Badge>
                      <Badge className="bg-white text-blue-700 border border-blue-200 hover:bg-white">Support</Badge>
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