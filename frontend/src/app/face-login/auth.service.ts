import { Injectable } from '@angular/core';

export type AuthMethod = 'face';
export interface AuthSession {
  id: string;
  name: string;
  method: AuthMethod;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'app_auth_session';
  private session: AuthSession | null = null;

  login(user: { id: string; name: string }): void {
    this.session = {
      id: user.id,
      name: user.name,
      method: 'face',
      createdAt: Date.now(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(this.session));
  }

  logout(): void {
    this.session = null;
    localStorage.removeItem(this.storageKey);
  }

  restore(): AuthSession | null {
    if (this.session) return this.session;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      this.session = parsed;
      return parsed;
    } catch (err) {
      // Corrupted session
      localStorage.removeItem(this.storageKey);
      this.session = null;
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.restore();
  }

  getSession(): AuthSession | null {
    return this.restore();
  }
}
