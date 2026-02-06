
export enum TicketStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Andamento',
  RESOLVED = 'Resolvido',
  CLOSED = 'Fechado'
}

export enum TicketPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica' // Escalated
}

export type UserLevel = 'Analista' | 'Admin';

// Mapped to Supabase table 'user_profiles'
export interface UserProfile {
  id: string;       // uuid
  username: string; // login
  name: string;     // nome
  nivel: UserLevel; // role
  mustChangePassword?: boolean; // mustChangePassword
}

export interface Asset {
  id?: string;
  termId: string;      // SGPI (TERM ID)
  produto: string;     // PRODUTO
  hostname: string;    // HOSTNAME
  serialNumber: string; // Equip|Serie
  equipTipo2: string;   // Equip.|Tipo-2
  filial: string;      // Filial
  codSite: string;     // Cod. Site
  locationName: string; // Site Nome
  updatedAt?: Date;
}

export interface Ticket {
  id: string;
  userId: string; // Foreign Key linking to UserProfile.id (or user_id)
  
  // Customer/Location Info
  customerName: string;
  locationName: string;
  
  // Technical Details
  taskId: string;
  serviceRequest: string; // INC / SR
  hostname: string;
  serialNumber: string; // N. Serie
  subject: string;
  
  // Support Details
  analystName: string;
  supportStartTime: string;
  supportEndTime: string;
  description: string; // Problem description
  analystAction: string; // Action taken
  
  // Checkboxes & Parts
  isDueCall: boolean;      // Ligação Devida
  usedACFS: boolean;       // Utilizou ACFS
  hasInkStaining: boolean; // Ocorreu Entintamento
  partReplaced: boolean;   // Foi trocado peça?
  partDescription?: string;

  // New Tags
  tagVLDD: boolean;        // #VLDD#
  tagNLVDD: boolean;       // #NLVDD#
  
  // Validation Extra Fields
  testWithCard?: boolean;
  sicWithdrawal?: boolean; // Saques
  sicDeposit?: boolean;    // Depositos
  sicSensors?: boolean;    // Sensoriamento
  sicSmartPower?: boolean; // Smartpower
  
  // Client Witness Info
  clientWitnessName?: string;
  clientWitnessId?: string; // Matricula
  
  // Validation Info (Escalation)
  validatedBy?: string;
  validatedAt?: Date;

  // AI & System
  aiSuggestedSolution?: string;
  status: TicketStatus;
  priority: TicketPriority;
  isEscalated: boolean;
  isTigerTeam: boolean; // Flag for #198 Tiger Team
  createdAt: Date;
  
  // Adicionais para o ticket se vinculados ao ativo
  // Fix: Added termId to Ticket interface to ensure compatibility with Asset data and database schema
  termId?: string;
  filial?: string;
  codSite?: string;
  equipTipo2?: string;
  produto?: string;
}

export type ViewState = 'dashboard' | 'new-ticket' | 'escalations' | 'history' | 'settings' | 'tiger-team' | 'assets';
