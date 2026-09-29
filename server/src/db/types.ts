import { Generated } from 'kysely';

export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  business_name: string | null;
  is_verified: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OtpTable {
  id: Generated<string>;
  user_id: string;
  email: string;
  otp_hash: string;
  attempts: Generated<number>;
  expires_at: Date;
  last_sent_at: Generated<Date>;
  is_used: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface TaskTable {
  id: Generated<string>;
  name: string;
  category: string;
  description: string;
  created_at: Generated<Date>;
}

export interface UserTaskTable {
  id: Generated<string>;
  user_id: string;
  task_id: string;
  created_at: Generated<Date>;
}

export interface Database {
  users: UserTable;
  otps: OtpTable;
  tasks: TaskTable;
  user_tasks: UserTaskTable;
}

export type User = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  business_name: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
};

export type SafeUser = Omit<User, 'password_hash'>;

export type Otp = {
  id: string;
  user_id: string;
  email: string;
  otp_hash: string;
  attempts: number;
  expires_at: Date;
  last_sent_at: Date;
  is_used: boolean;
  created_at: Date;
};

export type Task = {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: Date;
};

export type UserTask = {
  id: string;
  user_id: string;
  task_id: string;
  created_at: Date;
};
