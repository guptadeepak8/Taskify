import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, verifyOtp, resendOtp } from './auth.service';

export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await verifyOtp(req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function handleResendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await resendOtp(req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'User logged in successfully',
    });
  } catch (error) {
    next(error);
  }
}
