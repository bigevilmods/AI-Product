
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { authService, UserCredentials } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  register: (credentials: UserCredentials) => Promise<void>;
  logout: () => void;
  addCredits: (amount: number) => void;
  spendCredit: (amount?: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loggedInUser = authService.getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
  }, []);

  const login = async (credentials: UserCredentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
  };
  
  const register = async (credentials: UserCredentials) => {
    const newUser = await authService.register(credentials);
    setUser(newUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const addCredits = (amount: number) => {
    if (user) {
      const updatedUser = { ...user, credits: user.credits + amount };
      setUser(updatedUser);
      authService.updateUser(updatedUser); 
    }
  };
  
  const spendCredit = (amount: number = 1) => {
      if(user && user.credits >= amount) {
          const updatedUser = { ...user, credits: user.credits - amount };
          setUser(updatedUser);
          authService.updateUser(updatedUser);
      }
  }

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, register, logout, addCredits, spendCredit }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};