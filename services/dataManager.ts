import { Ticket, UserProfile, UserLevel } from '../types';

const KEYS = {
  USERS: 'hd_users',
  TICKETS: 'hd_tickets',
  SESSION: 'hd_session'
};

// Seed initial admin if not exists
const seedData = () => {
  if (typeof window === 'undefined') return;
  
  const existingUsers = localStorage.getItem(KEYS.USERS);
  if (!existingUsers) {
    const adminUser: UserProfile = {
      id: 'admin-id',
      name: 'Administrador',
      username: 'admin',
      nivel: 'Admin',
      mustChangePassword: false
    };
    // Password stored separately or simply mocked for this example. 
    // For a simple local DB, we will store passwords in a separate object in LS for security separation in code
    localStorage.setItem(KEYS.USERS, JSON.stringify([adminUser]));
    localStorage.setItem('hd_passwords', JSON.stringify({ 'admin': 'admin123' }));
  }
};

seedData();

export const DataManager = {
  // --- USERS ---
  getUsers: (): UserProfile[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  addUser: async (user: UserProfile, password?: string): Promise<void> => {
    const users = DataManager.getUsers();
    if (users.find(u => u.username === user.username)) {
      throw new Error('Usuário já existe.');
    }
    
    // Save Profile
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));

    // Save Password
    const passwords = JSON.parse(localStorage.getItem('hd_passwords') || '{}');
    passwords[user.username] = password;
    localStorage.setItem('hd_passwords', JSON.stringify(passwords));
  },

  updateUser: async (updatedUser: UserProfile): Promise<void> => {
    let users = DataManager.getUsers();
    users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  deleteUser: async (userId: string): Promise<void> => {
    let users = DataManager.getUsers();
    const userToDelete = users.find(u => u.id === userId);
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));

    if (userToDelete) {
        const passwords = JSON.parse(localStorage.getItem('hd_passwords') || '{}');
        delete passwords[userToDelete.username];
        localStorage.setItem('hd_passwords', JSON.stringify(passwords));
    }
  },

  changePassword: async (username: string, newPass: string): Promise<void> => {
     const passwords = JSON.parse(localStorage.getItem('hd_passwords') || '{}');
     passwords[username] = newPass;
     localStorage.setItem('hd_passwords', JSON.stringify(passwords));

     // If it was a force change, update the profile too
     const users = DataManager.getUsers();
     const user = users.find(u => u.username === username);
     if (user) {
         user.mustChangePassword = false;
         DataManager.updateUser(user);
     }
  },

  authenticate: async (username: string, password: string): Promise<UserProfile> => {
    // Artificial delay to simulate network
    await new Promise(r => setTimeout(r, 500));

    const passwords = JSON.parse(localStorage.getItem('hd_passwords') || '{}');
    if (passwords[username] === password) {
       const users = DataManager.getUsers();
       const user = users.find(u => u.username === username);
       if (user) {
           localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
           return user;
       }
    }
    throw new Error('Usuário ou senha inválidos.');
  },

  getSession: (): UserProfile | null => {
      const session = localStorage.getItem(KEYS.SESSION);
      return session ? JSON.parse(session) : null;
  },

  logout: async (): Promise<void> => {
      localStorage.removeItem(KEYS.SESSION);
  },

  // --- TICKETS ---
  getTickets: (): Ticket[] => {
    const tickets = JSON.parse(localStorage.getItem(KEYS.TICKETS) || '[]');
    // Convert date strings back to Date objects
    return tickets.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        validatedAt: t.validatedAt ? new Date(t.validatedAt) : undefined
    }));
  },

  addTicket: async (ticket: Ticket): Promise<void> => {
      const tickets = DataManager.getTickets();
      tickets.unshift(ticket); // Add to top
      localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
  },

  updateTicket: async (updatedTicket: Ticket): Promise<void> => {
      let tickets = DataManager.getTickets();
      tickets = tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
      localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
  }
};