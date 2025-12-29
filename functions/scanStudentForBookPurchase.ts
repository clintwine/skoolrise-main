import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id, transaction_details, action } = await req.json();

    if (!student_id) {
      return Response.json({ error: 'student_id is required' }, { status: 400 });
    }

    // Fetch student details
    const students = await base44.entities.Student.filter({ id: student_id });
    if (students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = students[0];

    // If action is 'confirm', complete the purchase
    if (action === 'confirm' && transaction_details) {
      const { items, total_amount, payment_method } = transaction_details;

      // Create book sale record
      const saleRecord = await base44.entities.BookSale.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        items: JSON.stringify(items),
        total_amount: total_amount,
        payment_method: payment_method || 'Cash',
        sale_date: new Date().toISOString().split('T')[0],
        sale_time: new Date().toTimeString().split(' ')[0],
        status: 'Completed',
        processed_by_user_id: user.id,
        processed_by_name: user.full_name || user.email
      });

      // Update book inventory quantities
      for (const item of items) {
        const inventories = await base44.entities.BookInventory.filter({ 
          book_id: item.book_id 
        });
        
        if (inventories.length > 0) {
          const inventory = inventories[0];
          const newQuantity = (inventory.quantity_in_stock || 0) - (item.quantity || 1);
          
          await base44.entities.BookInventory.update(inventory.id, {
            quantity_in_stock: Math.max(0, newQuantity)
          });
        }
      }

      return Response.json({
        success: true,
        message: 'Purchase completed successfully',
        sale: saleRecord,
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          student_id: student.student_id_number
        }
      });
    }

    // Otherwise, just return student details for confirmation
    return Response.json({
      success: true,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        student_id: student.student_id_number,
        photo_url: student.photo_url,
        grade_level: student.grade_level,
        status: student.status
      }
    });

  } catch (error) {
    console.error('Error in scanStudentForBookPurchase:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});