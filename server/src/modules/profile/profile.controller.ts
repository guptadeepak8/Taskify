import { Request, Response, NextFunction } from 'express';
import { getUserProfile, updateUserProfile } from './profile.service';
import { createAppError } from '../../utils/app-error';

export async function handleGetProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const profile = await getUserProfile(user.userId);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      throw createAppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const updated = await updateUserProfile(user.userId, req.body);
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
