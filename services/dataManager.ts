
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Ticket, UserProfile, TicketStatus, TicketPriority, Asset } from '../types';

const VIRTUAL_DOMAIN = '@sys.local';

// Usuários locais para Modo de Demonstração/Desenvolvimento
const LOCAL_USERS: UserProfile[] = [
    { id: 'demo-admin-id', username: 'admin', name: 'Administrador Demo', nivel: 'Admin', mustChangePassword: false },
    { id: 'demo-analista-id', username: 'analista', name: 'Analista Demo', nivel: 'Analista', mustChangePassword: false }
];

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
        term_id: cleanValue(ticket.termId),
        filial: cleanValue(ticket.filial),
        cod_site: cleanValue(ticket.codSite),
        equip_tipo_2: cleanValue(ticket.equipTipo2),
        produto: cleanValue(ticket.produto),
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
        validated_at: ticket.validatedAt instanceof Date ? ticket.validatedAt.toISOString() : null
    };
};

export const DataManager = {
  // ATIVOS COM PAGINAÇÃO AUTOMÁTICA
  getAssets: async (): Promise<Asset[]> => {
    if (!isSupabaseConfigured) return [];
    
    let allAssets: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .range(from, from + step - 1)
            .order('hostname', { ascending: true });
            
        if (error) throw error;
        
        if (data && data.length > 0) {
          allAssets = [...allAssets, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
      
      return allAssets.map(a => ({
          id: a.id,
          termId: a.term_id,
          hostname: a.hostname,
          serialNumber: a.serial_number,
          locationName: a.location_name,
          filial: a.filial,
          codSite: a.cod_site,
          equipTipo2: a.equip_tipo_2,
          produto: a.produto,
          updatedAt: a.updated_at ? new Date(a.updated_at) : undefined
      }));
    } catch (err) {
      console.error("Erro ao buscar ativos:", err);
      return [];
    }
  },

  upsertAssets: async (assets: Asset[]) => {
    if (!isSupabaseConfigured) return 0;
    
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < assets.length; i += batchSize) {
        const chunk = assets.slice(i, i + batchSize).map(a => ({
            term_id: a.termId,
            hostname: a.hostname,
            serial_number: a.serialNumber,
            location_name: a.locationName,
            filial: a.filial,
            cod_site: a.codSite,
            equip_tipo_2: a.equipTipo2,
            produto: a.produto,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('assets').upsert(chunk, { 
            onConflict: 'hostname',
            ignoreDuplicates: false 
        });
        
        if (error) {
            console.error("Erro no lote de upsert:", error);
            throw error;
        }
        totalInserted += chunk.length;
    }
    return totalInserted;
  },

  searchAsset: async (term: string): Promise<Asset[]> => {
    if (!isSupabaseConfigured || term.length < 2) return [];
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .or(`hostname.ilike.%${term}%,serial_number.ilike.%${term}%,term_id.ilike.%${term}%`)
        .limit(8);
    if (error) return [];
    return (data || []).map(a => ({
        termId: a.term_id,
        hostname: a.hostname,
        serialNumber: a.serial_number,
        locationName: a.location_name,
        filial: a.filial,
        codSite: a.cod_site,
        equipTipo2: a.equip_tipo_2,
        produto: a.produto
    }));
  },

  // AUTENTICAÇÃO
  authenticate: async (username: string, password: string): Promise<UserProfile> => {
    if (!isSupabaseConfigured) {
        const found = LOCAL_USERS.find(u => u.username === username && password === username);
        if (found) return found;
        throw new Error("Credenciais incorretas (Dica: admin/admin)");
    }
    const email = username.includes('@') ? username : `${username}${VIRTUAL_DOMAIN}`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error("Login falhou: " + authError.message);

    try {
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', authData.user.id).single();
        return {
            id: authData.user.id,
            name: profile?.name || authData.user.user_metadata?.name || username,
            username: profile?.username || username,
            nivel: (profile?.nivel || authData.user.user_metadata?.nivel || 'Analista') as any,
            mustChangePassword: profile?.must_change_password || false
        };
    } catch (e) {
        return { id: authData.user.id, name: username, username, nivel: 'Analista', mustChangePassword: false };
    }
  },

  getSession: async (): Promise<UserProfile | null> => {
      if (!isSupabaseConfigured) return null;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).maybeSingle();
      return {
          id: session.user.id,
          name: profile?.name || 'Usuário',
          username: profile?.username || 'login',
          nivel: (profile?.nivel || 'Analista') as any,
          mustChangePassword: profile?.must_change_password || false
      };
  },

  logout: async () => { if (isSupabaseConfigured) await supabase.auth.signOut(); },

  getTickets: async (userId: string, isAdmin: boolean): Promise<Ticket[]> => {
    if (!isSupabaseConfigured) return [];
    
    let allTickets: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    try {
      while (hasMore) {
        let query = supabase.from('tickets').select('*');
        if (!isAdmin) query = query.eq('user_id', userId);
        
        const { data, error } = await query
            .range(from, from + step - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          allTickets = [...allTickets, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }

      return allTickets.map((t: any) => ({
          ...t,
          userId: t.user_id,
          customerName: t.customer_name,
          locationName: t.location_name,
          termId: t.term_id,
          serialNumber: t.n_serie,
          taskId: t.task_id,
          serviceRequest: t.service_request,
          analystName: t.analyst_name,
          supportStartTime: t.support_start_time,
          supportEndTime: t.support_end_time,
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
          status: t.status as TicketStatus,
          priority: t.priority as TicketPriority,
          isEscalated: t.is_escalated,
          isTigerTeam: t.is_tiger_team,
          createdAt: new Date(t.created_at),
          filial: t.filial,
          codSite: t.cod_site,
          equipTipo2: t.equip_tipo_2,
          produto: t.produto
      }));
    } catch (err) {
      console.error("Erro ao buscar tickets:", err);
      return [];
    }
  },

  addTicket: async (ticket: Ticket) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('tickets').insert([preparePayload(ticket)]);
      if (error) throw error;
  },

  updateTicket: async (ticket: Ticket) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('tickets').update(preparePayload(ticket)).eq('id', ticket.id);
      if (error) throw error;
  },

  deleteTicket: async (id: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
  },

  getUsers: async (): Promise<UserProfile[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) throw error;
    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        nivel: u.nivel as any,
        mustChangePassword: u.must_change_password
    }));
  },

  addUser: async (newUser: UserProfile, password?: string) => {
    if (!isSupabaseConfigured) return;
    const email = newUser.username.includes('@') ? newUser.username : `${newUser.username}${VIRTUAL_DOMAIN}`;
    const { error } = await supabase.auth.signUp({
      email,
      password: password || 'Mudar123!',
      options: { data: { name: newUser.name, username: newUser.username, nivel: newUser.nivel } }
    });
    if (error) throw error;
  },

  deleteUser: async (userId: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  changePassword: async (username: string, newPassword: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('user_profiles').update({ must_change_password: false }).eq('id', user.id);
  }
};
