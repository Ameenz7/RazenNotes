import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SubtaskItemProps {
  id: Id<"todos">;
  text: string;
  completed: boolean;
  parentId: Id<"todos">;
  order?: number;
}

export function SubtaskItem({
  id,
  text,
  completed,
  parentId
}: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [showDependencyUI, setShowDependencyUI] = useState(false);

  const updateTodo = useMutation(api.todos.updateTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const addDependency = useMutation(api.todos.addDependency);
  const removeDependency = useMutation(api.todos.removeDependency);

  // Get current subtask data with dependencies
  const todos = useQuery(api.todos.getTodos, { includeArchived: true });
  const currentSubtask = todos?.find(todo => todo._id === id);
  const isArchived = currentSubtask?.archived || false;
  const allSubtasks = todos?.filter(todo => todo.parentId === parentId && todo._id !== id) || [];
  const canComplete = useQuery(api.todos.canCompleteSubtask, { subtaskId: id }) ?? false;

  // Get dependency information
  const dependsOn = currentSubtask?.dependsOn || [];
  const blockedBy = currentSubtask?.blockedBy || [];
  const dependencyTasks = allSubtasks.filter(task => dependsOn.includes(task._id));
  const blockingTasks = allSubtasks.filter(task => blockedBy.includes(task._id));

  const handleToggle = () => {
    // Check if we can complete this subtask
    if (!completed && !canComplete) {
      toast.error("Cannot complete this subtask until all dependencies are completed.");
      return;
    }
    updateTodo({ id, completed: !completed });
  };

  const handleAddDependency = (dependsOnId: Id<"todos">) => {
    addDependency({ subtaskId: id, dependsOnId });
    setShowDependencyUI(false);
  };

  const handleRemoveDependency = (dependsOnId: Id<"todos">) => {
    removeDependency({ subtaskId: id, dependsOnId });
  };

  const handleEdit = () => {
    if (isEditing) {
      const updates: {
        text?: string;
      } = {};

      if (editText.trim() && editText !== text) {
        updates.text = editText.trim();
      }

      if (Object.keys(updates).length > 0) {
        updateTodo({ id, ...updates });
      }

      setIsEditing(false);
    } else {
      setEditText(text);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditText(text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTodo({ id });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="ml-8 p-3 bg-muted/30 rounded-lg border-l-2 border-muted-foreground/20">
      <div className="flex items-start gap-3">
        {!isArchived && (
          <Checkbox
            checked={completed}
            onCheckedChange={handleToggle}
            className="flex-shrink-0 mt-1 scale-75"
          />
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full h-8 text-sm"
              autoFocus
            />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-sm leading-relaxed ${
                  completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {text}
              </span>

              <div className="flex gap-1 flex-shrink-0">
                {!isArchived && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Dependency indicators and controls */}
          {!isEditing && (
            <div className="mt-2 space-y-2">
              {/* Dependencies this task depends on */}
              {dependencyTasks.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Depends on:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dependencyTasks.map(dep => (
                      <Badge
                        key={dep._id}
                        variant={dep.completed ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {dep.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks blocked by this task */}
              {blockingTasks.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Blocks:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {blockingTasks.map(blocked => (
                      <Badge
                        key={blocked._id}
                        variant="outline"
                        className="text-xs border-orange-200"
                      >
                        {blocked.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependency management */}
              {!isArchived && (
                <div className="flex flex-col gap-2">
                  {!showDependencyUI ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDependencyUI(true)}
                      className="h-7 px-2 text-xs w-full sm:w-auto"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Add dependency
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Depends on:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {allSubtasks.map(subtask => (
                          <Button
                            key={subtask._id}
                            size="sm"
                            variant={dependsOn.includes(subtask._id) ? "default" : "outline"}
                            onClick={() => {
                              if (dependsOn.includes(subtask._id)) {
                                handleRemoveDependency(subtask._id);
                              } else {
                                handleAddDependency(subtask._id);
                              }
                            }}
                            className="h-7 px-2 text-xs"
                            disabled={subtask._id === id}
                          >
                            {subtask.text}
                          </Button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDependencyUI(false)}
                        className="h-7 px-2 text-xs w-full sm:w-auto"
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
