import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Tag, Repeat, Tags } from "lucide-react";
import { toast } from "sonner";

export function AddTodo() {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Recurring task state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<("sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday")[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | undefined>();

  const createTodo = useMutation(api.todos.createTodo);
  const createCategory = useMutation(api.todos.createCategory);
  const categories = useQuery(api.todos.getCategories) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      const todoData = {
        text: text.trim(),
        priority,
        ...(categoryId && { categoryId: categoryId as Id<"categories"> }),
        ...(dueDate && { dueDate: new Date(dueDate).getTime() }),
        // Recurring task parameters
        isRecurring,
        ...(isRecurring && {
          recurrenceType,
          recurrenceInterval,
          ...(recurrenceEndDate && { recurrenceEndDate: new Date(recurrenceEndDate).getTime() }),
          ...(recurrenceDaysOfWeek.length > 0 && { recurrenceDaysOfWeek }),
          ...(recurrenceDayOfMonth && { recurrenceDayOfMonth }),
        }),
      };

      createTodo(todoData);

      // Show success notification
      toast.success(isRecurring ? "Recurring task created!" : "Task created successfully!");

      // Reset form
      setText("");
      setCategoryId("");
      setDueDate("");
      setPriority("medium");
      setIsRecurring(false);
      setRecurrenceType("daily");
      setRecurrenceInterval(1);
      setRecurrenceEndDate("");
      setRecurrenceDaysOfWeek([]);
      setRecurrenceDayOfMonth(undefined);
      setShowAdvanced(false);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      const categoryId = await createCategory({ name: newCategoryName.trim() });
      setCategoryId(categoryId);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      toast.success("Category created successfully!");
    }
  };

  const handleNewCategoryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateCategory();
    } else if (e.key === "Escape") {
      setShowNewCategoryInput(false);
      setNewCategoryName("");
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Add a new todo..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />
        <Button type="submit" disabled={!text.trim()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Low</Badge>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Medium</Badge>
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">High</Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full sm:w-auto"
        >
          <Tag className="h-4 w-4 mr-2" />
          More Options
        </Button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Category
              </label>
              {!showNewCategoryInput ? (
                <Select value={categoryId} onValueChange={(value) => {
                  if (value === "new") {
                    setShowNewCategoryInput(true);
                  } else {
                    setCategoryId(value);
                  }
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-primary">
                      + Add new category
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={handleNewCategoryKeyPress}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Recurring Task Section */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <label htmlFor="recurring" className="text-sm font-medium flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Recurring Task
              </label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Repeat</label>
                  <Select value={recurrenceType} onValueChange={(value: "daily" | "weekly" | "monthly" | "custom") => setRecurrenceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceType === "custom" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Every</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {recurrenceInterval === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                )}

                {recurrenceType === "weekly" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Repeat on</label>
                    <div className="flex flex-wrap gap-2">
                      {(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const).map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={recurrenceDaysOfWeek.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, day]);
                              } else {
                                setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== day));
                              }
                            }}
                          />
                          <label htmlFor={day} className="text-sm capitalize">
                            {day.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recurrenceType === "monthly" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Day of month</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={recurrenceDayOfMonth || ""}
                      onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 15"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">End date (optional)</label>
                  <Input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
