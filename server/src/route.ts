import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import tasksRoutes from './modules/tasks/tasks.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/tasks', tasksRoutes);

export default router;
