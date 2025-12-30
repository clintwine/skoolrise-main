import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  FileText, 
  MessageSquare,
  ShoppingCart,
  CheckCircle,
  XCircle,
  ClipboardList,
  TrendingUp,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ParentStudentView() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

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
    queryKey: ['parent-students', user?.linked_parent_id],
    queryFn: async () => {
      if (!user?.linked_parent_id) return [];
      return await base44.entities.Student.filter({ parent_id: user.linked_parent_id });
    },
    enabled: !!user?.linked_parent_id,
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Fetch enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', selectedStudentId],
    queryFn: async () => {
      const allEnrollments = await base44.entities.Enrollment.list();
      return allEnrollments.filter(e => e.student_id === selectedStudentId);
    },
    enabled: !!selectedStudentId,
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['student-classes', enrollments],
    queryFn: async () => {
      if (enrollments.length === 0) return [];
      const classIds = enrollments.map(e => e.class_id);
      const allClasses = await base44.entities.Class.list();
      return allClasses.filter(c => classIds.includes(c.id));
    },
    enabled: enrollments.length > 0,
  });

  // Fetch attendance
  const { data: attendance = [] } = useQuery({
    queryKey: ['student-attendance', selectedStudentId],
    queryFn: async () => {
      const allAttendance = await base44.entities.Attendance.list();
      return allAttendance.filter(a => a.student_id === selectedStudentId);
    },
    enabled: !!selectedStudentId,
  });

  // Fetch report cards
  const { data: reportCards = [] } = useQuery({
    queryKey: ['student-reports', selectedStudentId],
    queryFn: async () => {
      const allReports = await base44.entities.ReportCard.list();
      return allReports.filter(r => r.student_id === selectedStudentId);
    },
    enabled: !!selectedStudentId,
  });

  // Fetch assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['student-assignments', classes],
    queryFn: async () => {
      if (classes.length === 0) return [];
      const classIds = classes.map(c => c.id);
      const allAssignments = await base44.entities.Assignment.list();
      return allAssignments.filter(a => classIds.includes(a.class_id));
    },
    enabled: classes.length > 0,
  });

  // Fetch submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ['student-submissions', selectedStudentId],
    queryFn: async () => {
      const allSubmissions = await base44.entities.Submission.list();
      return allSubmissions.filter(s => s.student_id === selectedStudentId);
    },
    enabled: !!selectedStudentId,
  });

  // Fetch book catalog for textbooks
  const { data: bookCatalog = [] } = useQuery({
    queryKey: ['book-catalog'],
    queryFn: () => base44.entities.BookCatalog.list(),
  });

  // Fetch book inventory
  const { data: bookInventory = [] } = useQuery({
    queryKey: ['book-inventory'],
    queryFn: () => base44.entities.BookInventory.list(),
  });

  // Filter textbooks relevant to student's grade
  const relevantTextbooks = bookCatalog.filter(book => 
    book.grade_level === selectedStudent?.grade_level
  );

  const sendMessageMutation = useMutation({
    mutationFn: async ({ teacherId, message }) => {
      return await base44.integrations.Core.SendEmail({
        to: messageRecipient.email,
        subject: `Message from ${user.full_name} (Parent)`,
        body: `
          <h3>Message from Parent: ${user.full_name}</h3>
          <p><strong>Regarding Student:</strong> ${selectedStudent?.first_name} ${selectedStudent?.last_name}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
      });
    },
    onSuccess: () => {
      setIsMessageOpen(false);
      setMessageText('');
      alert('Message sent successfully!');
    },
  });

  const handleAddToCart = (book) => {
    const inventory = bookInventory.find(inv => inv.catalog_id === book.id);
    if (!inventory || inventory.current_stock <= 0) {
      alert('This book is currently out of stock');
      return;
    }
    
    const existingItem = cart.find(item => item.id === book.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === book.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...book, quantity: 1, inventory }]);
    }
  };

  const handleRemoveFromCart = (bookId) => {
    setCart(cart.filter(item => item.id !== bookId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.inventory.retail_price * item.quantity), 0);
    
    // Create book sales for each item
    for (const item of cart) {
      await base44.entities.BookSale.create({
        transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        student_id: selectedStudentId,
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        item_id: item.inventory.id,
        item_name: item.title,
        quantity_sold: item.quantity,
        unit_price: item.inventory.retail_price,
        cost_price: item.inventory.cost_price,
        total_amount: item.inventory.retail_price * item.quantity,
        total_profit: (item.inventory.retail_price - item.inventory.cost_price) * item.quantity,
        sale_date: new Date().toISOString(),
        payment_method: 'Student Account',
        status: 'Completed'
      });
      
      // Update inventory
      await base44.entities.BookInventory.update(item.inventory.id, {
        current_stock: item.inventory.current_stock - item.quantity
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['book-inventory'] });
    setCart([]);
    setIsCartOpen(false);
    alert(`Purchase successful! Total: $${totalAmount.toFixed(2)}`);
  };

  // Calculate stats
  const totalClasses = classes.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const attendanceRate = attendance.length > 0 ? ((presentCount / attendance.length) * 100).toFixed(1) : 0;
  const submittedAssignments = submissions.length;
  const gradedAssignments = submissions.filter(s => s.status === 'Graded').length;

  const cartTotal = cart.reduce((sum, item) => sum + (item.inventory.retail_price * item.quantity), 0);

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Children Linked</h2>
            <p className="text-gray-600 mb-6">You don't have any children linked to your account yet.</p>
            <Button 
              onClick={() => window.location.href = createPageUrl('ParentLinkingRequests')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Link New Student
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Child Selection */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Information</h1>
          <p className="text-gray-600 mt-1">View academic progress and manage textbooks</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - Grade {student.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCartOpen(true)} variant="outline" className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Student Overview Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
              <p className="text-blue-100">Student ID: {selectedStudent.student_id_number} | Grade: {selectedStudent.grade_level}</p>
            </div>
            <Badge className={selectedStudent.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
              {selectedStudent.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enrolled Classes</p>
                <p className="text-2xl font-bold text-blue-600">{totalClasses}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-600">{attendanceRate}%</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-purple-600">{submittedAssignments}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Report Cards</p>
                <p className="text-2xl font-bold text-orange-600">{reportCards.length}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="grades">Grades & Reports</TabsTrigger>
          <TabsTrigger value="textbooks">Textbooks</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.class_name}</h3>
                        <p className="text-sm text-gray-600">Teacher: {cls.teacher_name}</p>
                        <p className="text-sm text-gray-600">Schedule: {cls.schedule}</p>
                        <p className="text-sm text-gray-600">Room: {cls.room}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{cls.term}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendance.slice(0, 20).map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{record.class_name || 'Session Attendance'}</p>
                    </div>
                    <Badge className={
                      record.status === 'Present' ? 'bg-green-100 text-green-800' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                      record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments & Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const submission = submissions.find(s => s.assignment_id === assignment.id);
                  return (
                    <div key={assignment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-600">{assignment.class_name}</p>
                          <p className="text-sm text-gray-600">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                          {submission && submission.grade && (
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              Grade: {submission.grade}/{assignment.max_points}
                            </p>
                          )}
                        </div>
                        <Badge className={
                          submission?.status === 'Graded' ? 'bg-green-100 text-green-800' :
                          submission?.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {submission?.status || 'Not Submitted'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportCards.map((report) => (
                  <div key={report.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.term_name} - {report.session_name}</h3>
                        <p className="text-sm text-gray-600">Average Score: {report.average_score}%</p>
                        <p className="text-sm text-gray-600">Position: {report.position}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="textbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Textbooks - Grade {selectedStudent.grade_level}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relevantTextbooks.map((book) => {
                  const inventory = bookInventory.find(inv => inv.catalog_id === book.id);
                  const inStock = inventory && inventory.current_stock > 0;
                  return (
                    <div key={book.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{book.title}</h3>
                          <p className="text-sm text-gray-600">Author: {book.author}</p>
                          <p className="text-sm text-gray-600">Subject: {book.subject}</p>
                          <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
                          {inventory && (
                            <p className="text-lg font-bold text-blue-600 mt-2">
                              ${inventory.retail_price}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {inStock ? `${inventory.current_stock} in stock` : 'Out of stock'}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleAddToCart(book)}
                          disabled={!inStock}
                          size="sm"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teachers & Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.teacher_name}</h3>
                        <p className="text-sm text-gray-600">{cls.class_name}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          const teachers = await base44.entities.Teacher.list();
                          const teacher = teachers.find(t => t.id === cls.teacher_id);
                          if (teacher) {
                            setMessageRecipient(teacher);
                            setIsMessageOpen(true);
                          }
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shopping Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          ${(item.inventory.retail_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-semibold">Total:</p>
                    <p className="text-2xl font-bold text-blue-600">${cartTotal.toFixed(2)}</p>
                  </div>
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Teacher Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Send Message to {messageRecipient?.first_name} {messageRecipient?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message</Label>
              <Textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => sendMessageMutation.mutate({ message: messageText })}
                disabled={!messageText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}