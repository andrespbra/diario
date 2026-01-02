
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Ticket, UserProfile, TicketStatus, TicketPriority } from '../types';

const VIRTUAL_DOMAIN = '@sys.local';

const cleanValue = (val: any) => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'string' && val.trim() === '') return null;
    return val;
};

const preparePayload = (ticket: Partial<Ticket>) => {
    return {
        user_id: cleanValue(ticket.userId),
        customer_name: cleanValue(ticket.customerName),
        location_name: cleanValue(ticket.locationName),
        task_id: cleanValue(ticket.taskId),
        service_request: cleanValue(ticket.serviceRequest),
        hostname: cleanValue(ticket.hostname),
        n_serie: cleanValue(ticket.serialNumber),
        subject: cleanValue(ticket.subject),
        analyst_name: cleanValue(ticket.analystName),
        support_start_time: cleanValue(ticket.supportStartTime),
        support_end_time: cleanValue(ticket.supportEndTime),
        description: cleanValue(ticket.description),
        analyst_action: cleanValue(ticket.analystAction),
        is_due_call: !!ticket.isDueCall,
        used_acfs: !!ticket.usedACFS,
        has_ink_staining: !!ticket.hasInkStaining,
        part_replaced: !!ticket.partReplaced,
        part_description: cleanValue(ticket.partDescription),
        tag_vldd: !!ticket.tagVLDD,
        tag_nlvdd: !!ticket.tagNLVDD,
        test_with_card: !!ticket.testWithCard,
        sic_withdrawal: !!ticket.sicWithdrawal,
        sic_deposit: !!ticket.sicDeposit,
        sic_sensors: !!ticket.sicSensors,
        sic_smart_power: !!ticket.sicSmartPower,
        client_witness_name: cleanValue(ticket.clientWitnessName),
        client_witness_id: cleanValue(ticket.clientWitnessId),
        status: cleanValue(ticket.status),
        priority: cleanValue(ticket.priority),
        is_escalated: !!ticket.isEscalated,
        is_tiger_team: !!ticket.isTigerTeam,
        ai_suggested_solution: cleanValue(ticket.aiSuggestedSolution),
        validated_by: cleanValue(ticket.validatedBy),
        validated_at: ticket.validatedAt instanceof Date ? ticket.validatedAt.toISOString() : cleanValue(ticket.validatedAt)
    };
};

export const DataManager = {
  authenticate: async (username: string, password: string): Promise<UserProfile> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase não configurado.");
    }

    const email = username.includes('@') ? username : `${username}${VIRTUAL_DOMAIN}`;
    
    const { data: authData, error: authError } = await (supabase.auth as any).signInWithPassword({
        email,
        password
    });

    if (authError) throw new Error(authError.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : authError.message);
    if (!authData.user) throw new Error('Erro ao obter sessão.');

    const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        return {
            id: authData.user.id,
            name: 'Usuário',
            username: username,
            nivel: 'Analista',
            mustChangePassword: false
        };
    }

    return {
        id: profileData.id,
        name: profileData.name,
        username: profileData.username || username,
        nivel: profileData.nivel,
        mustChangePassword: profileData.must_change_password
    };
  },

  getSession: async (): Promise<UserProfile | null> => {
      if (!isSupabaseConfigured) return null;

      const { data: { session } } = await (supabase.auth as any).getSession();
      if (!session?.user) return null;

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
          return {
              id: data.id,
              name: data.name,
              username: data.username,
              nivel: data.nivel,
              mustChangePassword: data.must_change_password
          };
      }
      return null;
  },

  logout: async (): Promise<void> => {
      if (isSupabaseConfigured) await (supabase.auth as any).signOut();
  },

  getUsers: async (): Promise<UserProfile[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) throw error;
    return data.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        nivel: u.nivel,
        mustChangePassword: u.must_change_password
    }));
  },

  addUser: async (user: UserProfile, password?: string): Promise<void> => {
      if (!isSupabaseConfigured) throw new Error("Database offline.");
      const email = user.username.includes('@') ? user.username : `${user.username}${VIRTUAL_DOMAIN}`;

      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
          }
      });

      const { error } = await (tempClient.auth as any).signUp({
          email: email,
          password: password || 'mudar123',
          options: {
              data: {
                  name: user.name,
                  nivel: user.nivel,
                  mustChangePassword: true
              }
          }
      });

      if (error) {
          if (error.message.includes("registered")) throw new Error("Usuário já existe.");
          throw error;
      }
  },

  updateUser: async (updatedUser: UserProfile): Promise<void> => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase
        .from('user_profiles')
        .update({
            name: updatedUser.name,
            nivel: updatedUser.nivel,
            must_change_password: updatedUser.mustChangePassword
        })
        .eq('id', updatedUser.id);
        
      if (error) throw error;
  },

  deleteUser: async (userId: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  changePassword: async (username: string, newPass: string): Promise<void> => {
     if (!isSupabaseConfigured) return;
     const { error: authError } = await (supabase.auth as any).updateUser({ password: newPass });
     if (authError) throw authError;

     const { data: { user } } = await (supabase.auth as any).getUser();
     if (user) {
         await supabase
            .from('user_profiles')
            .update({ must_change_password: false })
            .eq('id', user.id);
     }
  },

  getTickets: async (): Promise<Ticket[]> => {
    if (!isSupabaseConfigured) return [];
    
    const { data: authData } = await (supabase.auth as any).getUser();
    const user = authData?.user;
    if (!user) return [];

    // Tenta buscar o perfil, mas não bloqueia se falhar
    let isAdmin = false;
    try {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('nivel')
            .eq('id', user.id)
            .single();
        isAdmin = profile?.nivel === 'Admin';
    } catch (e) {
        console.warn("Could not fetch user profile for RLS mapping", e);
    }

    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
        // Query OR otimizada para garantir visibilidade total de:
        // 1. Meus próprios chamados
        // 2. Qualquer chamado do Tiger Team (para cooperação)
        // 3. Qualquer chamado Escalonado (para validação)
        query = query.or(`user_id.eq.${user.id},is_tiger_team.eq.true,is_escalated.eq.true`);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Erro Supabase na busca de tickets:", error);
        throw error;
    }

    if (!data) return [];

    return data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        customerName: t.customer_name || '',
        locationName: t.location_name || '',
        taskId: t.task_id || '',
        serviceRequest: t.service_request || '',
        hostname: t.hostname || '',
        serialNumber: t.n_serie || '',
        subject: t.subject || '',
        analystName: t.analyst_name || '',
        supportStartTime: t.support_start_time || '',
        supportEndTime: t.support_end_time || '',
        description: t.description || '',
        analystAction: t.analyst_action || '',
        isDueCall: !!t.is_due_call,
        usedACFS: !!t.used_acfs,
        hasInkStaining: !!t.has_ink_staining,
        partReplaced: !!t.part_replaced,
        partDescription: t.part_description || '',
        tagVLDD: !!t.tag_vldd,
        tagNLVDD: !!t.tag_nlvdd,
        testWithCard: !!t.test_with_card,
        sicWithdrawal: !!t.sic_withdrawal,
        sicDeposit: !!t.sic_deposit,
        sicSensors: !!t.sic_sensors,
        sicSmartPower: !!t.sic_smart_power,
        clientWitnessName: t.client_witness_name || '',
        clientWitnessId: t.client_witness_id || '',
        validatedBy: t.validated_by || '',
        validatedAt: t.validated_at ? new Date(t.validated_at) : undefined,
        aiSuggestedSolution: t.ai_suggested_solution || '',
        status: (t.status as TicketStatus) || TicketStatus.OPEN,
        priority: (t.priority as TicketPriority) || TicketPriority.MEDIUM,
        isEscalated: !!t.is_escalated,
        isTigerTeam: !!t.is_tiger_team,
        createdAt: t.created_at ? new Date(t.created_at) : new Date(),
    }));
  },

  addTicket: async (ticket: Ticket): Promise<void> => {
      if (!isSupabaseConfigured) return;
      const dbPayload = preparePayload(ticket);
      const { error } = await supabase.from('tickets').insert([dbPayload]);
      if (error) throw error;
  },

  updateTicket: async (updatedTicket: Ticket): Promise<void> => {
      if (!isSupabaseConfigured) return;
      if (!updatedTicket.id) throw new Error("ID do chamado ausente.");
      const dbPayload = preparePayload(updatedTicket);
      const { error } = await supabase
        .from('tickets')
        .update(dbPayload)
        .eq('id', updatedTicket.id);
      if (error) throw error;
  },

  deleteTicket: async (ticketId: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) throw error;
  }
};
