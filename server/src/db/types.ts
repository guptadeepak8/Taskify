import type { User, Otp, Task, UserTask } from '@prisma/client';

export type { User, Otp, Task, UserTask };

export type SafeUser = Omit<User, 'password_hash'>;
