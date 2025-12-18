
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Ticket, UserProfile, TicketStatus, TicketPriority } from '../types';

const VIRTUAL_DOMAIN = '@sys.local';

export const DataManager = {
  // --- AUTHENTICATION ---
  
  authenticate: async (username: string, password: string): Promise<UserProfile> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.");
    }

    const email = username.includes('@') ? username : `${username}${VIRTUAL_DOMAIN}`;
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) throw new Error(authError.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : authError.message);
    if (!authData.user) throw new Error('Erro ao obter sessão de usuário.');

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

      const { data: { session } } = await supabase.auth.getSession();
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
      if (isSupabaseConfigured) await supabase.auth.signOut();
  },

  // --- USERS MANAGEMENT ---

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

      const { error } = await tempClient.auth.signUp({
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
     const { error: authError } = await supabase.auth.updateUser({ password: newPass });
     if (authError) throw authError;

     const { data: { user } } = await supabase.auth.getUser();
     if (user) {
         await supabase
            .from('user_profiles')
            .update({ must_change_password: false })
            .eq('id', user.id);
     }
  },

  // --- TICKETS MANAGEMENT ---

  getTickets: async (): Promise<Ticket[]> => {
    if (!isSupabaseConfigured) return [];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('nivel')
        .eq('id', user.id)
        .single();

    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    const isAdmin = profile?.nivel === 'Admin';

    if (!isAdmin) {
        query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        customerName: t.customer_name,
        locationName: t.location_name,
        taskId: t.task_id,
        serviceRequest: t.service_request,
        hostname: t.hostname,
        subject: t.subject,
        analystName: t.analyst_name,
        supportStartTime: t.support_start_time,
        supportEndTime: t.support_end_time,
        description: t.description,
        analystAction: t.analyst_action,
        isDueCall: t.is_due_call,
        usedACFS: t.used_acfs,
        hasInkStaining: t.has_ink_staining,
        partReplaced: t.part_replaced,
        partDescription: t.part_description,
        tagVLDD: t.tag_vldd,
        tagNLVDD: t.tag_nlvdd,
        testWithCard: t.test_with_card,
        sicWithdrawal: t.sic_withdrawal,
        sicDeposit: t.sic_deposit,
        sicSensors: t.sic_sensors,
        sicSmartPower: t.sic_smart_power,
        clientWitnessName: t.client_witness_name,
        clientWitnessId: t.client_witness_id,
        validatedBy: t.validated_by,
        validatedAt: t.validated_at ? new Date(t.validated_at) : undefined,
        aiSuggestedSolution: t.ai_suggested_solution,
        status: t.status,
        priority: t.priority,
        isEscalated: t.is_escalated,
        isTigerTeam: t.is_tiger_team || false,
        createdAt: new Date(t.created_at),
    }));
  },

  addTicket: async (ticket: Ticket): Promise<void> => {
      if (!isSupabaseConfigured) return;
      const dbPayload = {
        user_id: ticket.userId,
        customer_name: ticket.customerName,
        location_name: ticket.locationName,
        task_id: ticket.taskId,
        service_request: ticket.serviceRequest,
        hostname: ticket.hostname,
        subject: ticket.subject,
        analyst_name: ticket.analystName,
        support_start_time: ticket.supportStartTime || null,
        support_end_time: ticket.supportEndTime || null,
        description: ticket.description,
        analyst_action: ticket.analystAction,
        is_due_call: ticket.isDueCall,
        used_acfs: ticket.usedACFS,
        has_ink_staining: ticket.hasInkStaining,
        part_replaced: ticket.partReplaced,
        part_description: ticket.partDescription,
        tag_vldd: ticket.tagVLDD,
        tag_nlvdd: ticket.tagNLVDD,
        client_witness_name: ticket.clientWitnessName,
        client_witness_id: ticket.clientWitnessId,
        status: ticket.status,
        priority: ticket.priority,
        is_escalated: ticket.isEscalated,
        is_tiger_team: ticket.isTigerTeam,
        ai_suggested_solution: ticket.aiSuggestedSolution
      };

      const { error } = await supabase.from('tickets').insert([dbPayload]);
      if (error) throw error;
  },

  updateTicket: async (updatedTicket: Ticket): Promise<void> => {
      if (!isSupabaseConfigured) return;
      const dbPayload = {
        task_id: updatedTicket.taskId,
        service_request: updatedTicket.serviceRequest,
        hostname: updatedTicket.hostname,
        customer_name: updatedTicket.customerName,
        description: updatedTicket.description,
        analyst_action: updatedTicket.analystAction,
        part_replaced: updatedTicket.partReplaced,
        part_description: updatedTicket.partDescription,
        tag_vldd: updatedTicket.tagVLDD,
        tag_nlvdd: updatedTicket.tagNLVDD,
        test_with_card: updatedTicket.testWithCard,
        sic_withdrawal: updatedTicket.sicWithdrawal,
        sic_deposit: updatedTicket.sicDeposit,
        sic_sensors: updatedTicket.sicSensors,
        sic_smart_power: updatedTicket.sicSmartPower,
        client_witness_name: updatedTicket.clientWitnessName,
        client_witness_id: updatedTicket.clientWitnessId,
        status: updatedTicket.status,
        is_tiger_team: updatedTicket.isTigerTeam,
        validated_at: new Date().toISOString(),
      };

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
