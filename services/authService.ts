import type { User, UserRole } from '../types';

export interface UserCredentials {
  email: string;
  password?: string;
}

// --- SIMULATED BACKEND API (PRODUCTION ARCHITECTURE) ---
// Em uma aplicação de produção, este bloco de código NÃO existiria no frontend.
// Em vez disso, o frontend faria chamadas `fetch` para um servidor de API real (ex: Node.js/Express)
// que se conectaria ao seu banco de dados MySQL.
// As funções abaixo agora simulam essas chamadas de API.

const serverApi = {
  async login(credentials: UserCredentials): Promise<User> {
    console.log('[Auth Service] Simulating API call to POST /api/login');
    // PRODUÇÃO: `const response = await fetch('/api/login', { method: 'POST', body: JSON.stringify(credentials) });`
    // PRODUÇÃO: `if (!response.ok) throw new Error('Invalid credentials'); return response.json();`
    
    // Para manter o aplicativo de demonstração funcional, retornamos dados de exemplo.
    await new Promise(resolve => setTimeout(resolve, 500)); 
    if (credentials.email === 'admin@demo.com' && credentials.password === 'password') {
      return { id: 'user-2', email: 'admin@demo.com', role: 'admin', credits: 999 };
    }
    if (credentials.email === 'user@demo.com' && credentials.password === 'password') {
        return { id: 'user-1', email: 'user@demo.com', role: 'user', credits: 10 };
    }
    throw new Error('Invalid email or password.');
  },

  async register(credentials: UserCredentials, referralCode: string | null): Promise<User> {
    console.log('[Auth Service] Simulating API call to POST /api/register with referral:', referralCode);
    // PRODUÇÃO: `const response = await fetch('/api/register', { method: 'POST', body: JSON.stringify({ ...credentials, referralCode }) });`
    // PRODUÇÃO: `if (!response.ok) throw new Error('Registration failed'); return response.json();`
    
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: credentials.email,
      role: 'user',
      credits: 5, // Créditos iniciais
      referredBy: referralCode || undefined,
    };
    return newUser;
  },
  
  async getAllUsers(): Promise<User[]> {
    console.log('[Auth Service] Simulating API call to GET /api/admin/users');
    // PRODUÇÃO: `const response = await fetch('/api/admin/users'); return response.json();`
      await new Promise(resolve => setTimeout(resolve, 300));
      // Retornando dados de exemplo para o painel de administração.
      return [
          { id: 'user-1', email: 'user@demo.com', role: 'user', credits: 10 },
          { id: 'user-2', email: 'admin@demo.com', role: 'admin', credits: 999 },
          { id: 'user-3', email: 'test@demo.com', role: 'user', credits: 5, referredBy: 'aff-user-4' },
          { id: 'user-4', email: 'affiliate@demo.com', role: 'affiliate', credits: 20, affiliateId: 'aff-user-4', commissionRate: 0.15, commissionEarned: 6.75 },
          { id: 'user-5', email: 'influencer@demo.com', role: 'influencer', credits: 500 },
      ];
  },

  async updateUser(updatedUser: User): Promise<User> {
    console.log(`[Auth Service] Simulating API call to PUT /api/users/${updatedUser.id}`);
    // PRODUÇÃO: `const response = await fetch(`/api/users/${updatedUser.id}`, { method: 'PUT', body: JSON.stringify(updatedUser) });`
      await new Promise(resolve => setTimeout(resolve, 100));
      return updatedUser; // Simula a resposta de sucesso
  },
  
  async grantCredits(userId: string, amount: number): Promise<User> {
    console.log(`[Auth Service] Simulating API call to POST /api/admin/users/${userId}/grant-credits`);
    // PRODUÇÃO: `const response = await fetch(`/api/admin/users/${userId}/grant-credits`, { method: 'POST', body: JSON.stringify({ amount }) });`
      await new Promise(resolve => setTimeout(resolve, 100));
      // Simula a atualização do usuário. O backend real faria isso no MySQL.
      return { id: userId, email: 'influencer@demo.com', role: 'influencer', credits: 500 + amount };
  },

  async setUserRole(userId: string, role: UserRole): Promise<User> {
    console.log(`[Auth Service] Simulating API call to PUT /api/admin/users/${userId}/role`);
    // PRODUÇÃO: `const response = await fetch(`/api/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });`
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: userId, email: 'someuser@demo.com', role: role, credits: 10 };
  },
  
  async setCommissionRate(userId: string, rate: number): Promise<User> {
    console.log(`[Auth Service] Simulating API call to PUT /api/admin/users/${userId}/commission-rate`);
    // PRODUÇÃO: `const response = await fetch(`/api/admin/users/${userId}/commission-rate`, { method: 'PUT', body: JSON.stringify({ rate }) });`
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: userId, email: 'affiliate@demo.com', role: 'affiliate', credits: 20, affiliateId: 'aff-user-4', commissionRate: rate, commissionEarned: 6.75 };
  }
};
// --- FIM DA SIMULAÇÃO DA API DO BACKEND ---


// --- Frontend Service (Client) ---
// Este código permanece no frontend. Ele é responsável por chamar a API do backend
// e gerenciar o estado do lado do cliente (como a sessão do usuário).

const SESSION_STORAGE_KEY = 'loggedInUser';
const REFERRAL_CODE_KEY = 'referralCode';

const authService = {
  async login(credentials: UserCredentials): Promise<User> {
    const user = await serverApi.login(credentials);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  
  async register(credentials: UserCredentials): Promise<User> {
    const referralCode = sessionStorage.getItem(REFERRAL_CODE_KEY);
    const newUser = await serverApi.register(credentials, referralCode);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  getCurrentUser(): User | null {
    const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      return null;
    }
  },

  // Atualiza o usuário no "backend" e depois atualiza a sessão local se for o usuário atual.
  async updateUser(updatedUser: User): Promise<void> {
      const savedUser = await serverApi.updateUser(updatedUser);
      const currentUser = this.getCurrentUser();
      if(currentUser && currentUser.id === savedUser.id) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedUser));
      }
  },

  // Funções de Admin que chamam a API
  getAllUsers: () => serverApi.getAllUsers(),
  grantCredits: (userId: string, amount: number) => serverApi.grantCredits(userId, amount),
  setUserRole: (userId: string, role: UserRole) => serverApi.setUserRole(userId, role),
  setCommissionRate: (userId: string, rate: number) => serverApi.setCommissionRate(userId, rate),
};

export { authService };