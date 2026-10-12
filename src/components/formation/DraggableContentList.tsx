import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video, FileText, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormationContent } from '@/hooks/useFormations';

interface SortableContentItemProps {
  content: FormationContent;
  index: number;
  onDelete: () => void;
}

function SortableContentItem({ content, index, onDelete }: SortableContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-muted rounded-lg ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        {content.content_type === 'video' ? (
          <Video className="h-5 w-5" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
        <div>
          <p className="font-medium">{index + 1}. {content.title}</p>
          {content.duration_seconds && (
            <p className="text-sm text-muted-foreground">
              {Math.floor(content.duration_seconds / 60)}:
              {(content.duration_seconds % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

interface DraggableContentListProps {
  content: FormationContent[];
  onReorder: (newOrder: FormationContent[]) => void;
  onDelete: (id: string) => void;
}

export function DraggableContentList({ content, onReorder, onDelete }: DraggableContentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = content.findIndex((item) => item.id === active.id);
      const newIndex = content.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(content, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  if (!content || content.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        No content added yet. Upload videos or PDFs below.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={content.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {content.map((item, index) => (
            <SortableContentItem
              key={item.id}
              content={item}
              index={index}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
