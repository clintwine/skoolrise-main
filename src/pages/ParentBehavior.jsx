import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';

export default function ParentBehavior() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students'],
    queryFn: async () => {
      // RLS will automatically filter to only show students linked to this parent
      return await base44.entities.Student.list();
    },
  });

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudent]);

  const { data: behavior = [] } = useQuery({
    queryKey: ['behavior', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      // RLS will automatically filter to only show behavior for linked students
      return await base44.entities.Behavior.filter({ student_id: selectedStudent }, '-date');
    },
    enabled: !!selectedStudent,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const merits = behavior.filter(b => b.type === 'Merit').length;
  const demerits = behavior.filter(b => b.type === 'Demerit').length;
  const detentions = behavior.filter(b => b.type === 'Detention').length;
  const warnings = behavior.filter(b => b.type === 'Warning').length;
  const meritPoints = behavior.filter(b => b.type === 'Merit').reduce((sum, b) => sum + (b.points || 0), 0);
  const demeritPoints = behavior.filter(b => b.type === 'Demerit').reduce((sum, b) => sum + (b.points || 0), 0);

  const typeColors = {
    Merit: 'bg-green-100 text-green-800',
    Demerit: 'bg-red-100 text-red-800',
    Detention: 'bg-orange-100 text-orange-800',
    Warning: 'bg-yellow-100 text-yellow-800',
    Reward: 'bg-purple-100 text-purple-800',
  };

  const typeIcons = {
    Merit: <ThumbsUp className="w-5 h-5 text-green-600" />,
    Demerit: <ThumbsDown className="w-5 h-5 text-red-600" />,
    Detention: <AlertCircle className="w-5 h-5 text-orange-600" />,
    Warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    Reward: <Award className="w-5 h-5 text-purple-600" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Behavior Records</h1>
        <p className="text-gray-600 mt-1">View your child's behavior and conduct</p>
      </div>

      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select student" />
        </SelectTrigger>
        <SelectContent>
          {students.map(student => (
            <SelectItem key={student.id} value={student.id}>
              {student.first_name} {student.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Merits</p>
                <p className="text-3xl font-bold text-green-600">{merits}</p>
                <p className="text-xs text-gray-500">{meritPoints} points</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Demerits</p>
                <p className="text-3xl font-bold text-red-600">{demerits}</p>
                <p className="text-xs text-gray-500">{demeritPoints} points</p>
              </div>
              <ThumbsDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Points</p>
                <p className="text-3xl font-bold text-blue-600">{meritPoints - demeritPoints}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Detentions</p>
                <p className="text-3xl font-bold text-orange-600">{detentions}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">{warnings}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Behavior History</CardTitle>
        </CardHeader>
        <CardContent>
          {behavior.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No behavior records</p>
          ) : (
            <div className="space-y-4">
              {behavior.map((record) => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {typeIcons[record.type]}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={typeColors[record.type]}>{record.type}</Badge>
                          <Badge variant="outline">{record.category}</Badge>
                          {record.points && <Badge className="bg-blue-100 text-blue-800">{record.points > 0 ? '+' : ''}{record.points} pts</Badge>}
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{record.description}</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Date: {format(new Date(record.date), 'MMMM d, yyyy')}</p>
                          {record.teacher_name && <p>Reported by: {record.teacher_name}</p>}
                          {record.action_taken && (
                            <p className="text-orange-600">Action: {record.action_taken}</p>
                          )}
                        </div>
                        {record.parent_notified && (
                          <Badge className="bg-blue-100 text-blue-800 mt-2">Parent Notified</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}