import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TodoItem } from "./TodoItem";
import { AddTodo } from "./AddTodo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, Search, CheckSquare } from "lucide-react";
import { toast } from "sonner";

export function TodoList() {
  const todosQuery = useQuery(api.todos.getTodos, { includeArchived: true });
  const categoriesQuery = useQuery(api.todos.getCategories);
  const allTodos = useMemo(() => todosQuery || [], [todosQuery]);
  const todos = allTodos.filter(todo => !todo.isSubtask); // Main todos only
  const archiveCompletedTodos = useMutation(api.todos.archiveCompletedTodos);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.category && todo.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus = (statusFilter === "all" && !todo.archived) ||
        (statusFilter === "active" && !todo.completed && !todo.archived) ||
        (statusFilter === "completed" && todo.completed && !todo.archived) ||
        (statusFilter === "archived" && todo.archived);

      // Priority filter
      const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;

      // Category filter
      const matchesCategory = categoryFilter === "all" ||
        (todo.categoryId && todo.categoryId === categoryFilter) ||
        (todo.category && todo.category === categoryFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [todos, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const completedCount = todos.filter(todo => todo.completed && !todo.archived).length;
  const archivedCount = todos.filter(todo => todo.archived).length;
  const totalCount = todos.length;
  const activeCount = totalCount - completedCount - archivedCount;
  const filteredCount = filteredTodos.length;

  const categoriesList = useMemo(() => {
    return categoriesQuery || [];
  }, [categoriesQuery]);

  const handleArchiveCompleted = () => {
    archiveCompletedTodos();
    toast.success(`${completedCount} ${completedCount === 1 ? 'task' : 'tasks'} archived successfully!`);
  };



  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              <span>Todo List</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {activeCount} active
              </Badge>
              <Badge variant="outline">
                {completedCount} completed
              </Badge>
            </div>
          </CardTitle>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round((completedCount / totalCount) * 100)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <AddTodo />

          {todos.length > 0 && (
            <div className="space-y-4 mb-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search todos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={(value: "all" | "active" | "completed" | "archived") => setStatusFilter(value)}>
                    <SelectTrigger className="w-28 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={(value: "all" | "high" | "medium" | "low") => setPriorityFilter(value)}>
                    <SelectTrigger className="w-28 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-28 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoriesList.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>


                </div>
              </div>

              {/* Results count */}
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" ? (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCount} of {totalCount} todos
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2 mb-4">
            {filteredTodos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {todos.length === 0 ? "No todos yet. Add one above!" : "No todos match your filters."}
              </p>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  id={todo._id}
                  text={todo.text}
                  completed={todo.completed}
                  priority={todo.priority}
                  category={todo.category}
                  dueDate={todo.dueDate}
                  isRecurring={todo.isRecurring}
                  parentRecurringId={todo.parentRecurringId}
                />
              ))
            )}
          </div>

          {completedCount > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveCompleted}
                className="text-muted-foreground hover:text-foreground"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
