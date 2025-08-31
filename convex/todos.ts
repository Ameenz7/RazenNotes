import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all todos (excluding archived by default)
export const getTodos = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { includeArchived = false } = args;
    if (includeArchived) {
      return await ctx.db.query("todos").collect();
    }
    return await ctx.db.query("todos").filter((q) => q.neq(q.field("archived"), true)).collect();
  },
});

// Get all categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const categoryId = await ctx.db.insert("categories", args);
    return categoryId;
  },
});

// Update a category
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a category
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});


// Create a new todo
export const createTodo = mutation({
  args: {
    text: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    categoryId: v.optional(v.id("categories")),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    parentId: v.optional(v.id("todos")),
    isSubtask: v.optional(v.boolean()),
    order: v.optional(v.number()),
    // Recurring task parameters
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom")
    )),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.number()),
    recurrenceDaysOfWeek: v.optional(v.array(v.union(
      v.literal("sunday"),
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday")
    ))),
    recurrenceDayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      text, priority, categoryId, dueDate, tags, parentId, isSubtask, order,
      isRecurring, recurrenceType, recurrenceInterval, recurrenceEndDate,
      recurrenceDaysOfWeek, recurrenceDayOfMonth
    } = args;

    const todoId = await ctx.db.insert("todos", {
      text,
      completed: false,
      createdAt: Date.now(),
      priority: priority || "medium",
      categoryId,
      dueDate,
      tags: tags || [],
      parentId,
      isSubtask: isSubtask || false,
      order: order || 0,
      isRecurring: isRecurring || false,
      recurrenceType,
      recurrenceInterval: recurrenceInterval || 1,
      recurrenceEndDate,
      recurrenceDaysOfWeek,
      recurrenceDayOfMonth,
    });
    return todoId;
  },
});

// Create a subtask
export const createSubtask = mutation({
  args: {
    parentId: v.id("todos"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { parentId, text } = args;

    // Get the highest order number for existing subtasks
    const existingSubtasks = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("parentId"), parentId))
      .collect();

    const maxOrder = existingSubtasks.length > 0
      ? Math.max(...existingSubtasks.map(st => st.order || 0))
      : 0;

    const subtaskId = await ctx.db.insert("todos", {
      text,
      completed: false,
      createdAt: Date.now(),
      parentId,
      isSubtask: true,
      order: maxOrder + 1,
    });

    return subtaskId;
  },
});

// Update a todo (toggle completion or edit text)
export const updateTodo = mutation({
  args: {
    id: v.id("todos"),
    text: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Update subtask order
export const updateSubtaskOrder = mutation({
  args: {
    subtasks: v.array(v.object({
      id: v.id("todos"),
      order: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const { subtasks } = args;

    // Update order for each subtask
    await Promise.all(
      subtasks.map(({ id, order }) =>
        ctx.db.patch(id, { order })
      )
    );
  },
});

// Add dependency between subtasks
export const addDependency = mutation({
  args: {
    subtaskId: v.id("todos"),
    dependsOnId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const { subtaskId, dependsOnId } = args;

    // Get both subtasks
    const subtask = await ctx.db.get(subtaskId);
    const dependsOn = await ctx.db.get(dependsOnId);

    if (!subtask || !dependsOn) {
      throw new Error("Subtask not found");
    }

    // Ensure both are subtasks of the same parent
    if (subtask.parentId !== dependsOn.parentId) {
      throw new Error("Dependencies can only be created between subtasks of the same parent");
    }

    // Prevent circular dependencies
    if (dependsOn.dependsOn?.includes(subtaskId)) {
      throw new Error("Circular dependency detected");
    }

    // Update subtask to depend on the other
    const currentDependsOn = subtask.dependsOn || [];
    if (!currentDependsOn.includes(dependsOnId)) {
      await ctx.db.patch(subtaskId, {
        dependsOn: [...currentDependsOn, dependsOnId]
      });
    }

    // Update the depended-on subtask to show it's blocking this one
    const currentBlockedBy = dependsOn.blockedBy || [];
    if (!currentBlockedBy.includes(subtaskId)) {
      await ctx.db.patch(dependsOnId, {
        blockedBy: [...currentBlockedBy, subtaskId]
      });
    }
  },
});

// Remove dependency between subtasks
export const removeDependency = mutation({
  args: {
    subtaskId: v.id("todos"),
    dependsOnId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const { subtaskId, dependsOnId } = args;

    // Get both subtasks
    const subtask = await ctx.db.get(subtaskId);
    const dependsOn = await ctx.db.get(dependsOnId);

    if (!subtask || !dependsOn) {
      throw new Error("Subtask not found");
    }

    // Remove dependency from subtask
    const currentDependsOn = subtask.dependsOn || [];
    await ctx.db.patch(subtaskId, {
      dependsOn: currentDependsOn.filter(id => id !== dependsOnId)
    });

    // Remove blocking reference from depended-on subtask
    const currentBlockedBy = dependsOn.blockedBy || [];
    await ctx.db.patch(dependsOnId, {
      blockedBy: currentBlockedBy.filter(id => id !== subtaskId)
    });
  },
});

// Check if subtask can be completed (all dependencies met)
export const canCompleteSubtask = query({
  args: {
    subtaskId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const { subtaskId } = args;

    const subtask = await ctx.db.get(subtaskId);
    if (!subtask) {
      return false;
    }

    // If no dependencies, can always complete
    if (!subtask.dependsOn || subtask.dependsOn.length === 0) {
      return true;
    }

    // Check if all dependencies are completed
    const dependencies = await Promise.all(
      subtask.dependsOn.map(id => ctx.db.get(id))
    );

    return dependencies.every(dep => dep && dep.completed);
  },
});


// Archive all completed main todos
export const archiveCompletedTodos = mutation({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").collect();
    const completedMainTodos = todos.filter(todo => todo.completed && !todo.isSubtask);
    await Promise.all(completedMainTodos.map(todo => ctx.db.patch(todo._id, { archived: true })));
  },
});



// Helper function to calculate next due date
function calculateNextDueDate(task: {
  dueDate?: number;
  recurrenceType?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: number;
  recurrenceDaysOfWeek?: string[];
  recurrenceDayOfMonth?: number;
}): number | null {
  if (!task.dueDate || !task.recurrenceType) {
    return null;
  }

  const currentDate = new Date(task.dueDate);
  let nextDate: Date;

  switch (task.recurrenceType) {
    case "daily":
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + (task.recurrenceInterval || 1));
      break;

    case "weekly":
      nextDate = new Date(currentDate);
      if (task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.length > 0) {
        // For weekly with specific days, find next occurrence
        const currentDay = currentDate.getDay();
        const targetDays = task.recurrenceDaysOfWeek.map((day: string) => {
          const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          return days.indexOf(day.toLowerCase());
        });

        let nextDay = targetDays.find(day => day > currentDay);
        if (nextDay === undefined) {
          nextDay = targetDays[0];
          nextDate.setDate(currentDate.getDate() + (7 - currentDay + nextDay));
        } else {
          nextDate.setDate(currentDate.getDate() + (nextDay - currentDay));
        }
      } else {
        nextDate.setDate(currentDate.getDate() + 7 * (task.recurrenceInterval || 1));
      }
      break;

    case "monthly":
      nextDate = new Date(currentDate);
      if (task.recurrenceDayOfMonth) {
        nextDate.setMonth(currentDate.getMonth() + (task.recurrenceInterval || 1));
        nextDate.setDate(task.recurrenceDayOfMonth);
      } else {
        nextDate.setMonth(currentDate.getMonth() + (task.recurrenceInterval || 1));
      }
      break;

    case "custom":
      // For custom recurrence, use daily interval as fallback
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + (task.recurrenceInterval || 1));
      break;

    default:
      return null;
  }

  // Check if we've exceeded the end date
  if (task.recurrenceEndDate && nextDate.getTime() > task.recurrenceEndDate) {
    return null;
  }

  return nextDate.getTime();
}

// Complete recurring task and create next instance
export const completeRecurringTask = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const { id } = args;

    const task = await ctx.db.get(id);
    if (!task) {
      throw new Error("Task not found");
    }

    // Mark current instance as completed
    await ctx.db.patch(id, { completed: true });

    // If this is a recurring task instance, create next instance
    if (task.parentRecurringId) {
      const recurringTask = await ctx.db.get(task.parentRecurringId);
      if (recurringTask && recurringTask.isRecurring) {
        const nextDueDate = calculateNextDueDate(recurringTask);

        if (nextDueDate) {
          // Create new instance
          await ctx.db.insert("todos", {
            text: recurringTask.text,
            completed: false,
            createdAt: Date.now(),
            priority: recurringTask.priority,
            categoryId: recurringTask.categoryId,
            dueDate: nextDueDate,
            tags: recurringTask.tags,
            parentRecurringId: task.parentRecurringId,
          });
        }
      }
    }
  },
});

