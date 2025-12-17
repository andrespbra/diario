import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { Search, MapPin, Clock, AlertTriangle, AlertOctagon, Wrench, CheckCircle2, XCircle, ArrowUpRight, Copy, Check, Trash2 } from 'lucide-react';

interface HistoryListProps {
  tickets: Ticket[];
  onDelete: (ticketId: string) => void;
  onUpdate: (ticket: Ticket) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ tickets, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      (ticket.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.taskId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.serviceRequest || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusBadge = (status: TicketStatus, isEscalated: boolean) => {
      if (isEscalated && status !== TicketStatus.RESOLVED && status !== TicketStatus.CLOSED) {
          return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200" title="Este chamado foi escalonado">
                  <AlertOctagon className="w-3 h-3 mr-1" />
                  Escalonado
              </span>
          );
      }

      switch(status) {
          case TicketStatus.OPEN: 
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200" title="Chamado aberto aguardando resolução">Aberto</span>;
          case TicketStatus.IN_PROGRESS: 
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200" title="Chamado em atendimento">Em Andamento</span>;
          case TicketStatus.RESOLVED: 
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200" title="Chamado resolvido com sucesso">Resolvido</span>;
          case TicketStatus.CLOSED: 
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200" title="Chamado finalizado">Fechado</span>;
          default: 
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
      }
  };

  const handleCopyTicketDetails = (ticket: Ticket) => {
    const textToCopy = `DETALHES DO CHAMADO
-------------------
TASK: ${ticket.taskId || 'N/A'}
CLIENTE: ${ticket.customerName}
LOCAL: ${ticket.locationName}
-------------------
DEFEITO:
${ticket.description}

AÇÃO TÉCNICO:
${ticket.analystAction}`;

    navigator.clipboard.writeText(textToCopy);
    setCopyFeedbackId(ticket.id);
    setTimeout(() => setCopyFeedbackId(null), 2000);
  };

  const handleDeleteClick = (ticket: Ticket) => {
    if (window.confirm(`Tem certeza que deseja excluir o chamado ${ticket.taskId || ticket.id}? Esta ação não pode ser desfeita.`)) {
        onDelete(ticket.id);
    }
  };

  const handleCloseTicket = (ticket: Ticket) => {
    if (window.confirm(`Deseja encerrar o chamado ${ticket.taskId || 'selecionado'}?`)) {
        onUpdate({
            ...ticket,
            status: TicketStatus.CLOSED
        });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Clock className="w-6 h-6 text-indigo-600" />
             Histórico de Atendimentos
           </h1>
           <p className="text-sm text-gray-500">Registro completo de todos os chamados.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Buscar por task, cliente, local..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-72 bg-white shadow-sm"
                 />
             </div>
             <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm text-sm"
             >
                 <option value="ALL">Todos os Status</option>
                 <option value={TicketStatus.OPEN}>Abertos</option>
                 <option value={TicketStatus.IN_PROGRESS}>Em Andamento</option>
                 <option value={TicketStatus.RESOLVED}>Resolvidos</option>
                 <option value={TicketStatus.CLOSED}>Fechados</option>
             </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
         <div className="overflow-auto">
             <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50 sticky top-0 z-10">
                     <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                         <th className="px-6 py-4 w-32">Status</th>
                         <th className="px-6 py-4 w-40">Identificação</th>
                         <th className="px-6 py-4">Cliente / Local</th>
                         <th className="px-6 py-4">Detalhes</th>
                         <th className="px-6 py-4 w-32">Data</th>
                         <th className="px-6 py-4 w-32 text-right">Ações</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {filteredTickets.length === 0 ? (
                         <tr>
                             <td colSpan={6} className="px-6 py-12 text-center">
                                 <div className="flex flex-col items-center justify-center text-gray-400">
                                     <Search className="w-8 h-8 mb-2 opacity-50" />
                                     <p>Nenhum chamado encontrado com os filtros atuais.</p>
                                 </div>
                             </td>
                         </tr>
                     ) : (
                         filteredTickets.map((ticket) => (
                             <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                                 <td className="px-6 py-4 align-top">
                                     <div className="flex flex-col gap-2 items-start">
                                         {getStatusBadge(ticket.status, ticket.isEscalated)}
                                         {ticket.priority === TicketPriority.CRITICAL && !ticket.isEscalated && (
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100" title="Prioridade Crítica">CRÍTICO</span>
                                         )}
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 align-top">
                                     <div className="flex flex-col">
                                         <span className="font-bold text-gray-900 font-mono text-sm">{ticket.taskId}</span>
                                         <span className="text-xs text-gray-500 font-mono">{ticket.serviceRequest}</span>
                                         <span className="text-[10px] text-gray-400 mt-1">{ticket.hostname}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 align-top">
                                     <div className="flex flex-col">
                                         <span className="font-medium text-gray-900">{ticket.customerName}</span>
                                         <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                             <MapPin className="w-3 h-3" /> {ticket.locationName}
                                         </span>
                                         <span className="text-xs text-indigo-600 mt-1 font-medium">{ticket.analystName}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 align-top">
                                     <div className="max-w-md">
                                         <p className="text-sm font-medium text-gray-900 mb-1">{ticket.subject}</p>
                                         <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed cursor-help" title={ticket.description}>
                                            {ticket.description}
                                         </p>
                                         {ticket.partReplaced && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-100" title={`Peça trocada: ${ticket.partDescription}`}>
                                                <Wrench className="w-3 h-3" />
                                                <span className="font-medium">Troca de Peça:</span> {ticket.partDescription}
                                            </div>
                                         )}
                                         <div className="flex gap-2 mt-2">
                                            {ticket.tagVLDD && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">#VLDD#</span>}
                                            {ticket.tagNLVDD && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">#NLVDD#</span>}
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 align-top whitespace-nowrap">
                                     <div className="flex flex-col gap-1">
                                         <div className="flex items-center text-xs font-medium text-gray-600 gap-1.5">
                                             <Clock className="w-3 h-3" />
                                             {new Date(ticket.createdAt).toLocaleDateString()}
                                         </div>
                                         <span className="text-xs text-gray-400 pl-4.5">
                                             {new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 align-top text-right">
                                     <div className="flex justify-end gap-2">
                                         {ticket.status !== TicketStatus.CLOSED && (
                                             <button
                                                onClick={() => handleCloseTicket(ticket)}
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Encerrar chamado"
                                             >
                                                 <CheckCircle2 className="w-4 h-4" />
                                             </button>
                                         )}
                                         <button
                                            onClick={() => handleCopyTicketDetails(ticket)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Copiar detalhes do chamado"
                                         >
                                             {copyFeedbackId === ticket.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                         </button>
                                         <div className="w-px bg-gray-200 mx-1"></div>
                                         <button
                                            onClick={() => handleDeleteClick(ticket)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:text-red-400"
                                            title="Excluir chamado permanentemente"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </td>
                             </tr>
                         ))
                     )}
                 </tbody>
             </table>
         </div>
         <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>Mostrando {filteredTickets.length} registros</span>
            <span>Ordenado por mais recente</span>
         </div>
      </div>
    </div>
  );
};