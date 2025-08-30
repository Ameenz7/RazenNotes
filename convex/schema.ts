import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()), // Temporary field for migration
    categoryId: v.optional(v.id("categories")),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    // Subtask support
    parentId: v.optional(v.id("todos")),
    isSubtask: v.optional(v.boolean()),
    order: v.optional(v.number()),
    // Dependencies
    dependsOn: v.optional(v.array(v.id("todos"))),
    blockedBy: v.optional(v.array(v.id("todos"))),
    // Recurring tasks
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom")
    )),
    recurrenceInterval: v.optional(v.number()), // e.g., every 2 days
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
    recurrenceDayOfMonth: v.optional(v.number()), // 1-31 for monthly
    parentRecurringId: v.optional(v.id("todos")), // Links instances to original recurring task
    // Archiving
    archived: v.optional(v.boolean()),
  }),
});
