import { db } from '../../db/database';
import { SafeUser, User } from '../../db/types';
import { UpdateProfileInput } from './profile.schema';
import { createAppError } from '../../utils/app-error';

function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function getUserProfile(userId: string): Promise<SafeUser> {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) {
    throw createAppError(404, 'USER_NOT_FOUND', 'User profile not found');
  }

  return toSafeUser(user as User);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<SafeUser> {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) {
    throw createAppError(404, 'USER_NOT_FOUND', 'User profile not found');
  }

  const updatedUser = await db
    .updateTable('users')
    .set({
      name: input.name,
      phone: input.phone,
      address: input.address,
      business_name: input.business_name ?? null,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toSafeUser(updatedUser as User);
}
