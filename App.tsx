
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewTicketForm } from './components/NewTicketForm';
import { EscalationList } from './components/EscalationList';
import { HistoryList } from './components/HistoryList';
import { TigerTeam } from './components/TigerTeam';
import { LoginPage } from './components/LoginPage';
import { Settings } from './components/Settings';
import { ChangePassword } from './components/ChangePassword';
import { Ticket, ViewState, UserProfile, TicketStatus } from './types';
import { Menu, X, Loader2, Cloud, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { DataManager } from './services/dataManager';
import { isSupabaseConfigured } from './lib/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured) {
            setSessionLoading(false);
            return;
        }

        const user = await DataManager.getSession();
        if (user) {
            setCurrentUser(user);
            fetchData(user);
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();
  }, []);

  const fetchData = async (user: UserProfile) => {
      setDataLoading(true);
      setGlobalError(null);
      try {
        const ticketData = await DataManager.getTickets(user.id, user.nivel === 'Admin');
        setTickets(ticketData);
        
        if (user.nivel === 'Admin') {
            try {
                const userData = await DataManager.getUsers();
                setUsers(userData);
            } catch (userErr) {
                console.warn("Could not fetch users", userErr);
            }
        }
      } catch (e: any) {
          console.error("Error fetching data", e);
          setGlobalError(e.message || 'Erro ao carregar dados do banco.');
      } finally {
          setDataLoading(false);
      }
  };

  const handleLoginSuccess = (user: UserProfile) => {
      setCurrentUser(user);
      fetchData(user);
  };

  const handleLogout = async () => {
    await DataManager.logout();
    setCurrentUser(null);
    setTickets([]);
  };

  const handleCreateTicket = async (ticket: Ticket) => {
    if (!currentUser) return;
    try {
        await DataManager.addTicket(ticket);
        showNotification("Chamado registrado com sucesso!");
        setCurrentView('dashboard');
        // Tenta atualizar a lista, mas não trava o usuário se der erro no refresh
        try {
            await fetchData(currentUser);
        } catch (fetchErr) {
            console.warn("Ticket salvo, mas falha ao atualizar lista.");
        }
    } catch (error: any) {
        console.error("Erro ao criar ticket:", error);
        alert(`Erro Crítico ao Salvar: ${error.message}\n\nVerifique se você executou o SQL de reparo no Supabase.`);
        showNotification(`Erro ao salvar: ${error.message}`);
    }
  };

  const handleResolveTicket = async (updatedTicket: Ticket) => {
    try {
        await DataManager.updateTicket(updatedTicket);
        if (currentUser) await fetchData(currentUser);
        showNotification("Chamado atualizado.");
    } catch (error: any) {
        console.error(error);
        showNotification(`Erro ao atualizar: ${error.message}`);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await DataManager.deleteTicket(ticketId);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      showNotification("Chamado excluído.");
    } catch (error: any) {
      console.error(error);
      showNotification(`Erro ao excluir: ${error.message}`);
    }
  };

  const handleForcePasswordChange = async (newPassword: string) => {
    if (!currentUser) return;
    try {
        await DataManager.changePassword(currentUser.username, newPassword);
        setCurrentUser(prev => prev ? ({ ...prev, mustChangePassword: false }) : null);
        showNotification("Senha atualizada!");
    } catch (error: any) {
        showNotification(error.message);
    }
  };

  const handleAddUser = async (newUserProfile: UserProfile, password?: string) => {
      try {
          await DataManager.addUser(newUserProfile, password);
          showNotification(`Usuário criado!`);
          if (currentUser) await fetchData(currentUser);
      } catch (err: any) {
          showNotification(`Erro no cadastro: ${err.message}`);
      }
  };

  const handleDeleteUser = async (userId: string) => {
     try {
         await DataManager.deleteUser(userId);
         showNotification("Usuário removido.");
         if (currentUser) await fetchData(currentUser);
     } catch (error: any) {
         showNotification(`Erro: ${error.message}`);
     }
  };

  const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 5000);
  };

  if (sessionLoading) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Validando conexão...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentUser.mustChangePassword) {
      return (
          <ChangePassword 
                username={currentUser.username} 
                onPasswordChange={handleForcePasswordChange} 
          />
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
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20 sticky top-0">
            <span className="font-bold text-gray-800 text-lg">Diario de Bordo</span>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-100"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </header>

        <div className="hidden md:flex justify-between items-center px-8 py-3 bg-white border-b border-gray-100 gap-4">
             <div className="flex items-center gap-4">
                {isSupabaseConfigured ? (
                    <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1 border border-blue-100">
                        <Cloud className="w-3 h-3" />
                        Online
                    </div>
                ) : (
                    <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Offline
                    </div>
                )}
                {dataLoading && (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sincronizando...
                    </div>
                )}
             </div>
             
             <div className="flex items-center gap-6">
                <button 
                    onClick={() => fetchData(currentUser)} 
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Atualizar dados"
                >
                    <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                </button>
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{currentUser.nivel}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded transition-colors"
                >
                  Sair
                </button>
             </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative w-full">
            
            {globalError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <div>
                            <p className="text-sm font-bold">Aviso de Banco de Dados</p>
                            <p className="text-xs opacity-90">{globalError}</p>
                        </div>
                    </div>
                    <button onClick={() => fetchData(currentUser)} className="text-xs font-bold bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors">Tentar novamente</button>
                </div>
            )}

            {notification && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[100] bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">{notification}</span>
                </div>
            )}

            {!globalError && tickets.length === 0 && !dataLoading && currentView === 'dashboard' && (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                        <Database className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div className="max-w-xs space-y-2">
                        <h2 className="text-xl font-bold text-gray-800">Seu Banco está Vazio</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">Parabéns! Você conectou com sucesso, mas ainda não há registros. Comece criando seu primeiro atendimento.</p>
                    </div>
                    <button 
                        onClick={() => setCurrentView('new-ticket')}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                        Novo Atendimento
                    </button>
                </div>
            )}

            {currentView === 'dashboard' && tickets.length > 0 && <Dashboard tickets={tickets} />}
            {currentView === 'new-ticket' && <NewTicketForm onSubmit={handleCreateTicket} currentUser={currentUser} />}
            {currentView === 'tiger-team' && <TigerTeam tickets={tickets} onResolve={handleResolveTicket} />}
            {currentView === 'escalations' && <EscalationList tickets={tickets} onResolve={handleResolveTicket} />}
            {currentView === 'history' && (
                <HistoryList 
                    tickets={tickets} 
                    onDelete={handleDeleteTicket} 
                    onUpdate={handleResolveTicket} 
                />
            )}
            {currentView === 'settings' && currentUser.nivel === 'Admin' && (
                <Settings users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
