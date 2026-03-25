import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Step 1: Delete all existing data
    const entitiesToClear = [
      'Submission', 'AssignmentQuestion', 'Assignment', 'QuestionBank',
      'Timetable', 'Enrollment', 'Attendance', 'Behavior', 'ReportCard',
      'FeeInvoice', 'Payment', 'FeeReminder', 'Expense', 'Salary',
      'Student', 'Parent', 'Teacher', 'Vendor',
      'Class', 'ClassArm', 'Course', 'Subject',
      'Term', 'AcademicSession', 'GradingScale',
      'AuditLog', 'AnalyticsEvent', 'CachedData', 'ScheduledReport',
      'Notification', 'Message', 'MessageThread'
    ];

    for (const entityName of entitiesToClear) {
      try {
        const items = await base44.asServiceRole.entities[entityName].list();
        for (const item of items) {
          await base44.asServiceRole.entities[entityName].delete(item.id);
        }
      } catch (e) {
        console.log(`Skipping ${entityName}: ${e.message}`);
      }
    }

    // Step 2: Create School Info
    const schools = await base44.asServiceRole.entities.School.list();
    let school = schools[0];
    if (!school) {
      school = await base44.asServiceRole.entities.School.create({
        school_name: 'SkoolRise Academy',
        school_code: 'SKR001',
        address: '123 Education Lane, Knowledge City',
        phone: '+1 234 567 8900',
        email: 'info@skoolrise.com',
        website: 'https://skoolrise.com',
        motto: 'Excellence in Education',
        principal_name: 'Dr. Sarah Johnson',
        currency: 'USD',
      });
    }

    // Step 3: Create Academic Session and Terms
    const session = await base44.asServiceRole.entities.AcademicSession.create({
      session_name: '2025-2026',
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      is_current: true,
      status: 'Active',
    });

    const term1 = await base44.asServiceRole.entities.Term.create({
      session_id: session.id,
      term_name: 'First Term',
      term_number: 1,
      start_date: '2025-09-01',
      end_date: '2025-12-20',
      is_current: true,
      status: 'Active',
    });

    // Step 4: Create Subjects
    const subjectsData = [
      { subject_name: 'Mathematics', subject_code: 'MATH', department: 'Sciences', is_core: true },
      { subject_name: 'English Language', subject_code: 'ENG', department: 'Languages', is_core: true },
      { subject_name: 'Physics', subject_code: 'PHY', department: 'Sciences', is_core: true },
      { subject_name: 'Chemistry', subject_code: 'CHEM', department: 'Sciences', is_core: true },
      { subject_name: 'Biology', subject_code: 'BIO', department: 'Sciences', is_core: true },
      { subject_name: 'History', subject_code: 'HIST', department: 'Arts', is_core: false },
      { subject_name: 'Geography', subject_code: 'GEO', department: 'Arts', is_core: false },
      { subject_name: 'Computer Science', subject_code: 'CS', department: 'Technology', is_core: false },
    ];

    const subjects = [];
    for (const s of subjectsData) {
      const subject = await base44.asServiceRole.entities.Subject.create({ ...s, status: 'Active' });
      subjects.push(subject);
    }

    // Step 5: Create Grading Scale
    const grades = [
      { grade: 'A', min_score: 90, max_score: 100, grade_point: 4.0, remark: 'Excellent' },
      { grade: 'B', min_score: 80, max_score: 89, grade_point: 3.0, remark: 'Very Good' },
      { grade: 'C', min_score: 70, max_score: 79, grade_point: 2.0, remark: 'Good' },
      { grade: 'D', min_score: 60, max_score: 69, grade_point: 1.0, remark: 'Pass' },
      { grade: 'F', min_score: 0, max_score: 59, grade_point: 0.0, remark: 'Fail' },
    ];

    for (const g of grades) {
      await base44.asServiceRole.entities.GradingScale.create({ ...g, scale_name: 'Standard', is_active: true });
    }

    // Step 6: Get or create demo users
    const existingUsers = await base44.asServiceRole.entities.User.list();
    
    // Find or create teacher user
    let teacherUser = existingUsers.find(u => u.email === 'teacher@demo.com');
    if (!teacherUser) {
      await base44.users.inviteUser('teacher@demo.com', 'user');
      const users = await base44.asServiceRole.entities.User.list();
      teacherUser = users.find(u => u.email === 'teacher@demo.com');
    }
    if (teacherUser) {
      await base44.asServiceRole.entities.User.update(teacherUser.id, {
        full_name: 'John Smith',
        title: 'Mr',
        profile_completed: true,
        is_activated: true,
        user_type: 'teacher',
      });
    }

    // Find or create parent user
    let parentUser = existingUsers.find(u => u.email === 'parent@demo.com');
    if (!parentUser) {
      await base44.users.inviteUser('parent@demo.com', 'user');
      const users = await base44.asServiceRole.entities.User.list();
      parentUser = users.find(u => u.email === 'parent@demo.com');
    }
    if (parentUser) {
      await base44.asServiceRole.entities.User.update(parentUser.id, {
        full_name: 'Mary Johnson',
        title: 'Mrs',
        profile_completed: true,
        is_activated: true,
        user_type: 'parent',
      });
    }

    // Find or create student user
    let studentUser = existingUsers.find(u => u.email === 'student@demo.com');
    if (!studentUser) {
      await base44.users.inviteUser('student@demo.com', 'user');
      const users = await base44.asServiceRole.entities.User.list();
      studentUser = users.find(u => u.email === 'student@demo.com');
    }
    if (studentUser) {
      await base44.asServiceRole.entities.User.update(studentUser.id, {
        full_name: 'James Johnson',
        title: 'Mr',
        profile_completed: true,
        is_activated: true,
        user_type: 'student',
      });
    }

    // Step 7: Create Teacher Profiles
    const teachersData = [
      { first_name: 'John', last_name: 'Smith', staff_id: 'TCH001', department: 'Mathematics', position: 'Head of Department', user_id: teacherUser?.id },
      { first_name: 'Emily', last_name: 'Davis', staff_id: 'TCH002', department: 'Sciences', position: 'Senior Teacher' },
      { first_name: 'Michael', last_name: 'Brown', staff_id: 'TCH003', department: 'Languages', position: 'Teacher' },
      { first_name: 'Sarah', last_name: 'Wilson', staff_id: 'TCH004', department: 'Arts', position: 'Teacher' },
    ];

    const teachers = [];
    for (const t of teachersData) {
      const teacher = await base44.asServiceRole.entities.Teacher.create({
        ...t,
        hire_date: '2020-01-15',
        status: 'Active',
        qualifications: 'MSc, B.Ed',
        phone: '+1 555 ' + Math.floor(Math.random() * 9000000 + 1000000),
      });
      teachers.push(teacher);
    }

    // Step 8: Create Parent Profile
    const parent = await base44.asServiceRole.entities.Parent.create({
      user_id: parentUser?.id,
      first_name: 'Mary',
      last_name: 'Johnson',
      phone: '+1 555 1234567',
      address: '456 Family Street, Hometown',
    });

    // Step 9: Create Class Arms
    const classArmsData = [
      { arm_name: 'A', grade_level: '10', class_teacher_id: teachers[0].id, max_students: 35 },
      { arm_name: 'B', grade_level: '10', class_teacher_id: teachers[1].id, max_students: 35 },
      { arm_name: 'A', grade_level: '11', class_teacher_id: teachers[2].id, max_students: 30 },
      { arm_name: 'A', grade_level: '12', class_teacher_id: teachers[3].id, max_students: 30 },
    ];

    const classArms = [];
    for (const ca of classArmsData) {
      const teacher = teachers.find(t => t.id === ca.class_teacher_id);
      const classArm = await base44.asServiceRole.entities.ClassArm.create({
        ...ca,
        class_teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
        room: `Room ${ca.grade_level}${ca.arm_name}`,
        status: 'Active',
      });
      classArms.push(classArm);
    }

    // Step 10: Create Students
    const studentsData = [
      { first_name: 'James', last_name: 'Johnson', grade_level: '10', gender: 'Male', user_id: studentUser?.id },
      { first_name: 'Emma', last_name: 'Williams', grade_level: '10', gender: 'Female' },
      { first_name: 'Oliver', last_name: 'Brown', grade_level: '10', gender: 'Male' },
      { first_name: 'Sophia', last_name: 'Miller', grade_level: '10', gender: 'Female' },
      { first_name: 'Liam', last_name: 'Davis', grade_level: '11', gender: 'Male' },
      { first_name: 'Ava', last_name: 'Garcia', grade_level: '11', gender: 'Female' },
      { first_name: 'Noah', last_name: 'Martinez', grade_level: '12', gender: 'Male' },
      { first_name: 'Isabella', last_name: 'Rodriguez', grade_level: '12', gender: 'Female' },
    ];

    const students = [];
    for (let i = 0; i < studentsData.length; i++) {
      const s = studentsData[i];
      const student = await base44.asServiceRole.entities.Student.create({
        ...s,
        student_id_number: `STU${String(i + 1).padStart(3, '0')}`,
        date_of_birth: `200${8 + Math.floor(i / 2)}-0${(i % 12) + 1}-${10 + i}`,
        admission_date: '2024-09-01',
        status: 'Active',
        parent_id: i === 0 ? parent.id : null,
        parent_email: i === 0 ? 'parent@demo.com' : null,
      });
      students.push(student);
    }

    // Update parent with linked student IDs
    if (parentUser) {
      await base44.asServiceRole.entities.User.update(parentUser.id, {
        parent_of_student_ids: students[0].id,
      });
    }

    // Step 11: Create Enrollments
    for (const student of students) {
      const classArm = classArms.find(ca => ca.grade_level === student.grade_level);
      if (classArm) {
        await base44.asServiceRole.entities.Enrollment.create({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          class_arm_id: classArm.id,
          class_name: `Grade ${classArm.grade_level} - ${classArm.arm_name}`,
          enrollment_date: '2025-09-01',
          session_id: session.id,
          status: 'Enrolled',
        });
      }
    }

    // Step 12: Create Timetable
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [
      { period: 1, start: '08:00', end: '08:45' },
      { period: 2, start: '08:50', end: '09:35' },
      { period: 3, start: '09:40', end: '10:25' },
      { period: 4, start: '10:45', end: '11:30' },
      { period: 5, start: '11:35', end: '12:20' },
      { period: 6, start: '13:00', end: '13:45' },
      { period: 7, start: '13:50', end: '14:35' },
    ];

    for (const classArm of classArms.slice(0, 2)) {
      for (const day of days) {
        for (let i = 0; i < Math.min(5, periods.length); i++) {
          const p = periods[i];
          const subjectIdx = (days.indexOf(day) + i) % subjects.length;
          const teacherIdx = i % teachers.length;
          
          await base44.asServiceRole.entities.Timetable.create({
            class_arm_id: classArm.id,
            class_arm_name: `Grade ${classArm.grade_level} - ${classArm.arm_name}`,
            day_of_week: day,
            period_number: p.period,
            start_time: p.start,
            end_time: p.end,
            subject: subjects[subjectIdx].subject_name,
            teacher_id: teachers[teacherIdx].id,
            teacher_name: `${teachers[teacherIdx].first_name} ${teachers[teacherIdx].last_name}`,
            room: classArm.room,
            session_id: session.id,
            term_id: term1.id,
          });
        }
      }
    }

    // Step 13: Create Attendance Records (last 30 days)
    const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Absent'];
    for (let d = 0; d < 20; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      for (const student of students) {
        const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
        await base44.asServiceRole.entities.Attendance.create({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          date: date.toISOString().split('T')[0],
          status: status,
          type: 'School',
          marked_by: teachers[0].id,
          marked_by_name: `${teachers[0].first_name} ${teachers[0].last_name}`,
        });
      }
    }

    // Step 14: Create Fee Policies and Invoices
    const feePolicy = await base44.asServiceRole.entities.FeePolicy.create({
      name: 'Standard Tuition 2025-2026',
      description: 'Regular tuition fees for all students',
      amount: 5000,
      fee_type: 'Tuition',
      frequency: 'Term',
      applicable_grades: 'All',
      session_id: session.id,
      is_active: true,
    });

    for (const student of students) {
      const paid = Math.random() > 0.4;
      const partialPaid = !paid && Math.random() > 0.5;
      const amountPaid = paid ? 5000 : (partialPaid ? 2500 : 0);
      
      await base44.asServiceRole.entities.FeeInvoice.create({
        invoice_number: `INV-${session.id.slice(-4)}-${student.student_id_number}`,
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        session_id: session.id,
        term_id: term1.id,
        fee_policy_id: feePolicy.id,
        invoice_date: '2025-09-01',
        due_date: '2025-09-30',
        subtotal: 5000,
        total_amount: 5000,
        amount_paid: amountPaid,
        balance: 5000 - amountPaid,
        status: paid ? 'Paid' : (partialPaid ? 'Partially Paid' : (Math.random() > 0.5 ? 'Overdue' : 'Pending')),
        fee_items: JSON.stringify([{ name: 'Tuition Fee', amount: 5000 }]),
      });
    }

    // Step 15: Create Behavior Records
    const behaviorTypes = ['Merit', 'Merit', 'Merit', 'Demerit', 'Warning'];
    const behaviorCategories = ['Academic Excellence', 'Good Conduct', 'Leadership', 'Participation', 'Tardiness'];
    
    for (let i = 0; i < 15; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const type = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
      const category = behaviorCategories[Math.floor(Math.random() * behaviorCategories.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      await base44.asServiceRole.entities.Behavior.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        teacher_id: teachers[0].id,
        teacher_name: `${teachers[0].first_name} ${teachers[0].last_name}`,
        date: date.toISOString().split('T')[0],
        type: type,
        category: category,
        points: type === 'Merit' ? Math.floor(Math.random() * 5) + 1 : -(Math.floor(Math.random() * 3) + 1),
        description: `${type} for ${category.toLowerCase()}`,
      });
    }

    // Step 16: Create Question Bank
    const questionsData = [
      { text: 'What is 15 + 27?', type: 'Multiple Choice', options: ['40', '42', '44', '45'], correct: '42', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'Solve for x: 2x + 5 = 13', type: 'Multiple Choice', options: ['2', '3', '4', '5'], correct: '4', subject: 'Mathematics', difficulty: 'Medium', points: 3 },
      { text: 'What is the square root of 144?', type: 'Multiple Choice', options: ['10', '11', '12', '13'], correct: '12', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'What is 25% of 200?', type: 'Multiple Choice', options: ['25', '50', '75', '100'], correct: '50', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'What is the chemical symbol for water?', type: 'Multiple Choice', options: ['H2O', 'CO2', 'O2', 'N2'], correct: 'H2O', subject: 'Chemistry', difficulty: 'Easy', points: 2 },
      { text: 'What is the speed of light?', type: 'Multiple Choice', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correct: '300,000 km/s', subject: 'Physics', difficulty: 'Medium', points: 3 },
      { text: 'What is the powerhouse of the cell?', type: 'Multiple Choice', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], correct: 'Mitochondria', subject: 'Biology', difficulty: 'Easy', points: 2 },
      { text: 'The Earth revolves around the Sun.', type: 'True/False', options: ['True', 'False'], correct: 'True', subject: 'Physics', difficulty: 'Easy', points: 1 },
      { text: 'Water boils at 50°C at sea level.', type: 'True/False', options: ['True', 'False'], correct: 'False', subject: 'Physics', difficulty: 'Easy', points: 1 },
      { text: 'Explain the process of photosynthesis.', type: 'Essay', options: '[]', correct: 'Photosynthesis converts light energy...', subject: 'Biology', difficulty: 'Hard', points: 10 },
      { text: 'What is 7 × 8?', type: 'Multiple Choice', options: ['54', '56', '58', '60'], correct: '56', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'Who wrote Romeo and Juliet?', type: 'Multiple Choice', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 'William Shakespeare', subject: 'English Language', difficulty: 'Easy', points: 2 },
      { text: 'What year did World War II end?', type: 'Multiple Choice', options: ['1943', '1944', '1945', '1946'], correct: '1945', subject: 'History', difficulty: 'Medium', points: 3 },
      { text: 'What is the derivative of x²?', type: 'Multiple Choice', options: ['x', '2x', 'x²', '2x²'], correct: '2x', subject: 'Mathematics', difficulty: 'Hard', points: 5 },
      { text: 'Which planet is closest to the Sun?', type: 'Multiple Choice', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 'Mercury', subject: 'Physics', difficulty: 'Easy', points: 2 },
    ];

    const questions = [];
    for (const q of questionsData) {
      const question = await base44.asServiceRole.entities.QuestionBank.create({
        question_text: q.text,
        question_type: q.type,
        options: JSON.stringify(q.options),
        correct_answer: q.correct,
        subject: q.subject,
        difficulty: q.difficulty,
        points: q.points,
        status: 'Active',
      });
      questions.push(question);
    }

    // Step 17: Create Assignments
    const assignmentsData = [
      { title: 'Math Homework Week 1', type: 'Homework', status: 'Published', daysFromNow: 7 },
      { title: 'Physics Quiz Chapter 3', type: 'Quiz', status: 'Published', daysFromNow: 3 },
      { title: 'Biology Essay: Ecosystems', type: 'Essay', status: 'Published', daysFromNow: 14 },
      { title: 'Chemistry Lab Report', type: 'Lab', status: 'Draft', daysFromNow: 10 },
      { title: 'History Project: World War II', type: 'Project', status: 'Published', daysFromNow: 21 },
    ];

    const assignments = [];
    for (const a of assignmentsData) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + a.daysFromNow);
      
      const assignment = await base44.asServiceRole.entities.Assignment.create({
        title: a.title,
        description: `<p>Complete this ${a.type.toLowerCase()} assignment.</p>`,
        class_id: classArms[0].id,
        class_name: `Grade ${classArms[0].grade_level} - ${classArms[0].arm_name}`,
        teacher_id: teachers[0].id,
        due_date: dueDate.toISOString(),
        max_points: a.type === 'Quiz' ? 20 : a.type === 'Project' ? 50 : 30,
        type: a.type,
        status: a.status,
      });
      assignments.push(assignment);
    }

    // Step 18: Create Report Cards
    for (const student of students.slice(0, 4)) {
      const gradesArray = subjects.slice(0, 5).map(s => ({
        subject: s.subject_name,
        ca_score: Math.floor(Math.random() * 20) + 10,
        exam_score: Math.floor(Math.random() * 40) + 30,
        total: 0,
        grade: '',
      }));
      
      gradesArray.forEach(g => {
        g.total = g.ca_score + g.exam_score;
        g.grade = g.total >= 90 ? 'A' : g.total >= 80 ? 'B' : g.total >= 70 ? 'C' : g.total >= 60 ? 'D' : 'F';
      });
      
      const avgScore = gradesArray.reduce((sum, g) => sum + g.total, 0) / gradesArray.length;
      
      await base44.asServiceRole.entities.ReportCard.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        session_id: session.id,
        term_id: term1.id,
        class_id: classArms[0].id,
        grades: JSON.stringify(gradesArray),
        average_score: Math.round(avgScore),
        grade: avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : avgScore >= 60 ? 'D' : 'F',
        position: Math.floor(Math.random() * 8) + 1,
        teacher_comment: 'Good progress this term. Keep up the excellent work!',
        principal_comment: 'Well done. Continue to strive for excellence.',
        status: 'Published',
      });
    }

    // Step 19: Create Fee Reminders
    const overdueInvoices = await base44.asServiceRole.entities.FeeInvoice.filter({ status: 'Overdue' });
    for (const invoice of overdueInvoices.slice(0, 3)) {
      await base44.asServiceRole.entities.FeeReminder.create({
        invoice_id: invoice.id,
        student_id: invoice.student_id,
        student_name: invoice.student_name,
        reminder_type: 'Email',
        reminder_date: new Date().toISOString(),
        status: 'Sent',
        message: `Dear Parent, this is a reminder that the fee payment of $${invoice.balance} is overdue.`,
      });
    }

    return Response.json({ 
      success: true, 
      message: 'All data cleared and demo data seeded successfully!',
      data: {
        school: school.id,
        session: session.id,
        subjects: subjects.length,
        teachers: teachers.length,
        students: students.length,
        classArms: classArms.length,
        questions: questions.length,
        assignments: assignments.length,
      }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});