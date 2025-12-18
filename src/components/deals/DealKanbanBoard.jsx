import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import { Skeleton } from '@/components/ui/skeleton';

const STAGES_CONFIG = [
  { id: "prospecting", title: "Prospecting", color: "bg-blue-500" },
  { id: "qualification", title: "Qualification", color: "bg-purple-500" },
  { id: "proposal", title: "Proposal", color: "bg-orange-500" },
  { id: "negotiation", title: "Negotiation", color: "bg-red-500" },
  { id: "closing", title: "Closing", color: "bg-green-500" },
];

export default function DealKanbanBoard({ deals, onStageChange, onEdit, onDelete, isLoading, contacts, companies }) {
  const [columns, setColumns] = useState({});

  useEffect(() => {
    const groupedDeals = STAGES_CONFIG.reduce((acc, stage) => {
      acc[stage.id] = deals.filter(deal => deal.stage === stage.id);
      return acc;
    }, {});
    setColumns(groupedDeals);
  }, [deals]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    onStageChange(draggableId, destination.droppableId);
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 h-full">
        {STAGES_CONFIG.map(stage => (
          <div key={stage.id} className="w-80 flex-shrink-0">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 items-start h-full pb-6">
        {STAGES_CONFIG.map(stage => {
          const columnDeals = columns[stage.id] || [];
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={columnDeals}
              onEdit={onEdit}
              onDelete={onDelete}
              contacts={contacts}
              companies={companies}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}