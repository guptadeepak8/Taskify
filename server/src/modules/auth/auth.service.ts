import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../db/database';
import { env } from '../../config/env';
import { RegisterInput, LoginInput, VerifyOtpInput, ResendOtpInput } from './auth.schema';
import { SafeUser, User } from '../../db/types';
import { createAppError } from '../../utils/app-error';
import { sendOtpEmail } from '../../services/email.service';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function generateAndSendOtp(userId: string, email: string): Promise<string> {
  const db = await getDb();
  const recentOtp = await db
    .selectFrom('otps')
    .selectAll()
    .where('email', '=', email)
    .where('is_used', '=', false)
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  if (recentOtp) {
    const elapsedSeconds = (Date.now() - new Date(recentOtp.last_sent_at).getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw createAppError(
        429,
        'RESEND_COOLDOWN',
        `Please wait ${waitTime} seconds before requesting a new verification code.`,
        { retryAfter: waitTime }
      );
    }

    await db
      .updateTable('otps')
      .set({ is_used: true })
      .where('email', '=', email)
      .where('is_used', '=', false)
      .execute();
  }

  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otp_hash = await bcrypt.hash(rawOtp, 10);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db
    .insertInto('otps')
    .values({
      user_id: userId,
      email,
      otp_hash,
      attempts: 0,
      expires_at,
      last_sent_at: new Date(),
      is_used: false,
    })
    .execute();

  await sendOtpEmail(email, rawOtp);

  return rawOtp;
}

export async function registerUser(
  input: RegisterInput
): Promise<{ user: SafeUser; message: string }> {
  const db = await getDb();
  const existing = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', input.email)
    .executeTakeFirst();

  if (existing) {
    throw createAppError(409, 'USER_ALREADY_EXISTS', 'A user with this email already exists');
  }

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(input.password, saltRounds);

  const createdUser = await db
    .insertInto('users')
    .values({
      email: input.email,
      password_hash,
      name: input.name ?? null,
      is_verified: false,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await generateAndSendOtp(createdUser.id, createdUser.email);

  return {
    user: toSafeUser(createdUser as User),
    message: 'Registration successful. A 6-digit verification code has been sent to your email.',
  };
}

export async function verifyOtp(
  input: VerifyOtpInput
): Promise<{ user: SafeUser; token: string }> {
  const db = await getDb();
  const activeOtp = await db
    .selectFrom('otps')
    .selectAll()
    .where('email', '=', input.email)
    .where('is_used', '=', false)
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  if (!activeOtp) {
    throw createAppError(400, 'INVALID_OTP', 'Invalid or expired verification code.');
  }

  if (new Date() > new Date(activeOtp.expires_at)) {
    throw createAppError(400, 'OTP_EXPIRED', 'Verification code has expired. Please request a new one.');
  }

  if (activeOtp.attempts >= MAX_OTP_ATTEMPTS) {
    throw createAppError(
      400,
      'OTP_MAX_ATTEMPTS_EXCEEDED',
      'Maximum verification attempts exceeded (5). Please request a new code.'
    );
  }

  const isValid = await bcrypt.compare(input.otp, activeOtp.otp_hash);
  if (!isValid) {
    const updatedAttempts = activeOtp.attempts + 1;
    await db
      .updateTable('otps')
      .set({ attempts: updatedAttempts })
      .where('id', '=', activeOtp.id)
      .execute();

    const remainingAttempts = Math.max(0, MAX_OTP_ATTEMPTS - updatedAttempts);
    if (remainingAttempts === 0) {
      throw createAppError(
        400,
        'OTP_MAX_ATTEMPTS_EXCEEDED',
        'Maximum verification attempts exceeded. Please request a new code.'
      );
    }

    throw createAppError(
      400,
      'INVALID_OTP',
      `Invalid verification code. ${remainingAttempts} attempts remaining.`
    );
  }

  await db
    .updateTable('otps')
    .set({ is_used: true })
    .where('id', '=', activeOtp.id)
    .execute();

  const updatedUser = await db
    .updateTable('users')
    .set({ is_verified: true, updated_at: new Date() })
    .where('id', '=', activeOtp.user_id)
    .returningAll()
    .executeTakeFirstOrThrow();

  const token = jwt.sign(
    { userId: updatedUser.id, email: updatedUser.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    user: toSafeUser(updatedUser as User),
    token,
  };
}

export async function resendOtp(
  input: ResendOtpInput
): Promise<{ message: string }> {
  const db = await getDb();
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', input.email)
    .executeTakeFirst();

  if (!user) {
    throw createAppError(404, 'USER_NOT_FOUND', 'User with this email was not found.');
  }

  if (user.is_verified) {
    throw createAppError(400, 'ALREADY_VERIFIED', 'This account is already verified. Please log in.');
  }

  await generateAndSendOtp(user.id, user.email);

  return {
    message: 'A new 6-digit verification code has been sent to your email.',
  };
}

export async function loginUser(
  input: LoginInput
): Promise<{ user: SafeUser; token: string }> {
  const db = await getDb();
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', input.email)
    .executeTakeFirst();

  if (!user) {
    throw createAppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(input.password, user.password_hash);
  if (!isMatch) {
    throw createAppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!user.is_verified) {
    throw createAppError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address before logging in.',
      { email: user.email }
    );
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    user: toSafeUser(user as User),
    token,
  };
}
