export interface AuthUser {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string;
  supabase_user_id?: string | null;
}

export interface AuthSession {
  token: string;
  expires_at?: string | null;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  username: string;
  role?: string;
}
