import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit3, Calendar, Tag, AlertCircle, Plus, ChevronDown, ChevronRight, Repeat } from "lucide-react";
import { SortableSubtaskList } from "./SortableSubtaskList";
import { toast } from "sonner";

interface TodoItemProps {
  id: Id<"todos">;
  text: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  category?: string;
  dueDate?: number;
  parentId?: Id<"todos">;
  isSubtask?: boolean;
  order?: number;
  isRecurring?: boolean;
  parentRecurringId?: Id<"todos">;
}

export function TodoItem({
  id,
  text,
  completed,
  priority = "medium",
  category,
  dueDate,
  isRecurring,
  parentRecurringId
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [editStatus, setEditStatus] = useState<"active" | "completed" | "archived">(
    completed ? "completed" : "active"
  );
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(priority);
  const [editCategory, setEditCategory] = useState(category || "");
  const [editDueDate, setEditDueDate] = useState(dueDate ? new Date(dueDate).toISOString().split('T')[0] : "");

  // Subtask state
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const updateTodo = useMutation(api.todos.updateTodo);
  const completeRecurringTask = useMutation(api.todos.completeRecurringTask);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const createSubtask = useMutation(api.todos.createSubtask);

  // Get subtasks for this todo
  const allTodos = useQuery(api.todos.getTodos, { includeArchived: true }) || [];
  const currentTodo = allTodos.find(todo => todo._id === id);
  const isArchived = currentTodo?.archived || false;
  const subtasks = allTodos
    .filter(todo => todo.parentId === id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleToggle = () => {
    // Use completeRecurringTask for recurring task instances
    if (parentRecurringId && !completed) {
      completeRecurringTask({ id });
      toast.success("Recurring task completed! Next instance created.");
    } else {
      updateTodo({ id, completed: !completed });
      toast.success(completed ? "Task marked as incomplete" : "Task completed!");
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      const updates: {
        text?: string;
        completed?: boolean;
        archived?: boolean;
        priority?: "low" | "medium" | "high";
        category?: string;
        dueDate?: number;
      } = {};

      if (editText.trim() && editText !== text) {
        updates.text = editText.trim();
      }

      // Handle status changes
      const currentTodo = allTodos.find(todo => todo._id === id);
      const isCurrentlyArchived = currentTodo?.archived || false;
      const isCurrentlyCompleted = currentTodo?.completed || false;

      if (editStatus === "completed" && !isCurrentlyCompleted) {
        updates.completed = true;
        updates.archived = false;
      } else if (editStatus === "archived" && !isCurrentlyArchived) {
        updates.completed = false;
        updates.archived = true;
      } else if (editStatus === "active" && (isCurrentlyCompleted || isCurrentlyArchived)) {
        updates.completed = false;
        updates.archived = false;
      }

      if (editPriority !== priority) {
        updates.priority = editPriority;
      }

      if (editCategory !== (category || "")) {
        updates.category = editCategory.trim() || undefined;
      }

      if (editDueDate !== (dueDate ? new Date(dueDate).toISOString().split('T')[0] : "")) {
        updates.dueDate = editDueDate ? new Date(editDueDate).getTime() : undefined;
      }

      if (Object.keys(updates).length > 0) {
        updateTodo({ id, ...updates });
        toast.success("Task updated successfully!");
      }

      setIsEditing(false);
    } else {
      setEditText(text);
      setEditStatus(isArchived ? "archived" : completed ? "completed" : "active");
      setEditPriority(priority);
      setEditCategory(category || "");
      setEditDueDate(dueDate ? new Date(dueDate).toISOString().split('T')[0] : "");
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditText(text);
    setEditStatus(isArchived ? "archived" : completed ? "completed" : "active");
    setEditPriority(priority);
    setEditCategory(category || "");
    setEditDueDate(dueDate ? new Date(dueDate).toISOString().split('T')[0] : "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTodo({ id });
    toast.success("Task deleted successfully!");
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      createSubtask({
        parentId: id,
        text: newSubtaskText.trim()
      });
      toast.success("Subtask added successfully!");
      setNewSubtaskText("");
      setShowSubtaskInput(false);
    }
  };

  const handleSubtaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubtask();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const getPriorityBadgeVariant = (p: string) => {
    switch (p) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const isOverdue = dueDate && !completed && dueDate < Date.now();
  const isDueSoon = dueDate && !completed && dueDate - Date.now() < 24 * 60 * 60 * 1000 && dueDate > Date.now();

  return (
    <div className={`p-4 bg-card rounded-lg border shadow-sm ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="flex items-start gap-3">
        {!isArchived && (
          <Checkbox
            checked={completed}
            onCheckedChange={handleToggle}
            className="flex-shrink-0 mt-1"
          />
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full"
                autoFocus
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={editStatus} onValueChange={(value: "active" | "completed" | "archived") => setEditStatus(value)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Select value={editPriority} onValueChange={(value: "low" | "medium" | "high") => setEditPriority(value)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <Input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Category"
                    className="h-8"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="h-8"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-sm leading-relaxed ${
                    completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {text}
                </span>

                <div className="flex gap-1 flex-shrink-0">
                  {!isEditing && (
                    <>
                      {!isArchived && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getPriorityBadgeVariant(priority)} className="text-xs">
                  {priority}
                </Badge>

                {category && (
                  <Badge variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {category}
                  </Badge>
                )}

                {dueDate && (
                  <Badge
                    variant={isOverdue ? "destructive" : isDueSoon ? "default" : "secondary"}
                    className="text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                    {new Date(dueDate).toLocaleDateString()}
                  </Badge>
                )}

                {subtasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {subtasks.filter(st => st.completed).length}/{subtasks.length} subtasks
                  </Badge>
                )}

                {(isRecurring || parentRecurringId) && (
                  <Badge variant="outline" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    {isRecurring ? "Recurring" : "Recurring"}
                  </Badge>
                )}
              </div>

              {/* Subtask controls */}
              {!isArchived && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {subtasks.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSubtasks(!showSubtasks)}
                      className="h-6 px-2 text-xs w-full sm:w-auto"
                    >
                      {showSubtasks ? (
                        <ChevronDown className="h-3 w-3 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mr-1" />
                      )}
                      {showSubtasks ? 'Hide' : 'Show'} subtasks ({subtasks.length})
                    </Button>
                  )}

                  {!showSubtaskInput ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSubtaskInput(true)}
                      className="h-6 px-2 text-xs w-full sm:w-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add subtask
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-1 w-full">
                      <Input
                        placeholder="Add subtask..."
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={handleSubtaskKeyPress}
                        className="h-6 text-xs flex-1"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={handleAddSubtask}
                          disabled={!newSubtaskText.trim()}
                          className="h-6 px-2"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowSubtaskInput(false);
                            setNewSubtaskText("");
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtasks display */}
              {!isArchived && showSubtasks && subtasks.length > 0 && (
                <div className="mt-3">
                  <SortableSubtaskList
                    subtasks={subtasks}
                    parentId={id}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
