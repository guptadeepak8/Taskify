import { db } from '../../db/database';
import { createAppError } from '../../utils/app-error';

export interface TaskFilter {
  category?: string;
  search?: string;
}

export async function getTasks(filter?: TaskFilter) {
  let query = db.selectFrom('tasks').selectAll();

  if (filter?.category) {
    query = query.where('category', '=', filter.category);
  }

  if (filter?.search && filter.search.trim()) {
    const term = `%${filter.search.trim()}%`;
    query = query.where((eb) =>
      eb.or([
        eb('name', 'ilike', term),
        eb('description', 'ilike', term),
      ])
    );
  }

  return await query.orderBy('category', 'asc').orderBy('name', 'asc').execute();
}

export async function getCategories(): Promise<string[]> {
  const rows = await db
    .selectFrom('tasks')
    .select('category')
    .distinct()
    .orderBy('category', 'asc')
    .execute();

  return rows.map((r) => r.category);
}

export async function getUserTasks(userId: string) {
  return await db
    .selectFrom('user_tasks')
    .innerJoin('tasks', 'tasks.id', 'user_tasks.task_id')
    .where('user_tasks.user_id', '=', userId)
    .select([
      'tasks.id',
      'tasks.name',
      'tasks.category',
      'tasks.description',
      'user_tasks.created_at as selected_at',
    ])
    .orderBy('tasks.category', 'asc')
    .orderBy('tasks.name', 'asc')
    .execute();
}

export async function saveUserTasks(userId: string, taskIds: string[]) {
  const uniqueTaskIds = Array.from(new Set(taskIds));

  // Verify that all requested tasks exist in the database
  const existingTasks = await db
    .selectFrom('tasks')
    .where('id', 'in', uniqueTaskIds)
    .select('id')
    .execute();

  if (existingTasks.length !== uniqueTaskIds.length) {
    throw createAppError(400, 'INVALID_TASKS', 'One or more selected tasks are invalid');
  }

  // Atomically update user task selection
  return await db.transaction().execute(async (trx) => {
    await trx.deleteFrom('user_tasks').where('user_id', '=', userId).execute();

    if (uniqueTaskIds.length > 0) {
      await trx
        .insertInto('user_tasks')
        .values(
          uniqueTaskIds.map((taskId) => ({
            user_id: userId,
            task_id: taskId,
          }))
        )
        .execute();
    }

    return await trx
      .selectFrom('user_tasks')
      .innerJoin('tasks', 'tasks.id', 'user_tasks.task_id')
      .where('user_tasks.user_id', '=', userId)
      .select([
        'tasks.id',
        'tasks.name',
        'tasks.category',
        'tasks.description',
        'user_tasks.created_at as selected_at',
      ])
      .orderBy('tasks.category', 'asc')
      .orderBy('tasks.name', 'asc')
      .execute();
  });
}
