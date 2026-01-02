
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
import { Menu, X, Loader2, Cloud, AlertTriangle, RefreshCw } from 'lucide-react';
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
        const ticketData = await DataManager.getTickets();
        setTickets(ticketData);
        
        if (user.nivel === 'Admin') {
            const userData = await DataManager.getUsers();
            setUsers(userData);
        }
      } catch (e: any) {
          console.error("Error fetching data", e);
          setGlobalError("Falha ao carregar dados do servidor. Verifique sua conexão.");
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
        await fetchData(currentUser);
        showNotification("Chamado registrado com sucesso!");
        setCurrentView('dashboard');
    } catch (error) {
        console.error(error);
        showNotification("Erro ao salvar chamado.");
    }
  };

  const handleResolveTicket = async (updatedTicket: Ticket) => {
    try {
        await DataManager.updateTicket(updatedTicket);
        if (currentUser) await fetchData(currentUser);
        const msg = updatedTicket.status === TicketStatus.CLOSED ? 'Chamado fechado.' : `Chamado TASK-${updatedTicket.taskId} atualizado.`;
        showNotification(msg);
    } catch (error) {
        console.error(error);
        showNotification("Erro ao atualizar chamado.");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await DataManager.deleteTicket(ticketId);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      showNotification("Chamado excluído com sucesso.");
    } catch (error) {
      console.error(error);
      showNotification("Erro ao excluir chamado.");
    }
  };

  const handleForcePasswordChange = async (newPassword: string) => {
    if (!currentUser) return;

    try {
        await DataManager.changePassword(currentUser.username, newPassword);
        setCurrentUser(prev => prev ? ({ ...prev, mustChangePassword: false }) : null);
        showNotification("Senha atualizada com sucesso!");
    } catch (error: any) {
        showNotification(error.message);
    }
  };

  const handleAddUser = async (newUserProfile: UserProfile, password?: string) => {
      if (!password || password.length < 6) {
          showNotification("Erro: A senha deve ter no mínimo 6 caracteres.");
          return;
      }

      try {
          await DataManager.addUser(newUserProfile, password);
          showNotification(`Usuário "${newUserProfile.username}" criado com sucesso!`);
          if (currentUser) await fetchData(currentUser);
      } catch (err: any) {
          console.error("Error creating user:", err);
          showNotification(`Erro no cadastro: ${err.message}`);
      }
  };

  const handleDeleteUser = async (userId: string) => {
     try {
         await DataManager.deleteUser(userId);
         showNotification("Usuário removido.");
         if (currentUser) await fetchData(currentUser);
     } catch (error) {
         showNotification("Erro ao remover usuário.");
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
                  <p className="text-slate-500 font-medium">Validando sessão...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentUser.mustChangePassword) {
      return (
          <>
            {notification && (
                <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}
            <ChangePassword 
                username={currentUser.username} 
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
                        Online (Cloud)
                    </div>
                ) : (
                    <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Desconectado
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
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-8 relative w-full">
            
            {globalError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">{globalError}</span>
                    </div>
                    <button onClick={() => fetchData(currentUser)} className="text-xs font-bold underline hover:no-underline">Tentar novamente</button>
                </div>
            )}

            {notification && (
                <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full shrink-0"></div>
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}

            {currentView === 'dashboard' && <Dashboard tickets={tickets} />}
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
            
            <div className="h-10 md:h-0"></div>
        </div>
      </main>
    </div>
  );
};

export default App;
