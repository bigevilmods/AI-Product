
import type { User, UserRole } from '../types';

export interface UserCredentials {
  email: string;
  password?: string;
}

const mockDb: { [id: string]: User } = {
  'user-1': { id: 'user-1', email: 'user@demo.com', role: 'user', credits: 10 },
  'user-2': { id: 'user-2', email: 'admin@demo.com', role: 'admin', credits: 999 },
  'user-3': { id: 'user-3', email: 'test@demo.com', role: 'user', credits: 5, referredBy: 'aff-user-4' },
  'user-4': { id: 'user-4', email: 'affiliate@demo.com', role: 'affiliate', credits: 20, affiliateId: 'aff-user-4', commissionRate: 0.15, commissionEarned: 6.75 },
  'user-5': { id: 'user-5', email: 'influencer@demo.com', role: 'influencer', credits: 500 },
};

const SESSION_STORAGE_KEY = 'loggedInUser';
const REFERRAL_CODE_KEY = 'referralCode';

const authService = {
  async login(credentials: UserCredentials): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = Object.values(mockDb).find(u => u.email === credentials.email);
    
    if (user && credentials.password === 'password') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid email or password.');
  },
  
  async register(credentials: UserCredentials): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (Object.values(mockDb).some(u => u.email === credentials.email)) {
        throw new Error('An account with this email already exists.');
    }

    const newUserId = `user-${Date.now()}`;
    const referralCode = sessionStorage.getItem(REFERRAL_CODE_KEY);

    const newUser: User = {
        id: newUserId,
        email: credentials.email,
        role: 'user',
        credits: 5,
        referredBy: referralCode || undefined,
    };

    mockDb[newUserId] = newUser;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  getCurrentUser(): User | null {
    const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      return null;
    }
  },

  getAllUsers(): User[] {
    return Object.values(mockDb);
  },
  
  updateUser(updatedUser: User): void {
      if(mockDb[updatedUser.id]) {
          mockDb[updatedUser.id] = { ...mockDb[updatedUser.id], ...updatedUser };
          
          const currentUser = this.getCurrentUser();
          if(currentUser && currentUser.id === updatedUser.id) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockDb[updatedUser.id]));
          }
      }
  },

  grantCredits(userId: string, amount: number): User | null {
      const user = mockDb[userId];
      if (user) {
          user.credits += amount;
          this.updateUser(user);
          return user;
      }
      return null;
  },

  setUserRole(userId: string, role: UserRole): User | null {
      const user = mockDb[userId];
      if (user) {
          user.role = role;
          if (role === 'affiliate' && !user.affiliateId) {
              user.affiliateId = `aff-${user.id}`;
              user.commissionRate = user.commissionRate || 0.10;
              user.commissionEarned = user.commissionEarned || 0;
          }
          this.updateUser(user);
          return user;
      }
      return null;
  },

  setCommissionRate(userId: string, rate: number): User | null {
      const user = mockDb[userId];
      if (user && user.role === 'affiliate') {
          user.commissionRate = rate;
          this.updateUser(user);
          return user;
      }
      return null;
  }
};

export { authService };