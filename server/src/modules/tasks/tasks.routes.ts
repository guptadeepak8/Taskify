import { Router } from 'express';
import {
  handleGetTasks,
  handleGetCategories,
  handleGetUserTasks,
  handleSaveUserTasks,
} from './tasks.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { selectTasksSchema } from './tasks.schema';

const router = Router();

router.get('/', handleGetTasks);
router.get('/categories', handleGetCategories);
router.get('/selected', authenticate, handleGetUserTasks);
router.post('/select', authenticate, validateBody(selectTasksSchema), handleSaveUserTasks);

export default router;
