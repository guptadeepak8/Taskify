import { Router } from 'express';
import { handleGetProfile, handleUpdateProfile } from './profile.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { updateProfileSchema } from './profile.schema';

const router = Router();

router.get('/', authenticate, handleGetProfile);
router.put('/', authenticate, validateBody(updateProfileSchema), handleUpdateProfile);

export default router;
