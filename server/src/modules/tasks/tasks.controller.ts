import { Request, Response, NextFunction } from 'express';
import {
  getTasks,
  getCategories,
  getUserTasks,
  saveUserTasks,
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
    if (!req.user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const tasks = await getUserTasks(req.user.userId);

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
    if (!req.user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { taskIds } = req.body;
    const selected = await saveUserTasks(req.user.userId, taskIds);

    return res.status(200).json({
      success: true,
      data: selected,
      message: 'Tasks saved successfully',
    });
  } catch (error) {
    next(error);
  }
}
