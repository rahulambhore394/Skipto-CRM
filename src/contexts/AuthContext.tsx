import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { userService } from '../services/userService';
import { STORAGE_KEYS } from '../data/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, _password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    // Demo auth: any password works for demo accounts
    const found = userService.findByEmail(email);
    if (!found) return { success: false, error: 'No account found with that email address.' };
    setUser(found);
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(found));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(updated));
    userService.update(user.id, data);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

