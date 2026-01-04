import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Sparkles, Users, CheckCircle, AlertCircle, 
  Loader2, Download, Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function BulkReportCardGenerator({ open, onOpenChange }) {
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.AcademicSession.list(),
    enabled: open,
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => base44.entities.Term.list(),
    enabled: open,
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
    enabled: open,
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
    enabled: open,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.Submission.list(),
    enabled: open && selectedClass,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list(),
    enabled: open && selectedClass,
  });

  const { data: examResults = [] } = useQuery({
    queryKey: ['exam-results'],
    queryFn: () => base44.entities.ExamResult.list(),
    enabled: open && selectedClass,
  });

  const { data: gradingScales = [] } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => base44.entities.GradingScale.list(),
    enabled: open,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
    enabled: open,
  });

  const { data: existingReportCards = [] } = useQuery({
    queryKey: ['existing-report-cards', selectedSession, selectedTerm],
    queryFn: async () => {
      if (!selectedSession || !selectedTerm) return [];
      const all = await base44.entities.ReportCard.list();
      return all.filter(r => r.session_id === selectedSession && r.term_id === selectedTerm);
    },
    enabled: open && !!selectedSession && !!selectedTerm,
  });

  const filteredStudents = selectedClass
    ? allStudents.filter(s => {
        const classArm = classArms.find(c => c.id === selectedClass);
        return s.grade_level === classArm?.grade_level && s.status === 'Active';
      })
    : [];

  const calculateGradeFromScore = (score) => {
    const scale = gradingScales.find(s => score >= s.min_score && score <= s.max_score);
    return {
      grade: scale?.grade || 'F',
      remarks: scale?.remark || 'Below Average',
      grade_point: scale?.grade_point || 0,
    };
  };

  const getStudentGrades = (studentId) => {
    const studentSubmissions = submissions.filter(s => s.student_id === studentId && s.grade !== null);
    const studentExams = examResults.filter(e => e.student_id === studentId);
    
    // Group by subject
    const subjectScores = {};
    
    // Process assignment submissions
    studentSubmissions.forEach(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      if (!assignment) return;
      
      // Try to extract subject from class name or use assignment title
      let subjectName = 'General';
      const matchingSubject = subjects.find(s => 
        assignment.title?.toLowerCase().includes(s.subject_name.toLowerCase()) ||
        assignment.class_name?.toLowerCase().includes(s.subject_name.toLowerCase())
      );
      if (matchingSubject) subjectName = matchingSubject.subject_name;
      
      if (!subjectScores[subjectName]) {
        subjectScores[subjectName] = { caScores: [], examScores: [] };
      }
      
      const percentage = (sub.grade / assignment.max_points) * 100;
      subjectScores[subjectName].caScores.push(percentage);
    });
    
    // Process exam results
    studentExams.forEach(exam => {
      const subjectName = exam.subject || 'General';
      if (!subjectScores[subjectName]) {
        subjectScores[subjectName] = { caScores: [], examScores: [] };
      }
      subjectScores[subjectName].examScores.push(exam.score || 0);
    });
    
    // Calculate final grades (CA 40%, Exam 60% typical weighting)
    const grades = Object.entries(subjectScores).map(([subject, scores]) => {
      const caAvg = scores.caScores.length > 0 
        ? scores.caScores.reduce((a, b) => a + b, 0) / scores.caScores.length 
        : 0;
      const examAvg = scores.examScores.length > 0 
        ? scores.examScores.reduce((a, b) => a + b, 0) / scores.examScores.length 
        : 0;
      
      // If only CA or only exam, use what's available
      let finalScore;
      if (scores.caScores.length > 0 && scores.examScores.length > 0) {
        finalScore = (caAvg * 0.4) + (examAvg * 0.6);
      } else if (scores.caScores.length > 0) {
        finalScore = caAvg;
      } else {
        finalScore = examAvg;
      }
      
      const { grade, remarks } = calculateGradeFromScore(finalScore);
      
      return {
        subject,
        ca_score: caAvg.toFixed(1),
        exam_score: examAvg.toFixed(1),
        score: finalScore.toFixed(1),
        grade,
        remarks,
      };
    });
    
    return grades;
  };

  const generateReportCards = async () => {
    if (!selectedSession || !selectedTerm || selectedStudents.length === 0) {
      toast.error('Please select session, term, and at least one student');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setResults([]);
    
    const session = sessions.find(s => s.id === selectedSession);
    const term = terms.find(t => t.id === selectedTerm);
    const newResults = [];
    
    for (let i = 0; i < selectedStudents.length; i++) {
      const studentId = selectedStudents[i];
      const student = allStudents.find(s => s.id === studentId);
      
      try {
        // Check if report card already exists
        const exists = existingReportCards.some(r => r.student_id === studentId);
        if (exists) {
          newResults.push({ 
            studentId, 
            studentName: `${student.first_name} ${student.last_name}`,
            status: 'skipped',
            message: 'Report card already exists'
          });
          continue;
        }
        
        const grades = getStudentGrades(studentId);
        
        if (grades.length === 0) {
          newResults.push({ 
            studentId, 
            studentName: `${student.first_name} ${student.last_name}`,
            status: 'skipped',
            message: 'No grades found'
          });
          continue;
        }
        
        const totalScore = grades.reduce((sum, g) => sum + parseFloat(g.score), 0);
        const avgScore = totalScore / grades.length;
        
        await base44.entities.ReportCard.create({
          student_id: studentId,
          student_name: `${student.first_name} ${student.last_name}`,
          session_id: selectedSession,
          term_id: selectedTerm,
          class_id: selectedClass,
          grades: JSON.stringify(grades),
          total_score: totalScore,
          average_score: parseFloat(avgScore.toFixed(2)),
          grade: calculateGradeFromScore(avgScore).grade,
          status: 'Draft',
        });
        
        newResults.push({ 
          studentId, 
          studentName: `${student.first_name} ${student.last_name}`,
          status: 'success',
          message: `${grades.length} subjects, avg: ${avgScore.toFixed(1)}%`
        });
        
      } catch (error) {
        newResults.push({ 
          studentId, 
          studentName: `${student.first_name} ${student.last_name}`,
          status: 'error',
          message: error.message
        });
      }
      
      setProgress(((i + 1) / selectedStudents.length) * 100);
      setResults([...newResults]);
    }
    
    setGenerating(false);
    queryClient.invalidateQueries({ queryKey: ['report-cards'] });
    queryClient.invalidateQueries({ queryKey: ['existing-report-cards'] });
    
    const successCount = newResults.filter(r => r.status === 'success').length;
    toast.success(`Generated ${successCount} report cards`);
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    const eligibleStudents = filteredStudents
      .filter(s => !existingReportCards.some(r => r.student_id === s.id))
      .map(s => s.id);
    setSelectedStudents(eligibleStudents);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Bulk Generate Report Cards
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Academic Session *</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.term_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={(v) => {
                setSelectedClass(v);
                setSelectedStudents([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classArms.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.grade_level} {c.arm_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student Selection */}
          {selectedClass && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Select Students ({selectedStudents.length} selected)</Label>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All Eligible
                </Button>
              </div>
              
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No students in this class</p>
                ) : (
                  filteredStudents.map(student => {
                    const hasExisting = existingReportCards.some(r => r.student_id === student.id);
                    return (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-3 border-b last:border-0 ${hasExisting ? 'bg-gray-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                            disabled={hasExisting}
                          />
                          <div>
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-500">{student.student_id_number}</p>
                          </div>
                        </div>
                        {hasExisting && (
                          <Badge variant="outline" className="text-xs">Already generated</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating report cards...</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {result.status === 'skipped' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                    {result.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    <span className="font-medium">{result.studentName}</span>
                  </div>
                  <span className={`text-sm ${
                    result.status === 'success' ? 'text-green-600' :
                    result.status === 'skipped' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {results.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            {!generating && results.length === 0 && (
              <Button 
                onClick={generateReportCards}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!selectedSession || !selectedTerm || selectedStudents.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {selectedStudents.length} Report Cards
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}