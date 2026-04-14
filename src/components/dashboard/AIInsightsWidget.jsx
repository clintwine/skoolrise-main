import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, 
  Lightbulb, RefreshCw, ChevronRight, Users, BookOpen,
  DollarSign, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIInsightsWidget() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [expandedInsight, setExpandedInsight] = useState(null);

  const { data: students = [] } = useQuery({
    queryKey: ['students-ai'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards-ai'],
    queryFn: () => base44.entities.ReportCard.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-ai'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-ai'],
    queryFn: () => base44.entities.FeeInvoice.list(),
  });

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behaviors-ai'],
    queryFn: () => base44.entities.Behavior.list(),
  });

  const generateInsights = async () => {
    setLoading(true);
    
    // Calculate metrics for AI context
    const activeStudents = students.filter(s => s.status === 'Active');
    const avgScore = reportCards.length > 0 
      ? reportCards.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / reportCards.length 
      : 0;
    const attendanceRate = attendance.length > 0 
      ? (attendance.filter(a => a.status === 'Present').length / attendance.length) * 100 
      : 0;
    const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length;
    const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balance || 0), 0);
    const behaviorIssues = behaviors.filter(b => b.type === 'Demerit' || b.type === 'Detention').length;
    
    // Students with declining performance
    const studentsWithMultipleReports = {};
    reportCards.forEach(rc => {
      if (!studentsWithMultipleReports[rc.student_id]) {
        studentsWithMultipleReports[rc.student_id] = [];
      }
      studentsWithMultipleReports[rc.student_id].push(rc);
    });
    
    const decliningStudents = Object.entries(studentsWithMultipleReports)
      .filter(([_, reports]) => {
        if (reports.length < 2) return false;
        const sorted = reports.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        return sorted[0].average_score < sorted[1].average_score - 5;
      }).length;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI education analyst. Based on these school metrics, provide actionable insights:

METRICS:
- Total Active Students: ${activeStudents.length}
- Average Academic Score: ${avgScore.toFixed(1)}%
- Attendance Rate: ${attendanceRate.toFixed(1)}%
- Overdue Fee Invoices: ${overdueInvoices}
- Total Outstanding Fees: $${totalOutstanding.toFixed(2)}
- Behavior Incidents (Demerits/Detentions): ${behaviorIssues}
- Students with Declining Performance: ${decliningStudents}

Generate 4-5 specific, actionable insights with priorities. Focus on:
1. Academic performance trends
2. Attendance patterns
3. Financial health
4. Student wellbeing/behavior
5. Predictive alerts

For each insight, provide:
- category: "academic", "attendance", "financial", "behavior", or "prediction"
- priority: "high", "medium", or "low"
- title: Short headline
- description: 2-3 sentence explanation
- recommendation: Specific action to take
- metric: Key number or percentage`,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                  metric: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'academic': return <BookOpen className="w-4 h-4" />;
      case 'attendance': return <Users className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'behavior': return <AlertTriangle className="w-4 h-4" />;
      case 'prediction': return <Target className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'attendance': return 'bg-green-100 text-green-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'behavior': return 'bg-red-100 text-red-800';
      case 'prediction': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Brain className="w-5 h-5 text-indigo-600" />
            AI-Powered Insights
          </CardTitle>
          <Button 
            onClick={generateInsights} 
            size="sm" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            <p className="text-indigo-700 font-medium">Generate live AI insights</p>
            <p className="text-sm text-indigo-500 mt-1">This widget analyzes your current school data and creates fresh recommendations on demand.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.summary && (
              <p className="text-sm text-indigo-700 bg-white/50 p-3 rounded-lg mb-4">
                {insights.summary}
              </p>
            )}
            
            <AnimatePresence>
              {insights.insights?.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-lg border border-indigo-100 overflow-hidden"
                >
                  <div 
                    className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-full min-h-[40px] rounded-full ${getPriorityColor(insight.priority)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getCategoryColor(insight.category)} variant="secondary">
                            {getCategoryIcon(insight.category)}
                            <span className="ml-1 capitalize">{insight.category}</span>
                          </Badge>
                          {insight.metric && (
                            <span className="text-sm font-bold text-indigo-600">{insight.metric}</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{insight.title}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedInsight === idx ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {expandedInsight === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-gray-100"
                    >
                      <p className="text-sm text-gray-600 mt-3">{insight.description}</p>
                      <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                        <p className="text-xs font-semibold text-indigo-700 uppercase mb-1">Recommendation</p>
                        <p className="text-sm text-indigo-900">{insight.recommendation}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}