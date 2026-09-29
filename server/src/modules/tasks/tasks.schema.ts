import { z } from 'zod';

export const selectTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid({ message: 'Each task ID must be a valid UUID' }))
    .min(1, { message: 'Please select at least one task' }),
});

export type SelectTasksInput = z.infer<typeof selectTasksSchema>;

export const queryTasksSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

export type QueryTasksInput = z.infer<typeof queryTasksSchema>;
