import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if demo users already exist
    const existingUsers = await base44.asServiceRole.entities.User.list();
    const demoTeacherExists = existingUsers.some(u => u.email === 'teacher@demo.com');
    const demoStudentExists = existingUsers.some(u => u.email === 'student@demo.com');

    let demoTeacherUserId, demoStudentUserId;

    // Create demo users if they don't exist
    if (!demoTeacherExists) {
      await base44.users.inviteUser('teacher@demo.com', 'admin');
      const users = await base44.asServiceRole.entities.User.list();
      const teacherUser = users.find(u => u.email === 'teacher@demo.com');
      demoTeacherUserId = teacherUser?.id;
      
      // Update user profile
      if (demoTeacherUserId) {
        await base44.asServiceRole.entities.User.update(demoTeacherUserId, {
          full_name: 'Demo Teacher',
          profile_completed: true,
          is_activated: true,
          user_types: ['teacher'],
        });
      }
    } else {
      const users = await base44.asServiceRole.entities.User.list();
      const teacherUser = users.find(u => u.email === 'teacher@demo.com');
      demoTeacherUserId = teacherUser?.id;
    }

    if (!demoStudentExists) {
      await base44.users.inviteUser('student@demo.com', 'user');
      const users = await base44.asServiceRole.entities.User.list();
      const studentUser = users.find(u => u.email === 'student@demo.com');
      demoStudentUserId = studentUser?.id;
      
      if (demoStudentUserId) {
        await base44.asServiceRole.entities.User.update(demoStudentUserId, {
          full_name: 'Demo Student',
          profile_completed: true,
          is_activated: true,
          user_types: ['student'],
        });
      }
    } else {
      const users = await base44.asServiceRole.entities.User.list();
      const studentUser = users.find(u => u.email === 'student@demo.com');
      demoStudentUserId = studentUser?.id;
    }

    // Create Academic Session
    const session = await base44.asServiceRole.entities.AcademicSession.create({
      session_name: '2025-2026',
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      is_current: true,
      status: 'Active',
    });

    // Create Term
    const term = await base44.asServiceRole.entities.Term.create({
      session_id: session.id,
      term_name: 'First Term',
      term_number: 1,
      start_date: '2025-09-01',
      end_date: '2025-12-20',
      is_current: true,
      status: 'Active',
    });

    // Create Teacher Profile
    const teacher = await base44.asServiceRole.entities.Teacher.create({
      user_id: demoTeacherUserId,
      first_name: 'Demo',
      last_name: 'Teacher',
      staff_id: 'TCH001',
      department: 'Mathematics',
      position: 'Senior Teacher',
      hire_date: '2020-01-15',
      status: 'Active',
      qualifications: 'BSc Mathematics, MEd Education',
    });

    // Create Student Profile
    const student = await base44.asServiceRole.entities.Student.create({
      user_id: demoStudentUserId,
      first_name: 'Demo',
      last_name: 'Student',
      student_id_number: 'STU001',
      date_of_birth: '2010-05-15',
      gender: 'Male',
      admission_date: '2024-09-01',
      grade_level: '10',
      status: 'Active',
    });

    // Create Course
    const course = await base44.asServiceRole.entities.Course.create({
      course_code: 'MATH101',
      course_name: 'Mathematics',
      description: 'General Mathematics for Grade 10',
      department: 'Mathematics',
      grade_level: '10',
      credits: 3,
      status: 'Active',
    });

    // Create Class Arm
    const classArm = await base44.asServiceRole.entities.ClassArm.create({
      name: 'Grade 10A',
      grade_level: '10',
      capacity: 30,
      class_teacher_id: teacher.id,
      class_teacher_name: 'Demo Teacher',
      academic_year: '2025-2026',
      status: 'Active',
    });

    // Create Class
    const classEntity = await base44.asServiceRole.entities.Class.create({
      class_name: 'Mathematics - Grade 10A',
      course_id: course.id,
      teacher_id: teacher.id,
      teacher_name: 'Demo Teacher',
      schedule: 'Mon/Wed/Fri 9:00-10:00',
      room: 'Room 101',
      academic_year: '2025-2026',
      term: 'Fall',
      max_students: 30,
      status: 'Active',
    });

    // Create Enrollment
    await base44.asServiceRole.entities.Enrollment.create({
      student_id: student.id,
      student_name: 'Demo Student',
      class_id: classEntity.id,
      class_name: 'Mathematics - Grade 10A',
      enrollment_date: '2025-09-01',
      status: 'Enrolled',
    });

    // Create Timetable entries
    const timetableSlots = [
      { day: 'Monday', period: 1, start: '09:00', end: '10:00', subject: 'Mathematics', room: 'Room 101' },
      { day: 'Monday', period: 2, start: '10:15', end: '11:15', subject: 'Physics', room: 'Lab 201' },
      { day: 'Wednesday', period: 1, start: '09:00', end: '10:00', subject: 'Mathematics', room: 'Room 101' },
      { day: 'Wednesday', period: 3, start: '13:00', end: '14:00', subject: 'Chemistry', room: 'Lab 202' },
      { day: 'Friday', period: 1, start: '09:00', end: '10:00', subject: 'Mathematics', room: 'Room 101' },
      { day: 'Friday', period: 2, start: '10:15', end: '11:15', subject: 'Biology', room: 'Lab 203' },
    ];

    for (const slot of timetableSlots) {
      await base44.asServiceRole.entities.Timetable.create({
        class_arm_id: classArm.id,
        class_arm_name: classArm.name,
        day_of_week: slot.day,
        period_number: slot.period,
        start_time: slot.start,
        end_time: slot.end,
        subject: slot.subject,
        teacher_id: teacher.id,
        teacher_name: 'Demo Teacher',
        room: slot.room,
        session_id: session.id,
        term_id: term.id,
      });
    }

    // Create 30+ Questions in Question Bank
    const questions = [
      // Mathematics MCQ
      { text: 'What is 15 + 27?', type: 'Multiple Choice', options: ['40', '42', '44', '45'], correct: '42', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'Solve for x: 2x + 5 = 13', type: 'Multiple Choice', options: ['2', '3', '4', '5'], correct: '4', subject: 'Mathematics', difficulty: 'Medium', points: 3 },
      { text: 'What is the square root of 144?', type: 'Multiple Choice', options: ['10', '11', '12', '13'], correct: '12', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'What is 25% of 200?', type: 'Multiple Choice', options: ['25', '50', '75', '100'], correct: '50', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'If a triangle has angles 60°, 60°, what is the third angle?', type: 'Multiple Choice', options: ['30°', '45°', '60°', '90°'], correct: '60°', subject: 'Mathematics', difficulty: 'Medium', points: 3 },
      
      // Science MCQ
      { text: 'What is the chemical symbol for water?', type: 'Multiple Choice', options: ['H2O', 'CO2', 'O2', 'N2'], correct: 'H2O', subject: 'Science', difficulty: 'Easy', points: 2 },
      { text: 'What is the speed of light?', type: 'Multiple Choice', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correct: '300,000 km/s', subject: 'Physics', difficulty: 'Medium', points: 3 },
      { text: 'What is the atomic number of Carbon?', type: 'Multiple Choice', options: ['4', '6', '8', '12'], correct: '6', subject: 'Chemistry', difficulty: 'Medium', points: 3 },
      { text: 'What is the powerhouse of the cell?', type: 'Multiple Choice', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], correct: 'Mitochondria', subject: 'Biology', difficulty: 'Easy', points: 2 },
      
      // True/False
      { text: 'The Earth revolves around the Sun.', type: 'True/False', options: ['True', 'False'], correct: 'True', subject: 'Science', difficulty: 'Easy', points: 1, explanation: 'Earth orbits the Sun in approximately 365.25 days.' },
      { text: 'Water boils at 50°C at sea level.', type: 'True/False', options: ['True', 'False'], correct: 'False', subject: 'Physics', difficulty: 'Easy', points: 1, explanation: 'Water boils at 100°C at sea level.' },
      { text: 'Pythagoras theorem only applies to right triangles.', type: 'True/False', options: ['True', 'False'], correct: 'True', subject: 'Mathematics', difficulty: 'Medium', points: 1 },
      { text: 'Photosynthesis occurs in animal cells.', type: 'True/False', options: ['True', 'False'], correct: 'False', subject: 'Biology', difficulty: 'Easy', points: 1 },
      { text: 'The square of 5 is 25.', type: 'True/False', options: ['True', 'False'], correct: 'True', subject: 'Mathematics', difficulty: 'Easy', points: 1 },
      { text: 'Gold is a non-metal.', type: 'True/False', options: ['True', 'False'], correct: 'False', subject: 'Chemistry', difficulty: 'Easy', points: 1 },
      
      // Essay Questions
      { text: 'Explain the process of photosynthesis and its importance to life on Earth.', type: 'Essay', options: '[]', correct: 'Photosynthesis converts light energy into chemical energy...', subject: 'Biology', difficulty: 'Hard', points: 10, model_answer: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and glucose. It occurs in chloroplasts and is essential for oxygen production and the food chain.' },
      { text: 'Describe Newton\'s three laws of motion with examples.', type: 'Essay', options: '[]', correct: 'First law: inertia, Second law: F=ma, Third law: action-reaction', subject: 'Physics', difficulty: 'Hard', points: 10 },
      { text: 'Discuss the importance of the water cycle to our ecosystem.', type: 'Essay', options: '[]', correct: 'Water cycle regulates climate, provides fresh water...', subject: 'Science', difficulty: 'Medium', points: 8 },
      { text: 'Explain the concept of prime numbers and provide examples.', type: 'Theory', options: '[]', correct: 'Prime numbers are divisible only by 1 and themselves...', subject: 'Mathematics', difficulty: 'Medium', points: 5 },
      
      // More MCQ variations
      { text: 'What is 7 × 8?', type: 'Multiple Choice', options: ['54', '56', '58', '60'], correct: '56', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
      { text: 'What is the capital of France?', type: 'Multiple Choice', options: ['London', 'Berlin', 'Paris', 'Rome'], correct: 'Paris', subject: 'Geography', difficulty: 'Easy', points: 2 },
      { text: 'Who wrote Romeo and Juliet?', type: 'Multiple Choice', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 'William Shakespeare', subject: 'Literature', difficulty: 'Easy', points: 2 },
      { text: 'What is the longest river in the world?', type: 'Multiple Choice', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correct: 'Nile', subject: 'Geography', difficulty: 'Medium', points: 3 },
      { text: 'What year did World War II end?', type: 'Multiple Choice', options: ['1943', '1944', '1945', '1946'], correct: '1945', subject: 'History', difficulty: 'Medium', points: 3 },
      
      // Advanced questions
      { text: 'Solve the quadratic equation: x² - 5x + 6 = 0', type: 'Multiple Choice', options: ['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = 0, 5'], correct: 'x = 2, 3', subject: 'Mathematics', difficulty: 'Hard', points: 5 },
      { text: 'What is the derivative of x²?', type: 'Multiple Choice', options: ['x', '2x', 'x²', '2x²'], correct: '2x', subject: 'Mathematics', difficulty: 'Hard', points: 5 },
      { text: 'Which planet is closest to the Sun?', type: 'Multiple Choice', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 'Mercury', subject: 'Science', difficulty: 'Easy', points: 2 },
      { text: 'What is the chemical formula for table salt?', type: 'Multiple Choice', options: ['NaCl', 'KCl', 'CaCl2', 'MgCl2'], correct: 'NaCl', subject: 'Chemistry', difficulty: 'Easy', points: 2 },
      { text: 'What is the boiling point of water in Fahrenheit?', type: 'Multiple Choice', options: ['100°F', '150°F', '212°F', '273°F'], correct: '212°F', subject: 'Physics', difficulty: 'Medium', points: 3 },
      { text: 'How many continents are there?', type: 'Multiple Choice', options: ['5', '6', '7', '8'], correct: '7', subject: 'Geography', difficulty: 'Easy', points: 2 },
      { text: 'What is the smallest prime number?', type: 'Multiple Choice', options: ['0', '1', '2', '3'], correct: '2', subject: 'Mathematics', difficulty: 'Easy', points: 2 },
    ];

    const createdQuestions = [];
    for (const q of questions) {
      const question = await base44.asServiceRole.entities.QuestionBank.create({
        question_text: q.text,
        question_type: q.type,
        options: JSON.stringify(q.options),
        correct_answer: q.correct,
        correct_answers: [q.correct],
        subject: q.subject,
        difficulty: q.difficulty,
        points: q.points,
        explanation: q.explanation || '',
        model_answer: q.model_answer || '',
        status: 'Active',
      });
      createdQuestions.push(question);
    }

    // Create 10 Assignments with mixed statuses
    const assignmentTypes = ['Homework', 'Quiz', 'Essay', 'Project', 'Lab'];
    const assignmentStatuses = ['Published', 'Published', 'Published', 'Published', 'Published', 'Draft', 'Draft', 'Closed'];
    
    const assignments = [];
    for (let i = 0; i < 10; i++) {
      const daysFromNow = i < 5 ? i + 2 : -(i - 5);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysFromNow);
      
      const assignment = await base44.asServiceRole.entities.Assignment.create({
        title: `${assignmentTypes[i % assignmentTypes.length]} ${i + 1}: ${i < 3 ? 'Algebra Basics' : i < 6 ? 'Geometry Concepts' : 'Calculus Introduction'}`,
        description: `<p>Complete the ${assignmentTypes[i % assignmentTypes.length].toLowerCase()} on the assigned topic. Show all your work.</p>`,
        class_id: classEntity.id,
        class_name: classEntity.class_name,
        teacher_id: teacher.id,
        due_date: dueDate.toISOString(),
        max_points: i < 3 ? 20 : i < 6 ? 30 : 50,
        type: assignmentTypes[i % assignmentTypes.length],
        status: assignmentStatuses[i],
        submission_type: 'Both',
      });
      assignments.push(assignment);

      // Link 3-5 questions to Quiz assignments
      if (assignment.type === 'Quiz' && assignment.status === 'Published') {
        const questionsToAdd = createdQuestions.slice(i * 3, i * 3 + 5);
        for (let j = 0; j < questionsToAdd.length; j++) {
          await base44.asServiceRole.entities.AssignmentQuestion.create({
            assignment_id: assignment.id,
            question_bank_id: questionsToAdd[j].id,
            order: j + 1,
          });
        }
      }
    }

    // Create Submissions for published assignments
    const publishedAssignments = assignments.filter(a => a.status === 'Published');
    for (let i = 0; i < Math.min(publishedAssignments.length, 6); i++) {
      const assignment = publishedAssignments[i];
      const submissionStatuses = ['Submitted', 'Submitted', 'Graded', 'Graded', 'Graded', 'Missing'];
      const status = submissionStatuses[i];
      
      if (status !== 'Missing') {
        const submission = await base44.asServiceRole.entities.Submission.create({
          assignment_id: assignment.id,
          student_id: student.id,
          student_name: 'Demo Student',
          submitted_date: new Date().toISOString(),
          content: status === 'Submitted' ? 'This is my submission for the assignment.' : '',
          status: status,
          is_late: i === 5,
        });

        if (status === 'Graded') {
          const grade = Math.floor(Math.random() * 10) + (assignment.max_points * 0.6);
          await base44.asServiceRole.entities.Submission.update(submission.id, {
            grade: grade,
            feedback: 'Good work! Keep it up.',
          });
        }
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Demo data seeded successfully!',
      data: {
        session: session.id,
        teacher: teacher.id,
        student: student.id,
        class: classEntity.id,
        questions: createdQuestions.length,
        assignments: assignments.length,
        timetable: timetableSlots.length,
      }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});