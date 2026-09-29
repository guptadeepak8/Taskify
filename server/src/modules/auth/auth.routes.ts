import { Router } from 'express';
import { handleRegister, handleLogin, handleVerifyOtp, handleResendOtp } from './auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } from './auth.schema';

const router = Router();

router.post('/register', validateBody(registerSchema), handleRegister);
router.post('/verify-otp', validateBody(verifyOtpSchema), handleVerifyOtp);
router.post('/resend-otp', validateBody(resendOtpSchema), handleResendOtp);
router.post('/login', validateBody(loginSchema), handleLogin);

export default router;
