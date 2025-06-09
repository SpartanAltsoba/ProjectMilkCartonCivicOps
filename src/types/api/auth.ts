export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  passwordHash: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  tokenVersion: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    username: string;
    name?: string;
    role: string;
    emailVerified: boolean;
  };
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}
