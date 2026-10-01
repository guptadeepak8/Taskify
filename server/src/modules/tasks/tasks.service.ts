import { prisma } from '../../db/prisma';
import { createAppError } from '../../utils/app-error';

export interface TaskFilter {
  category?: string;
  search?: string;
}

export async function getTasks(filter?: TaskFilter) {
  const where: any = {};

  if (filter?.category) {
    where.category = filter.category;
  }

  if (filter?.search && filter.search.trim()) {
    const term = filter.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  return await prisma.task.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });
}

export async function getCategories(): Promise<string[]> {
  const distinctCategories = await prisma.task.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return distinctCategories.map((r) => r.category);
}

export async function getUserTasks(userId: string) {
  const userTasks = await prisma.userTask.findMany({
    where: { user_id: userId },
    include: { task: true },
    orderBy: [
      { task: { category: 'asc' } },
      { task: { name: 'asc' } },
    ],
  });

  return userTasks.map((ut) => ({
    id: ut.task.id,
    name: ut.task.name,
    category: ut.task.category,
    description: ut.task.description,
    selected_at: ut.created_at,
  }));
}

export async function saveUserTasks(userId: string, taskIds: string[]) {
  const uniqueTaskIds = Array.from(new Set(taskIds));

  // Verify that all requested tasks exist in the database
  const existingTasks = await prisma.task.findMany({
    where: { id: { in: uniqueTaskIds } },
    select: { id: true },
  });

  if (existingTasks.length !== uniqueTaskIds.length) {
    throw createAppError(400, 'INVALID_TASKS', 'One or more selected tasks are invalid');
  }

  // Atomically update user task selection
  return await prisma.$transaction(async (tx) => {
    await tx.userTask.deleteMany({
      where: { user_id: userId },
    });

    if (uniqueTaskIds.length > 0) {
      await tx.userTask.createMany({
        data: uniqueTaskIds.map((taskId) => ({
          user_id: userId,
          task_id: taskId,
        })),
      });
    }

    const updatedUserTasks = await tx.userTask.findMany({
      where: { user_id: userId },
      include: { task: true },
      orderBy: [
        { task: { category: 'asc' } },
        { task: { name: 'asc' } },
      ],
    });

    return updatedUserTasks.map((ut) => ({
      id: ut.task.id,
      name: ut.task.name,
      category: ut.task.category,
      description: ut.task.description,
      selected_at: ut.created_at,
    }));
  });
}

export async function removeUserTask(userId: string, taskId: string) {
  await prisma.userTask.deleteMany({
    where: {
      user_id: userId,
      task_id: taskId,
    },
  });

  return await getUserTasks(userId);
}
