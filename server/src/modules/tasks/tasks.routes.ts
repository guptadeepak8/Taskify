import { Router } from 'express';
import {
  handleGetTasks,
  handleGetCategories,
  handleGetUserTasks,
  handleSaveUserTasks,
  handleDeleteUserTask,
} from './tasks.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { selectTasksSchema, queryTasksSchema } from './tasks.schema';

const router = Router();

router.get('/', validateQuery(queryTasksSchema), handleGetTasks);
router.get('/categories', handleGetCategories);
router.get('/selected', authenticate, handleGetUserTasks);
router.post('/select', authenticate, validateBody(selectTasksSchema), handleSaveUserTasks);
router.delete('/selected/:taskId', authenticate, handleDeleteUserTask);

export default router;
