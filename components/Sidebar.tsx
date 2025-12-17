import React from 'react';
import { LayoutDashboard, PhoneCall, AlertTriangle, History, Headphones, Settings } from 'lucide-react';
import { ViewState, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentUser: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileOpen, setIsMobileOpen, currentUser }) => {
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'new-ticket', label: 'Novo Atendimento', icon: PhoneCall },
    { id: 'escalations', label: 'Escalonados', icon: AlertTriangle },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  // Only add Settings if user is Admin
  if (currentUser.nivel === 'Admin') {
    navItems.push({ id: 'settings', label: 'Configurações', icon: Settings });
  }

  const handleNav = (id: string) => {
    setView(id as ViewState);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Diario de<span className="text-indigo-400">Bordo</span></span>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            // @ts-ignore - id matches ViewState but TS inference on the array can be tricky
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${currentUser.nivel === 'Admin' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium truncate w-32">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.nivel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};