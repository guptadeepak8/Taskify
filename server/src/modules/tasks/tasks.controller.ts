import { Request, Response, NextFunction } from 'express';
import {
  getTasks,
  getCategories,
  getUserTasks,
  saveUserTasks,
  removeUserTask,
} from './tasks.service';
import { createAppError } from '../../utils/app-error';

export async function handleGetTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, search } = req.query;
    const tasks = await getTasks({
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetUserTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const tasks = await getUserTasks(user.userId);

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleSaveUserTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { taskIds } = req.body;
    const selected = await saveUserTasks(user.userId, taskIds);

    return res.status(200).json({
      success: true,
      data: selected,
      message: 'Tasks saved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteUserTask(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { taskId } = req.params;
    const remaining = await removeUserTask(user.userId, taskId as string);

    return res.status(200).json({
      success: true,
      data: remaining,
      message: 'Task removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
