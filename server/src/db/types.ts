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

export interface Database {
  users: UserTable;
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
