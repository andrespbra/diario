
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
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
        status: cleanValue(ticket.status) || 'Aberto',
        priority: cleanValue(ticket.priority) || 'Média',
        is_escalated: !!ticket.isEscalated,
        is_tiger_team: !!ticket.isTigerTeam,
        ai_suggested_solution: cleanValue(ticket.aiSuggestedSolution),
        validated_by: cleanValue(ticket.validatedBy),
        validated_at: ticket.validatedAt instanceof Date ? ticket.validatedAt.toISOString() : cleanValue(ticket.validatedAt)
    };
};

export const DataManager = {
  authenticate: async (username: string, password: string): Promise<UserProfile> => {
    if (!isSupabaseConfigured) throw new Error("Supabase não configurado.");

    const email = username.includes('@') ? username : `${username}${VIRTUAL_DOMAIN}`;
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) throw new Error("Falha no Login: Usuário ou senha incorretos.");
    if (!authData.user) throw new Error('Usuário não encontrado.');

    // Busca perfil
    const { data: profile, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (pError || !profile) {
        console.warn("Perfil não encontrado em user_profiles.");
        return {
            id: authData.user.id,
            name: username,
            username: username,
            nivel: 'Analista',
            mustChangePassword: false
        };
    }

    return {
        id: profile.id,
        name: profile.name,
        username: profile.username || username,
        nivel: profile.nivel,
        mustChangePassword: profile.must_change_password
    };
  },

  getSession: async (): Promise<UserProfile | null> => {
      if (!isSupabaseConfigured) return null;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error || !profile) return null;
      
      return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          nivel: profile.nivel,
          mustChangePassword: profile.must_change_password
      };
  },

  logout: async () => {
      if (isSupabaseConfigured) await supabase.auth.signOut();
  },

  getTickets: async (): Promise<Ticket[]> => {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "tickets" does not exist')) {
            throw new Error("Tabela 'tickets' não encontrada. Você executou o Script SQL no Supabase?");
        }
        throw new Error(`Erro ao buscar tickets: ${error.message}`);
    }

    return (data || []).map((t: any) => ({
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

  addTicket: async (ticket: Ticket) => {
      const { error } = await supabase.from('tickets').insert([preparePayload(ticket)]);
      if (error) {
          if (error.message.includes('relation "tickets" does not exist')) {
              throw new Error("Erro: A tabela 'tickets' não existe no banco de dados.");
          }
          throw error;
      }
  },

  updateTicket: async (ticket: Ticket) => {
      const { error } = await supabase.from('tickets').update(preparePayload(ticket)).eq('id', ticket.id);
      if (error) throw error;
  },

  deleteTicket: async (id: string) => {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
  },

  getUsers: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) {
        if (error.message.includes('relation "user_profiles" does not exist')) {
            throw new Error("Tabela 'user_profiles' não encontrada.");
        }
        throw error;
    }
    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        nivel: u.nivel,
        mustChangePassword: u.must_change_password
    }));
  },

  addUser: async (newUser: UserProfile, password?: string) => {
    const email = newUser.username.includes('@') ? newUser.username : `${newUser.username}${VIRTUAL_DOMAIN}`;
    const { error } = await supabase.auth.signUp({
      email,
      password: password || 'Mudar123!',
      options: { 
          data: { 
              name: newUser.name, 
              username: newUser.username,
              nivel: newUser.nivel 
          } 
      }
    });
    if (error) throw error;
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  changePassword: async (username: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('user_profiles').update({ must_change_password: false }).eq('id', user.id);
    }
  }
};
