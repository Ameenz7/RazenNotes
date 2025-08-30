import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GripVertical } from "lucide-react";
import { SubtaskItem } from "./SubtaskItem";

interface SortableSubtaskItemProps {
  id: Id<"todos">;
  text: string;
  completed: boolean;
  parentId: Id<"todos">;
  order?: number;
}

function SortableSubtaskItem({
  id,
  text,
  completed,
  parentId,
  order
}: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <SubtaskItem
            id={id}
            text={text}
            completed={completed}
            parentId={parentId}
            order={order}
          />
        </div>
      </div>
    </div>
  );
}

interface SortableSubtaskListProps {
  subtasks: Array<{
    _id: Id<"todos">;
    text: string;
    completed: boolean;
    priority?: "low" | "medium" | "high";
    category?: string;
    dueDate?: number;
    parentId?: Id<"todos">;
    order?: number;
  }>;
  parentId: Id<"todos">;
}

export function SortableSubtaskList({ subtasks, parentId }: SortableSubtaskListProps) {
  const [items, setItems] = useState(subtasks);
  const updateSubtaskOrder = useMutation(api.todos.updateSubtaskOrder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local state when subtasks prop changes
  useEffect(() => {
    setItems(subtasks);
  }, [subtasks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item._id.toString() === active.id);
      const newIndex = items.findIndex((item) => item._id.toString() === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update order values
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      setItems(updatedItems);

      // Update backend
      const orderUpdates = updatedItems.map((item, index) => ({
        id: item._id,
        order: index,
      }));

      updateSubtaskOrder({ subtasks: orderUpdates });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item._id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((subtask) => (
            <SortableSubtaskItem
              key={subtask._id.toString()}
              id={subtask._id}
              text={subtask.text}
              completed={subtask.completed}
              parentId={parentId}
              order={subtask.order}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
