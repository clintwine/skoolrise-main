import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const schoolTenantId = user.school_tenant_id;
    const now = new Date();

    const invoiceFilter = {};
    if (schoolTenantId) invoiceFilter.school_tenant_id = schoolTenantId;
    const invoices = await base44.asServiceRole.entities.FeeInvoice.filter(invoiceFilter);

    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === 'Paid') return false;
      if (!inv.due_date) return false;
      return new Date(inv.due_date) < now && inv.balance > 0;
    });

    const studentFilter = {};
    if (schoolTenantId) studentFilter.school_tenant_id = schoolTenantId;
    const students = await base44.asServiceRole.entities.Student.filter(studentFilter);

    const parentFilter = {};
    if (schoolTenantId) parentFilter.school_tenant_id = schoolTenantId;
    const parents = await base44.asServiceRole.entities.Parent.filter(parentFilter);

    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    let notificationsSent = 0;

    for (const invoice of overdueInvoices) {
      const student = studentMap[invoice.student_id];
      if (!student) continue;

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
          school_tenant_id: schoolTenantId || null,
        });
        notificationsSent++;
      }
    }

    return Response.json({ success: true, overdueInvoicesChecked: overdueInvoices.length, notificationsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});