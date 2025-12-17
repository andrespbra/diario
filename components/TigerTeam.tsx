import React, { useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { Zap, AlertCircle, Clock, ShieldAlert, ChevronRight, MapPin, Monitor, CheckCircle2, Trophy, History } from 'lucide-react';

interface TigerTeamProps {
  tickets: Ticket[];
}

export const TigerTeam: React.FC<TigerTeamProps> = ({ tickets }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Filter Tiger Team tickets (explicit flag or critical/escalated)
  const allTigerTickets = tickets.filter(t => 
    t.isTigerTeam || t.priority === TicketPriority.CRITICAL || t.isEscalated
  );

  const activeMissions = allTigerTickets.filter(t => 
    t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED
  );

  const completedMissions = allTigerTickets.filter(t => 
    t.status === TicketStatus.CLOSED || t.status === TicketStatus.RESOLVED
  );

  const displayTickets = activeTab === 'active' ? activeMissions : completedMissions;

  const formatTimeOpen = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch(status) {
      case TicketStatus.RESOLVED: return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 uppercase">Resolvido</span>;
      case TicketStatus.CLOSED: return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase">Fechado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      {/* Hero Header */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-48 h-48 text-amber-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/50 text-amber-500 text-xs font-bold uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3" /> Mission Control
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter italic">
                TIGER TEAM <span className="text-amber-500">#198</span>
            </h1>
            <p className="text-slate-400 max-w-lg text-sm md:text-base">
                Esquadrão especializado para atendimento de alta complexidade e incidentes críticos.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-slate-700 text-center min-w-[100px]">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Ativos</p>
                <p className="text-3xl font-black text-amber-500">{activeMissions.length}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-slate-700 text-center min-w-[100px]">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Concluídos</p>
                <p className="text-3xl font-black text-white">{completedMissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'active' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Zap className="w-4 h-4" /> Operações Ativas
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'completed' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <History className="w-4 h-4" /> Histórico de Missões
        </button>
      </div>

      {/* Mission List */}
      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            {activeTab === 'active' ? (
              <><AlertCircle className="w-4 h-4 text-amber-500" /> Alvos Prioritários em Aberto</>
            ) : (
              <><Trophy className="w-4 h-4 text-amber-600" /> Objetivos Alcançados</>
            )}
        </h2>
        
        {displayTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                {activeTab === 'active' ? (
                  <Zap className="w-12 h-12 text-slate-200 mb-2" />
                ) : (
                  <History className="w-12 h-12 text-slate-200 mb-2" />
                )}
                <p className="text-slate-500 font-medium text-center px-6">
                  {activeTab === 'active' ? 'Sem ameaças críticas detectadas no momento.' : 'Nenhuma missão finalizada registrada.'}
                </p>
            </div>
        ) : (
            displayTickets.map((ticket) => (
                <div key={ticket.id} className={`group relative bg-white border rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-xl ${ticket.isTigerTeam ? 'border-amber-500/30' : 'border-slate-200'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ticket.isTigerTeam ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                    
                    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center">
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                                    {ticket.taskId}
                                </span>
                                <span className={`text-xs font-bold ${ticket.isTigerTeam ? 'text-amber-600' : 'text-red-600'} flex items-center gap-1`}>
                                    {ticket.isTigerTeam ? <><Zap className="w-3 h-3 animate-pulse" /> TIGER TEAM #198</> : '[ PRIORIDADE MÁXIMA ]'}
                                </span>
                                {activeTab === 'active' ? (
                                  <span className="ml-auto md:ml-0 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                      <Clock className="w-3 h-3" /> {formatTimeOpen(ticket.createdAt)} EM ABERTO
                                  </span>
                                ) : (
                                  <div className="ml-auto md:ml-0 flex items-center gap-2">
                                    {getStatusBadge(ticket.status)}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Finalizado</span>
                                  </div>
                                )}
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                                    {ticket.customerName}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="w-3 h-3 text-amber-500" /> {ticket.locationName}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Monitor className="w-3 h-3 text-amber-500" /> {ticket.hostname}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-slate-100 pl-3">
                                "{ticket.description}"
                            </p>
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Analista</p>
                                <p className="text-sm font-bold text-slate-700">{ticket.analystName}</p>
                            </div>
                            <div className={`p-3 rounded-lg transition-colors ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                {activeTab === 'active' ? <ChevronRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
      
      {/* Specialized Tools Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase">Status do Time</p>
                <p className="text-sm font-bold text-amber-900">Operacional</p>
            </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Zap className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-indigo-700 uppercase">Resposta Média</p>
                <p className="text-sm font-bold text-indigo-900">&lt; 15 min</p>
            </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-slate-800 text-white p-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-700 uppercase">Filtro de Foco</p>
                <p className="text-sm font-bold text-slate-900">Apenas Críticos</p>
            </div>
        </div>
      </div>
    </div>
  );
};