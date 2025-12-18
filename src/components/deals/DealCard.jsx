import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, User, Building } from 'lucide-react';
import { format } from 'date-fns';

export default function DealCard({ deal, index, onEdit, onDelete, contact, company }) {
  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card 
            className={`hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-orange-500' : 'shadow-sm'}`}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm text-slate-900 pr-2">{deal.deal_name}</h4>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(deal)}><Edit className="w-3 h-3 text-slate-500" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(deal.id)}><Trash2 className="w-3 h-3 text-slate-500" /></Button>
                </div>
              </div>
              
              <p className="font-bold text-base text-emerald-600">${(deal.deal_value || 0).toLocaleString()}</p>

              <div className="text-xs text-slate-500 space-y-1">
                {company && (
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3 h-3" />
                    <span>{company.company_name}</span>
                  </div>
                )}
                {contact && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>{contact.first_name} {contact.last_name}</span>
                  </div>
                )}
                {deal.expected_close_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(deal.expected_close_date), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
              
              {deal.deal_source && <Badge variant="outline" className="text-xs">{deal.deal_source.replace('_', ' ')}</Badge>}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}