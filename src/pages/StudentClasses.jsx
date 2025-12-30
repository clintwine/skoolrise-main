import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, User, Calendar, MapPin } from 'lucide-react';

export default function StudentClasses() {
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setStudentId(currentUser.linked_student_id);
    };
    fetchUser();
  }, []);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: () => base44.entities.Enrollment.filter({ student_id: studentId }),
    enabled: !!studentId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
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
          <div className="col-span-full text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">You are not enrolled in any classes yet</p>
          </div>
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
                <div className="pt-3 border-t">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    classItem.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {classItem.status}
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