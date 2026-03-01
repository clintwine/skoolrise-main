import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function checks for overdue fees and sends notifications to parents
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    
    // Get invoices that are overdue or unpaid past due date
    const invoices = await base44.asServiceRole.entities.FeeInvoice.list();
    
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === 'Paid') return false;
      if (!inv.due_date) return false;
      return new Date(inv.due_date) < now && inv.balance > 0;
    });

    // Get students and parents
    const students = await base44.asServiceRole.entities.Student.list();
    const parents = await base44.asServiceRole.entities.Parent.list();
    
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    let notificationsSent = 0;

    for (const invoice of overdueInvoices) {
      const student = studentMap[invoice.student_id];
      if (!student) continue;

      // Find parent linked to this student
      const linkedParents = parents.filter(p => {
        try {
          const linkedIds = JSON.parse(p.linked_student_ids || '[]');
          return linkedIds.includes(student.id);
        } catch {
          return false;
        }
      });

      for (const parent of linkedParents) {
        if (!parent.user_id) continue;

        await base44.asServiceRole.entities.InAppNotification.create({
          user_id: parent.user_id,
          user_email: '',
          title: '💰 Fee Payment Overdue',
          message: `Invoice #${invoice.invoice_number} for ${student.first_name} ${student.last_name} is overdue. Outstanding: ${invoice.balance}`,
          type: 'fee',
          link: 'ParentFees',
          link_params: '',
          entity_type: 'FeeInvoice',
          entity_id: invoice.id,
          is_read: false,
        });
        notificationsSent++;
      }
    }

    return Response.json({ 
      success: true, 
      overdueInvoicesChecked: overdueInvoices.length,
      notificationsSent 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});