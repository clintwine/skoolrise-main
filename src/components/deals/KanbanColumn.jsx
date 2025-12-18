import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import DealCard from './DealCard';

export default function KanbanColumn({ stage, deals, onEdit, onDelete, contacts, companies }) {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);

  return (
    <div className="w-80 flex-shrink-0 bg-slate-50 rounded-xl flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></span>
            {stage.title}
            <span className="text-sm font-normal text-slate-500">{deals.length}</span>
          </h3>
        </div>
        <p className="text-sm font-semibold text-slate-600 mt-1">${totalValue.toLocaleString()}</p>
      </div>

      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow p-4 space-y-4 overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-orange-50' : ''
            }`}
            style={{ minHeight: '200px' }}
          >
            {deals.map((deal, index) => {
              const contact = contacts.find(c => c.id === deal.contact_id);
              const company = companies.find(c => c.id === deal.company_id);
              return (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  contact={contact}
                  company={company}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}