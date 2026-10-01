import { prisma } from '../../db/prisma';
import { SafeUser, User } from '../../db/types';
import { UpdateProfileInput } from './profile.schema';
import { createAppError } from '../../utils/app-error';

function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function getUserProfile(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createAppError(404, 'USER_NOT_FOUND', 'User profile not found');
  }

  return toSafeUser(user);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createAppError(404, 'USER_NOT_FOUND', 'User profile not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone,
      address: input.address,
      business_name: input.business_name ?? null,
      updated_at: new Date(),
    },
  });

  return toSafeUser(updatedUser);
}
