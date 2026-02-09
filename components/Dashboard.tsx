
import React, { useMemo } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { StatsCard } from './StatsCard';
import { BarChart3, CheckCircle2, Clock, AlertOctagon, Zap, Monitor, AlertTriangle, PieChart as PieChartIcon, TrendingUp, MapPin } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface DashboardProps {
  tickets: Ticket[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  const totalTickets = tickets.length;
  
  const escalatedTickets = tickets.filter(t => 
    t.isEscalated && 
    !t.isTigerTeam && 
    t.status !== TicketStatus.CLOSED && 
    t.status !== TicketStatus.RESOLVED
  ).length;

  const tigerTeamTickets = tickets.filter(t => 
    t.isTigerTeam && 
    t.status !== TicketStatus.CLOSED && 
    t.status !== TicketStatus.RESOLVED
  ).length;

  const resolvedTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
  const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN).length;

  // Estatísticas de Equipamentos (Hostnames) mais chamados incluindo localização
  const equipmentStats = useMemo(() => {
    const counts: Record<string, { count: number, locationName: string }> = {};
    tickets.forEach(t => {
      if (t.hostname) {
        if (!counts[t.hostname]) {
          counts[t.hostname] = { count: 0, locationName: t.locationName || 'N/A' };
        }
        counts[t.hostname].count += 1;
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, count: data.count, locationName: data.locationName }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 para o gráfico
  }, [tickets]);

  // Ranking de Ativos (Top 3 para os cards)
  const topRankingAssets = useMemo(() => {
    return equipmentStats.slice(0, 3);
  }, [equipmentStats]);

  // Estatísticas de Defeitos (Subject)
  const defectStats = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      if (t.subject) {
        counts[t.subject] = (counts[t.subject] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Painel de Controle</h1>
          <p className="text-xs text-gray-500">Métricas em tempo real da operação de suporte.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total Geral" 
          value={totalTickets} 
          icon={BarChart3} 
          colorClass="bg-indigo-600" 
        />
        <StatsCard 
          title="Fila N2" 
          value={escalatedTickets} 
          icon={AlertOctagon} 
          trend={escalatedTickets > 0 ? "Ação Requerida" : "Limpo"}
          colorClass="bg-red-500" 
        />
        <StatsCard 
          title="Tiger Team" 
          value={tigerTeamTickets} 
          icon={Zap} 
          trend={tigerTeamTickets > 0 ? "Alta Prioridade" : "Limpo"}
          colorClass="bg-amber-500" 
        />
        <StatsCard 
          title="Resolvidos" 
          value={resolvedTickets} 
          icon={CheckCircle2} 
          colorClass="bg-emerald-500" 
        />
        <StatsCard 
          title="Aguardando" 
          value={openTickets} 
          icon={Clock} 
          colorClass="bg-slate-700" 
        />
      </div>

      {/* Equipment Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Most Frequent Equipment */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">Equipamentos Mais Chamados</h2>
             </div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Por Volume de Aberturas</span>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentStats} margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                  {equipmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Frequency Assets Ranking Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Maiores Índices</h2>
          </div>
          {topRankingAssets.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
               <Monitor className="w-8 h-8 mx-auto mb-2 opacity-20" />
               <p className="text-xs font-medium">Sem dados de equipamentos ainda.</p>
            </div>
          ) : (
            topRankingAssets.map((asset, idx) => (
              <div key={asset.name} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black ${
                    idx === 0 ? 'bg-red-50 text-red-600' : idx === 1 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {idx + 1}º
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{asset.name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {asset.locationName}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-lg font-black text-gray-900">{asset.count}</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Chamados</p>
                </div>
              </div>
            ))
          )}
          
          <div className="bg-slate-900 p-5 rounded-2xl shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Zap className="w-12 h-12 text-amber-500" /></div>
             <p className="text-white text-xs font-bold mb-1">Atenção Crítica</p>
             <p className="text-slate-400 text-[10px] leading-relaxed">Equipamentos no topo do ranking sugerem falhas recorrentes ou necessidade de preventiva.</p>
          </div>
        </div>
      </div>

      {/* Bottom Row: Defect Distribution Pie Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Defect Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">Distribuição de Defeitos</h2>
             </div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frequência por Assunto</span>
          </div>
          <div className="h-72 flex-1">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={defectStats}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   animationBegin={0}
                   animationDuration={1500}
                 >
                   {defectStats.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingLeft: '20px' }}
                    iconType="circle"
                 />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Atividade Recente</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-4 flex-1 overflow-auto max-h-[300px] pr-2">
            {tickets.slice(0, 10).map(ticket => (
              <div key={ticket.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0 group">
                <div className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${ticket.isTigerTeam ? 'bg-amber-500 animate-pulse' : (ticket.isEscalated ? 'bg-red-500' : 'bg-indigo-400')}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{ticket.customerName}</p>
                    <span className="text-[10px] text-gray-400 font-mono">{ticket.taskId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                     <Monitor className="w-3 h-3 text-gray-300" />
                     <span className="truncate">{ticket.hostname}</span>
                     <span className="text-gray-300">•</span>
                     <span>{ticket.subject.split(' - ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{ticket.status}</span>
                     <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                  </div>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                  <Clock className="w-12 h-12 mb-2" />
                  <p className="text-sm font-bold">Sem atividades</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
