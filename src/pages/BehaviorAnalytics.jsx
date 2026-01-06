import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BehaviorAnalytics() {
  const [selectedClass, setSelectedClass] = useState('all');

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behaviors'],
    queryFn: () => base44.entities.Behavior.list('-date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const filteredBehaviors = selectedClass === 'all' 
    ? behaviors 
    : behaviors.filter(b => b.class_id === selectedClass);

  const meritPoints = filteredBehaviors.filter(b => b.type === 'Merit').reduce((sum, b) => sum + (b.points || 0), 0);
  const demeritPoints = filteredBehaviors.filter(b => b.type === 'Demerit').reduce((sum, b) => sum + (b.points || 0), 0);

  // Student rankings
  const studentPoints = {};
  filteredBehaviors.forEach(b => {
    if (!studentPoints[b.student_id]) {
      studentPoints[b.student_id] = { 
        name: b.student_name, 
        merits: 0, 
        demerits: 0,
        net: 0 
      };
    }
    if (b.type === 'Merit') {
      studentPoints[b.student_id].merits += (b.points || 0);
    } else if (b.type === 'Demerit') {
      studentPoints[b.student_id].demerits += (b.points || 0);
    }
    studentPoints[b.student_id].net = studentPoints[b.student_id].merits - studentPoints[b.student_id].demerits;
  });

  const topStudents = Object.values(studentPoints).sort((a, b) => b.net - a.net).slice(0, 10);
  const needsSupport = Object.values(studentPoints).filter(s => s.net < -10).sort((a, b) => a.net - b.net);

  // Weekly trend
  const weeklyData = [];
  const last8Weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    last8Weeks.push(weekStart);
  }

  last8Weeks.forEach(weekStart => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekBehaviors = filteredBehaviors.filter(b => {
      const date = new Date(b.date);
      return date >= weekStart && date < weekEnd;
    });

    weeklyData.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      merits: weekBehaviors.filter(b => b.type === 'Merit').length,
      demerits: weekBehaviors.filter(b => b.type === 'Demerit').length,
    });
  });

  // Category breakdown
  const categoryData = {};
  filteredBehaviors.forEach(b => {
    if (!categoryData[b.category]) {
      categoryData[b.category] = 0;
    }
    categoryData[b.category]++;
  });

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Behavior Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive behavior insights and trends</p>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classArms.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.grade_level} - {c.arm_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Merit Points</p>
                <p className="text-3xl font-bold text-green-600">{meritPoints}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Demerit Points</p>
                <p className="text-3xl font-bold text-red-600">{demeritPoints}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net School Points</p>
                <p className="text-3xl font-bold text-blue-600">{meritPoints - demeritPoints}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students Tracked</p>
                <p className="text-3xl font-bold text-purple-600">{Object.keys(studentPoints).length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>8-Week Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="merits" stroke="#10B981" strokeWidth={2} name="Merits" />
              <Line type="monotone" dataKey="demerits" stroke="#EF4444" strokeWidth={2} name="Demerits" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudents.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-blue-600">#{idx + 1}</span>
                    </div>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800">{student.merits} merits</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{student.net} net</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {needsSupport.length > 0 && (
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Students Needing Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsSupport.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">{student.name}</span>
                  <div className="flex gap-2">
                    <Badge className="bg-red-100 text-red-800">{student.demerits} demerits</Badge>
                    <Badge className="bg-red-200 text-red-900">{student.net} net</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}