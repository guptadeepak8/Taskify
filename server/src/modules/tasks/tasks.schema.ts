import { z } from 'zod';

export const selectTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid('Each task ID must be a valid UUID'))
    .min(1, 'Please select at least one task')
    .max(50, 'You can select up to 50 tasks at a time'),
});

export type SelectTasksInput = z.infer<typeof selectTasksSchema>;

export const queryTasksSchema = z.object({
  search: z.string().trim().max(100, 'Search keyword cannot exceed 100 characters').optional(),
  category: z.string().trim().max(100, 'Category cannot exceed 100 characters').optional(),
});

export type QueryTasksInput = z.infer<typeof queryTasksSchema>;
