import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Trash2, Save, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CreateReportCard() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClassArm, setSelectedClassArm] = useState('');
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const [formData, setFormData] = useState({
    teacher_comment: '',
    principal_comment: '',
    position: '',
    total_score: 0,
    average_score: 0,
  });
  const queryClient = useQueryClient();

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: gradingScales = [] } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => base44.entities.GradingScale.list(),
  });

  const students = selectedClassArm 
    ? allStudents.filter(s => {
        const classArm = classArms.find(c => c.id === selectedClassArm);
        return s.grade_level === classArm?.grade_level;
      })
    : allStudents;

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => base44.entities.Term.list(),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.AcademicSession.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      alert('Report card created successfully!');
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedStudent('');
    setSelectedTerm('');
    setSelectedSession('');
    setSelectedClassArm('');
    setGrades([]);
    setFormData({
      teacher_comment: '',
      principal_comment: '',
      position: '',
      total_score: 0,
      average_score: 0,
    });
  };

  const calculateGradeFromScore = (score) => {
    const scale = gradingScales.find(s => score >= s.min_score && score <= s.max_score);
    return {
      grade: scale?.grade || '',
      remarks: scale?.remark || '',
      grade_point: scale?.grade_point || 0,
    };
  };

  const addGrade = () => {
    setGrades([...grades, { subject: '', score: '', grade: '', remarks: '' }]);
  };

  const updateGrade = (index, field, value) => {
    const newGrades = [...grades];
    newGrades[index][field] = value;
    
    // Auto-calculate grade and remarks when score changes
    if (field === 'score' && value) {
      const { grade, remarks } = calculateGradeFromScore(parseFloat(value));
      newGrades[index].grade = grade;
      newGrades[index].remarks = remarks;
    }
    
    setGrades(newGrades);
    calculateTotals(newGrades);
  };

  const removeGrade = (index) => {
    const newGrades = grades.filter((_, i) => i !== index);
    setGrades(newGrades);
    calculateTotals(newGrades);
  };

  const calculateTotals = (gradeList) => {
    const totalScore = gradeList.reduce((sum, g) => sum + (parseFloat(g.score) || 0), 0);
    const avgScore = gradeList.length > 0 ? totalScore / gradeList.length : 0;
    setFormData({
      ...formData,
      total_score: totalScore,
      average_score: parseFloat(avgScore.toFixed(2)),
    });
  };

  const handleSubmit = () => {
    if (!selectedStudent || !selectedTerm || !selectedSession || grades.length === 0) {
      alert('Please fill in all required fields and add at least one grade');
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    const term = terms.find(t => t.id === selectedTerm);
    const session = sessions.find(s => s.id === selectedSession);

    const reportData = {
      student_id: selectedStudent,
      student_name: `${student.first_name} ${student.last_name}`,
      term_id: selectedTerm,
      term_name: term.term_name,
      session_id: selectedSession,
      session_name: session.session_name,
      grades: JSON.stringify(grades),
      teacher_comment: formData.teacher_comment,
      principal_comment: formData.principal_comment,
      position: formData.position,
      total_score: formData.total_score,
      average_score: formData.average_score,
      status: 'Published',
    };

    createMutation.mutate(reportData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-600" />
          Create Report Card
        </h1>
        <p className="text-gray-600 mt-1">Generate student report cards for a term</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Class Arm</Label>
              <Select value={selectedClassArm} onValueChange={setSelectedClassArm}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classArms.map((arm) => (
                    <SelectItem key={arm.id} value={arm.id}>
                      {arm.grade_level}{arm.arm_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - Grade {student.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Session *</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.session_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term (e.g., First Term)" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.term_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Subject Grades</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setAutoFillOpen(true)} size="sm" variant="outline" disabled={!selectedStudent}>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-fill from Assessments
              </Button>
              <Button onClick={addGrade} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grades.map((grade, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Subject</Label>
                  <Select value={grade.subject} onValueChange={(value) => updateGrade(index, 'subject', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.subject_name}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Score</Label>
                  <Input
                    type="number"
                    value={grade.score}
                    onChange={(e) => updateGrade(index, 'score', e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Select value={grade.grade} onValueChange={(value) => updateGrade(index, 'grade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input
                    value={grade.remarks}
                    onChange={(e) => updateGrade(index, 'remarks', e.target.value)}
                    placeholder="e.g., Excellent"
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={() => removeGrade(index)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {grades.length === 0 && (
              <p className="text-center text-gray-500 py-8">No subjects added yet. Click "Add Subject" to begin.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Total Score</span>
              <Badge className="bg-blue-600 text-lg">{formData.total_score}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Average Score</span>
              <Badge className="bg-green-600 text-lg">{formData.average_score}%</Badge>
            </div>
            <div>
              <Label>Position in Class</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="e.g., 1st, 2nd, 3rd"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Teacher's Comment</Label>
              <Textarea
                value={formData.teacher_comment}
                onChange={(e) => setFormData({...formData, teacher_comment: e.target.value})}
                rows={3}
                placeholder="Enter teacher's remarks..."
              />
            </div>
            <div>
              <Label>Principal's Comment</Label>
              <Textarea
                value={formData.principal_comment}
                onChange={(e) => setFormData({...formData, principal_comment: e.target.value})}
                rows={3}
                placeholder="Enter principal's remarks..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={resetForm}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Create Report Card
        </Button>
      </div>

      {/* Auto-fill Dialog */}
      <AutoFillGradesDialog
        open={autoFillOpen}
        onOpenChange={setAutoFillOpen}
        studentId={selectedStudent}
        onGradesImported={(importedGrades) => {
          setGrades(importedGrades);
          calculateTotals(importedGrades);
          setAutoFillOpen(false);
          toast.success('Grades imported successfully');
        }}
      />
    </div>
  );
}

function AutoFillGradesDialog({ open, onOpenChange, studentId, onGradesImported }) {
  const { data: submissions = [] } = useQuery({
    queryKey: ['student-submissions', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      return await base44.entities.Submission.filter({ student_id: studentId });
    },
    enabled: !!studentId && open,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list(),
    enabled: open,
  });

  const { data: gradingScales = [] } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => base44.entities.GradingScale.list(),
    enabled: open,
  });

  const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);

  // Group by subject and calculate averages
  const subjectAverages = {};
  gradedSubmissions.forEach(sub => {
    const assignment = assignments.find(a => a.id === sub.assignment_id);
    if (!assignment) return;
    
    // Extract subject from class_name or use a default
    const subject = assignment.class_name?.split('-')[0]?.trim() || 'General';
    
    if (!subjectAverages[subject]) {
      subjectAverages[subject] = { total: 0, count: 0, maxPoints: 0 };
    }
    
    const percentage = (sub.grade / assignment.max_points) * 100;
    subjectAverages[subject].total += percentage;
    subjectAverages[subject].count += 1;
  });

  const calculateGrade = (score) => {
    const scale = gradingScales.find(s => score >= s.min_score && score <= s.max_score);
    return {
      grade: scale?.grade || '',
      remarks: scale?.remark || '',
    };
  };

  const handleImport = () => {
    const importedGrades = Object.entries(subjectAverages).map(([subject, data]) => {
      const avgScore = data.total / data.count;
      const { grade, remarks } = calculateGrade(avgScore);
      
      return {
        subject,
        score: avgScore.toFixed(2),
        grade,
        remarks,
      };
    });

    onGradesImported(importedGrades);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>Auto-fill Grades from Assessments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Found <strong>{gradedSubmissions.length}</strong> graded submissions. 
              Averages will be calculated per subject.
            </p>
          </div>

          {Object.keys(subjectAverages).length === 0 ? (
            <p className="text-center text-text-secondary py-8">No graded submissions found for this student</p>
          ) : (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {Object.entries(subjectAverages).map(([subject, data]) => {
                const avgScore = data.total / data.count;
                const { grade, remarks } = calculateGrade(avgScore);
                
                return (
                  <div key={subject} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-text">{subject}</p>
                      <p className="text-sm text-text-secondary">
                        Based on {data.count} assessment{data.count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-text">{avgScore.toFixed(1)}%</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-800">{grade}</Badge>
                        <Badge variant="outline">{remarks}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={handleImport} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={Object.keys(subjectAverages).length === 0}
            >
              Import {Object.keys(subjectAverages).length} Subject{Object.keys(subjectAverages).length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}