import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewTicketForm } from './components/NewTicketForm';
import { EscalationList } from './components/EscalationList';
import { HistoryList } from './components/HistoryList';
import { LoginPage } from './components/LoginPage';
import { Settings } from './components/Settings';
import { ChangePassword } from './components/ChangePassword';
import { Ticket, ViewState, UserProfile, TicketStatus } from './types';
import { Menu, X, Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from './lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // For Admin settings
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  // 1. Handle Authentication Session
  useEffect(() => {
    const checkSession = async () => {
      // If no valid URL is configured, skip network check to avoid "Failed to fetch"
      if (!isSupabaseConfigured) {
          console.warn("Supabase not configured. Entering config/demo state.");
          setSessionLoading(false);
          setConfigError(true);
          return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setSessionLoading(false);
        }
      } catch (err) {
        console.warn("Supabase connection check failed:", err);
        setSessionLoading(false);
        // Fallback if we missed the config check or network failed
        setConfigError(true);
      }
    };

    checkSession();

    // Only set up listener if configured
    if (isSupabaseConfigured) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            fetchUserProfile(session.user.id);
        } else {
            setCurrentUser(null);
            setSessionLoading(false);
        }
        });
        return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Fetch User Profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
         console.error('Error fetching profile:', error);
      }
      
      if (data) {
        // Map snake_case from DB to camelCase for TS
        const profile: UserProfile = {
            id: data.id,
            name: data.name,
            username: data.username,
            nivel: data.nivel,
            mustChangePassword: data.must_change_password
        };

        setCurrentUser(profile);
        fetchTickets(); // Load tickets once user is known
        if (profile.nivel === 'Admin') fetchAllUsers();
      }
    } catch (e) {
        console.error("Profile fetch error", e);
    } finally {
      setSessionLoading(false);
    }
  };

  // 3. Fetch Tickets (Mapping Snake_case DB to CamelCase App)
  const fetchTickets = async () => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      showNotification('Erro ao carregar chamados.');
      return;
    }

    if (data) {
      // Map DB columns to TypeScript Interface
      const mappedTickets: Ticket[] = data.map((t: any) => ({
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
        sic_smart_power: t.sic_smart_power,
        clientWitnessName: t.client_witness_name,
        clientWitnessId: t.client_witness_id,
        validatedBy: t.validated_by,
        validatedAt: t.validated_at ? new Date(t.validated_at) : undefined,
        aiSuggestedSolution: t.ai_suggested_solution,
        status: t.status,
        priority: t.priority,
        isEscalated: t.is_escalated,
        createdAt: new Date(t.created_at),
      }));
      setTickets(mappedTickets);
    }
  };

  const fetchAllUsers = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.from('user_profiles').select('*');
      if (data) {
          const mappedUsers: UserProfile[] = data.map((u: any) => ({
              id: u.id,
              name: u.name,
              username: u.username,
              nivel: u.nivel,
              mustChangePassword: u.must_change_password
          }));
          setUsers(mappedUsers);
      }
  };

  // 4. Create Ticket (Mapping CamelCase to Snake_case)
  const handleCreateTicket = async (ticket: Ticket) => {
    if (!currentUser) return;

    // Demo Mode: Just add to local state
    if (!isSupabaseConfigured) {
        setTickets(prev => [ticket, ...prev]);
        showNotification("Chamado registrado (Modo Demo).");
        setCurrentView('dashboard');
        return;
    }

    const dbPayload = {
        user_id: currentUser.id,
        customer_name: ticket.customerName,
        location_name: ticket.locationName,
        task_id: ticket.taskId,
        service_request: ticket.serviceRequest,
        hostname: ticket.hostname,
        subject: ticket.subject,
        analyst_name: ticket.analystName,
        support_start_time: ticket.supportStartTime,
        support_end_time: ticket.supportEndTime,
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
        ai_suggested_solution: ticket.aiSuggestedSolution
    };

    const { data, error } = await supabase.from('tickets').insert([dbPayload]).select();

    if (error) {
        console.error('Error creating ticket:', error);
        showNotification('Erro ao salvar chamado.');
    } else {
        fetchTickets();
        showNotification("Chamado registrado com sucesso!");
        setCurrentView('dashboard');
    }
  };

  // 5. Update/Resolve Ticket
  const handleResolveTicket = async (updatedTicket: Ticket) => {
    // Demo Mode
    if (!isSupabaseConfigured) {
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? { ...updatedTicket, status: updatedTicket.status || TicketStatus.RESOLVED } : t));
        showNotification("Chamado atualizado (Modo Demo).");
        return;
    }

    const dbPayload = {
        task_id: updatedTicket.taskId, // Allow editing identifiers during validation
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
        status: updatedTicket.status || TicketStatus.RESOLVED, // Allow status CLOSED or RESOLVED
        validated_at: new Date().toISOString(),
        validated_by: currentUser?.name
    };

    const { error } = await supabase
        .from('tickets')
        .update(dbPayload)
        .eq('id', updatedTicket.id);

    if (error) {
        console.error('Error updating ticket:', error);
        showNotification('Erro ao validar chamado.');
    } else {
        fetchTickets();
        const msg = updatedTicket.status === TicketStatus.CLOSED ? 'Chamado fechado manualmente.' : `Chamado TASK-${updatedTicket.taskId} validado e resolvido.`;
        showNotification(msg);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
        await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setTickets([]);
  };

  // Logic to Enforce Password Change
  const handleForcePasswordChange = async (newPassword: string) => {
    if (!currentUser) return;

    if (!isSupabaseConfigured) {
        // Demo Mode Simulation
        setCurrentUser({ ...currentUser, mustChangePassword: false });
        showNotification("Senha alterada (Modo Demo).");
        return;
    }

    // 1. Update Auth Password (Supabase User)
    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
    if (authError) throw authError;

    // 2. Update Profile Table (must_change_password = false)
    const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ must_change_password: false })
        .eq('id', currentUser.id);

    if (profileError) {
        console.error("Failed to update profile status", profileError);
        // We continue anyway since auth password was changed
    }

    // 3. Update Local State
    setCurrentUser(prev => prev ? ({ ...prev, mustChangePassword: false }) : null);
    showNotification("Senha atualizada com sucesso!");
  };

  // Special handler for Demo Mode Login
  const handleDemoLogin = () => {
      setConfigError(false);
      setCurrentUser({
          id: 'demo-user-id',
          name: 'Admin Demo',
          username: 'admin@demo.com',
          nivel: 'Admin',
          mustChangePassword: false
      });
      // Add some sample data for demo
      setTickets([
          {
            id: 'demo-1',
            userId: 'demo-user-id',
            customerName: 'Loja Exemplo 01',
            locationName: 'São Paulo - SP',
            taskId: 'TASK-1001',
            serviceRequest: 'INC-500',
            hostname: 'WK-100',
            subject: '1200 - Duvida técnica',
            analystName: 'Admin Demo',
            supportStartTime: new Date().toISOString(),
            supportEndTime: '',
            description: 'Sistema lento ao iniciar.',
            analystAction: 'Limpeza de cache realizada.',
            isDueCall: true,
            usedACFS: false,
            hasInkStaining: false,
            partReplaced: false,
            tagVLDD: false,
            tagNLVDD: false,
            status: 'Aberto', // Mapped from Enum manually for demo
            priority: 'Média', // Mapped from Enum manually
            isEscalated: false,
            createdAt: new Date()
          } as any
      ]);
  };

  const handleAddUser = async (newUserProfile: UserProfile, password?: string) => {
      if (!isSupabaseConfigured) {
          // Demo mode simulation
          setUsers(prev => [...prev, { ...newUserProfile, mustChangePassword: true }]);
          showNotification("Usuário criado (Demo).");
          return;
      }

      if (!password || password.length < 6) {
          showNotification("Erro: A senha deve ter no mínimo 6 caracteres.");
          return;
      }

      // CORREÇÃO: Criar cliente isolado para evitar conflito com sessão do admin logado
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
          }
      });
      
      // Limpeza robusta do username para gerar email
      // Remove espaços, converte para minúsculas, remove acentos
      const cleanInput = newUserProfile.username
          .trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/[^a-zA-Z0-9@._-]/g, "") // Remove non-standard chars
          .toLowerCase();
      
      let email = "";
      if (cleanInput.includes('@')) {
          email = cleanInput;
      } else {
          email = `${cleanInput}@helpdesk.com`;
      }

      try {
          // 1. Tentar criar o usuário no Auth
          const { data, error } = await tempClient.auth.signUp({
              email: email,
              password: password,
              options: {
                  data: {
                      name: newUserProfile.name,
                      nivel: newUserProfile.nivel,
                      mustChangePassword: true
                  }
              }
          });

          // Tratamento robusto de erros
          if (error) {
              console.error("Auth Error:", error); 
              
              if (error.message.includes("registered") || error.message.includes("exists")) {
                  showNotification("Aviso: Email já cadastrado no sistema.");
                  return; 
              }
              // Display raw error for better debugging of "invalid format" issues
              if (error.message.includes("invalid") || error.message.includes("format")) {
                 showNotification(`Erro Supabase: ${error.message} (${email})`);
                 return;
              }
              if (error.message.includes("Password")) {
                  showNotification(`Erro na senha: ${error.message}`);
                  return;
              }
              if (error.message.includes("Database")) {
                  showNotification("Erro no banco de dados. Verifique logs ou contate suporte.");
                  return;
              }
              
              // Fallback for other errors
              showNotification(`Erro: ${error.message}`);
              return;
          }

          // 2. Auth criado com sucesso 
          if (data.user) {
              if (!data.session) {
                  showNotification("Usuário criado com sucesso!");
              } else {
                  showNotification("Usuário cadastrado com sucesso!");
              }
              
              // Pequeno delay para garantir que o banco processou a trigger
              setTimeout(fetchAllUsers, 1000);
          }

      } catch (err: any) {
          console.error("Error creating user:", err);
          showNotification(`Erro no cadastro: ${err.message}`);
      }
  };

  const handleDeleteUser = async (userId: string) => {
     if (!isSupabaseConfigured) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showNotification("Usuário removido (Demo).");
        return;
     }

     const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
     
     if (error) {
         showNotification("Erro ao remover perfil.");
         console.error(error);
     } else {
         showNotification("Acesso do usuário revogado.");
         fetchAllUsers();
     }
  };

  const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 5000); // Increased time for easier reading
  };

  if (sessionLoading) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
      );
  }

  // If no user is logged in, show Login Page
  if (!currentUser) {
    return <LoginPage onDemoLogin={handleDemoLogin} />;
  }

  // FORCE PASSWORD CHANGE SCREEN
  if (currentUser.mustChangePassword) {
      return (
          <>
            {notification && (
                <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}
            <ChangePassword 
                username={currentUser.name} 
                onPasswordChange={handleForcePasswordChange} 
            />
          </>
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20 sticky top-0">
            <span className="font-bold text-gray-800 text-lg">HelpDesk AI</span>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-100"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </header>

        {/* Top Bar with User Info - Desktop only */}
        <div className="hidden md:flex justify-end items-center px-8 py-3 bg-white border-b border-gray-100 gap-4">
             {/* Config Warning */}
             {!isSupabaseConfigured && (
                 <div className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" />
                     Modo Demo (Sem Backend)
                 </div>
             )}
             
             <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
                <div className="flex items-center justify-end gap-1">
                    <div className={`w-2 h-2 rounded-full ${currentUser.nivel === 'Admin' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{currentUser.nivel}</p>
                </div>
             </div>
             <button 
               onClick={handleLogout}
               className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded transition-colors"
             >
               Sair
             </button>
        </div>

        {/* Content Area - Responsive Padding */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-8 relative w-full">
            
            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full shrink-0"></div>
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}

            {currentView === 'dashboard' && <Dashboard tickets={tickets} />}
            {currentView === 'new-ticket' && <NewTicketForm onSubmit={handleCreateTicket} currentUser={currentUser} />}
            {currentView === 'escalations' && <EscalationList tickets={tickets} onResolve={handleResolveTicket} />}
            {currentView === 'history' && <HistoryList tickets={tickets} />}
            {currentView === 'settings' && currentUser.nivel === 'Admin' && (
                <Settings users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
            )}
            
            {/* Bottom spacer for mobile scrolling */}
            <div className="h-10 md:h-0"></div>
        </div>
      </main>
    </div>
  );
};

export default App;