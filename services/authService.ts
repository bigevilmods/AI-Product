import type { User } from '../types';

export interface UserCredentials {
  email: string;
  password?: string;
}

// In-memory mock database. In a real application, this would be a remote database.
const mockDb: { [id: string]: User } = {
  'user-1': { id: 'user-1', email: 'user@demo.com', role: 'user', credits: 10 },
  'user-2': { id: 'user-2', email: 'admin@demo.com', role: 'admin', credits: 999 },
  'user-3': { id: 'user-3', email: 'test@demo.com', role: 'user', credits: 5 },
};

const SESSION_STORAGE_KEY = 'loggedInUser';

const authService = {
  async login(credentials: UserCredentials): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = Object.values(mockDb).find(u => u.email === credentials.email);
    
    // In a real app, you would check the password hash here.
    // For this mock, we just check if the user exists and the password is 'password'.
    if (user && credentials.password === 'password') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid email or password.');
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
    // This is an admin-only function. In a real app, this would be a protected API endpoint.
    return Object.values(mockDb);
  },
  
  updateUser(updatedUser: User): void {
      if(mockDb[updatedUser.id]) {
          mockDb[updatedUser.id] = updatedUser;
          
          // If the updated user is the currently logged in user, update session storage as well
          const currentUser = this.getCurrentUser();
          if(currentUser && currentUser.id === updatedUser.id) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
          }
      }
  }
};

export { authService };
