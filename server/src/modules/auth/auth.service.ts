import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/database';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.schema';
import { SafeUser, User } from '../../db/types';
import { createAppError } from '../../utils/app-error';

function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
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
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return {
      user: toSafeUser(createdUser as User),
      token,
    };
  }

  static async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
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
}
