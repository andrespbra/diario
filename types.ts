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

// Mapped to Supabase table 'perfis_usuario'
export interface UserProfile {
  id: string;       // uuid (PK of perfis_usuario)
  user_id?: string; // uuid (FK to auth.users)
  username: string; // login/email
  name: string;
  nivel: UserLevel; // 'Analista' (Default) or 'Admin'
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
  createdAt: Date;
}

export type ViewState = 'dashboard' | 'new-ticket' | 'escalations' | 'history' | 'settings';