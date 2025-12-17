import React from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { StatsCard } from './StatsCard';
import { BarChart3, CheckCircle2, Clock, AlertOctagon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  tickets: Ticket[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  const totalTickets = tickets.length;
  const escalatedTickets = tickets.filter(t => t.isEscalated).length;
  const resolvedTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
  const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN).length;

  const priorityData = [
    { name: 'Baixa', count: tickets.filter(t => t.priority === TicketPriority.LOW).length, color: '#22c55e' },
    { name: 'Média', count: tickets.filter(t => t.priority === TicketPriority.MEDIUM).length, color: '#3b82f6' },
    { name: 'Alta', count: tickets.filter(t => t.priority === TicketPriority.HIGH).length, color: '#f97316' },
    { name: 'Crítica', count: tickets.filter(t => t.priority === TicketPriority.CRITICAL).length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-xs md:text-sm text-gray-500">Atualizado agora</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          title="Total" 
          value={totalTickets} 
          icon={BarChart3} 
          colorClass="bg-blue-500" 
        />
        <StatsCard 
          title="Escalonados" 
          value={escalatedTickets} 
          icon={AlertOctagon} 
          trend={escalatedTickets > 0 ? "Atenção" : "Normal"}
          colorClass="bg-red-500" 
        />
        <StatsCard 
          title="Resolvidos" 
          value={resolvedTickets} 
          icon={CheckCircle2} 
          colorClass="bg-green-500" 
        />
        <StatsCard 
          title="Abertos" 
          value={openTickets} 
          icon={Clock} 
          colorClass="bg-yellow-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-6">Distribuição por Prioridade</h2>
          <div className="h-56 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            {tickets.slice(0, 5).map(ticket => (
              <div key={ticket.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${ticket.isEscalated ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ticket.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{ticket.locationName} • {ticket.taskId}</p>
                  <span className="text-[10px] text-gray-400">
                    {ticket.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum chamado registrado hoje.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};