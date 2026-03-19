
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

        const { data, error } = await supabase.from('assets').upsert(chunk, { 
            onConflict: 'hostname',
            ignoreDuplicates: true 
        }).select('hostname');
        
        if (error) {
            console.error("Erro no lote de upsert:", error);
            throw error;
        }
        totalInserted += (data?.length || 0);
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

  // NAT DATA
  getNatEntries: async (): Promise<any[]> => {
    if (!isSupabaseConfigured) return [];
    
    let allEntries: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase
            .from('nat_entries')
            .select('*')
            .range(from, from + step - 1)
            .order('hostname', { ascending: true });
            
        if (error) throw error;
        
        if (data && data.length > 0) {
          allEntries = [...allEntries, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
      
      return allEntries.map(n => ({
          id: n.id,
          hostname: n.hostname,
          modelo: n.modelo,
          serie: n.serie,
          filial: n.filial,
          createdAt: n.created_at ? new Date(n.created_at) : undefined
      }));
    } catch (err) {
      console.error("Erro ao buscar NAT:", err);
      return [];
    }
  },

  upsertNatEntries: async (entries: any[]) => {
    if (!isSupabaseConfigured) return 0;
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
        const chunk = entries.slice(i, i + batchSize).map(n => ({
            hostname: n.hostname,
            modelo: n.modelo,
            serie: n.serie,
            filial: n.filial,
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase.from('nat_entries').upsert(chunk, { 
            onConflict: 'hostname',
            ignoreDuplicates: true 
        }).select('hostname');
        
        if (error) {
            console.error("Erro no lote de upsert NAT:", error);
            throw error;
        }
        totalInserted += (data?.length || 0);
    }
    return totalInserted;
  },

  clearNatEntries: async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('nat_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
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
  },

  // VERIFICAR SE A COLUNA FILIAL EXISTE
  verifyFilialColumn: async (): Promise<{ exists: boolean; error?: string }> => {
    if (!isSupabaseConfigured) return { exists: false, error: "Supabase não configurado" };
    try {
      const { error } = await supabase.from('tickets').select('filial').limit(1);
      if (error) {
        // Código 42703 é "undefined_column" no PostgreSQL
        if (error.code === '42703') return { exists: false };
        throw error;
      }
      return { exists: true };
    } catch (err: any) {
      console.error("Erro ao verificar coluna filial:", err);
      return { exists: false, error: err.message };
    }
  },

  fixMissingFiliais: async (): Promise<number> => {
    if (!isSupabaseConfigured) return 0;
    
    try {
      // 1. Verificar se a coluna existe primeiro
      const { exists, error: verifyError } = await DataManager.verifyFilialColumn();
      if (!exists) {
        throw new Error(verifyError || "A coluna 'filial' não existe na tabela 'tickets'. Por favor, execute o script SQL no dashboard do Supabase.");
      }

      // 2. Get all assets to build lookup maps
      const assets = await DataManager.getAssets();
      const hostnameMap = new Map<string, string>(); // hostname -> filial
      const serialMap = new Map<string, string>();   // serial -> filial
      
      assets.forEach(a => {
        if (a.hostname && a.filial) hostnameMap.set(a.hostname.toLowerCase(), a.filial);
        if (a.serialNumber && a.filial) serialMap.set(a.serialNumber.toLowerCase(), a.filial);
      });

      // 2. Get all tickets without filial
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, hostname, n_serie, filial')
        .or('filial.is.null,filial.eq.""');

      if (error) throw error;
      if (!tickets || tickets.length === 0) return 0;

      let updatedCount = 0;
      // Process in batches to avoid overwhelming the connection
      const batchSize = 20;
      for (let i = 0; i < tickets.length; i += batchSize) {
        const chunk = tickets.slice(i, i + batchSize);
        const updates = chunk.map(async (ticket) => {
          let foundFilial = null;
          
          const hostname = ticket.hostname?.toLowerCase();
          if (hostname && hostnameMap.has(hostname)) {
            foundFilial = hostnameMap.get(hostname);
          } else {
            const serial = ticket.n_serie?.toLowerCase();
            if (serial && serialMap.has(serial)) {
              foundFilial = serialMap.get(serial);
            }
          }

          if (foundFilial) {
            const { error: updateError } = await supabase
              .from('tickets')
              .update({ filial: foundFilial })
              .eq('id', ticket.id);
            
            if (!updateError) return true;
          }
          return false;
        });

        const results = await Promise.all(updates);
        updatedCount += results.filter(Boolean).length;
      }
      
      return updatedCount;
    } catch (err) {
      console.error("Erro ao corrigir filiais:", err);
      throw err;
    }
  }
};
