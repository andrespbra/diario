import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { AlertTriangle, Clock, MapPin, Eye, X, CheckCircle2, User, FileText, Wrench, Hash, Copy, Check, Save, CreditCard, Activity, Monitor } from 'lucide-react';

interface EscalationListProps {
  tickets: Ticket[];
  onResolve: (ticket: Ticket) => void;
}

export const EscalationList: React.FC<EscalationListProps> = ({ tickets, onResolve }) => {
  const escalatedTickets = tickets.filter(t => t.isEscalated && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editFormData, setEditFormData] = useState<Ticket | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize form data when a ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      setEditFormData({ 
        ...selectedTicket,
        // Ensure booleans are initialized if undefined
        testWithCard: selectedTicket.testWithCard || false,
        sicWithdrawal: selectedTicket.sicWithdrawal || false,
        sicDeposit: selectedTicket.sicDeposit || false,
        sicSensors: selectedTicket.sicSensors || false,
        sicSmartPower: selectedTicket.sicSmartPower || false
      });
    }
  }, [selectedTicket]);

  // Update summary whenever form data changes
  useEffect(() => {
    if (editFormData) {
      const summary = `RESUMO DE VALIDAÇÃO / FECHAMENTO
------------------------------------------
TASK: ${editFormData.taskId} | INC: ${editFormData.serviceRequest}
HOSTNAME: ${editFormData.hostname}
CLIENTE: ${editFormData.customerName}
TAGS: ${editFormData.tagVLDD ? '#VLDD#' : ''} ${editFormData.tagNLVDD ? '#NLVDD#' : ''}

DEFEITO RECLAMADO:
${editFormData.description}

AÇÃO TÉCNICO:
${editFormData.analystAction}

PEÇAS:
Troca de Peça: ${editFormData.partReplaced ? 'SIM' : 'NÃO'}
${editFormData.partReplaced ? `Peça(s): ${editFormData.partDescription}` : ''}

VALIDAÇÃO SIC:
[${editFormData.sicWithdrawal ? 'X' : ' '}] Saques
[${editFormData.sicDeposit ? 'X' : ' '}] Depósitos
[${editFormData.sicSensors ? 'X' : ' '}] Sensoriamento
[${editFormData.sicSmartPower ? 'X' : ' '}] SmartPower

TESTE COM CARTÃO: ${editFormData.testWithCard ? 'REALIZADO' : 'NÃO REALIZADO'}

VALIDAÇÃO (ACOMPANHAMENTO):
Validado por: ${editFormData.clientWitnessName || 'N/A'}
Matrícula: ${editFormData.clientWitnessId || 'N/A'}
------------------------------------------`;
      setSummaryText(summary);
    }
  }, [editFormData]);

  const handleInputChange = (field: keyof Ticket, value: any) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  const handleSaveAndClose = () => {
    if (editFormData) {
      onResolve(editFormData);
      setSelectedTicket(null);
      setEditFormData(null);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20 md:pb-0">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2">
        <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Escalonados</h1>
                <p className="text-xs md:text-sm text-gray-500">Validação e Encerramento</p>
            </div>
        </div>
        <div className="bg-red-50 text-red-700 px-3 py-1 text-sm md:px-4 md:py-2 rounded-lg font-bold border border-red-100 whitespace-nowrap">
            {escalatedTickets.length} <span className="hidden sm:inline">Pendentes</span>
        </div>
      </div>

      {/* Validation/Edit Modal - Mobile First Optimized */}
      {selectedTicket && editFormData && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col transition-all">
                {/* Modal Header */}
                <div className="bg-gray-50 px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex justify-between items-center shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Validação</h2>
                            <p className="text-xs text-gray-500 hidden sm:block">Edite as informações para validar e encerrar.</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                
                {/* Modal Body - Scrollable */}
                <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6 bg-white flex-1">
                    
                    {/* Row 1: Identifiers - Stack on mobile */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Hash className="w-3 h-3" /> Task
                            </label>
                            <input 
                                type="text" 
                                value={editFormData.taskId}
                                onChange={(e) => handleInputChange('taskId', e.target.value)}
                                className="w-full px-2 py-1.5 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Hash className="w-3 h-3" /> INC
                            </label>
                            <input 
                                type="text" 
                                value={editFormData.serviceRequest}
                                onChange={(e) => handleInputChange('serviceRequest', e.target.value)}
                                className="w-full px-2 py-1.5 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-1 col-span-2 md:col-span-1">
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Monitor className="w-3 h-3" /> Hostname
                            </label>
                            <input 
                                type="text" 
                                value={editFormData.hostname}
                                onChange={(e) => handleInputChange('hostname', e.target.value)}
                                className="w-full px-2 py-1.5 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-1 col-span-2 md:col-span-1">
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <User className="w-3 h-3" /> Cliente
                            </label>
                            <input 
                                type="text" 
                                value={editFormData.customerName}
                                onChange={(e) => handleInputChange('customerName', e.target.value)}
                                className="w-full px-2 py-1.5 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Tags Checkboxes */}
                    <div className="flex gap-4 bg-purple-50 p-3 rounded-lg border border-purple-100 overflow-x-auto">
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                            <input 
                                type="checkbox"
                                checked={editFormData.tagVLDD}
                                onChange={(e) => handleInputChange('tagVLDD', e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="font-bold text-purple-700 text-sm">#VLDD#</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                            <input 
                                type="checkbox"
                                checked={editFormData.tagNLVDD}
                                onChange={(e) => handleInputChange('tagNLVDD', e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="font-bold text-purple-700 text-sm">#NLVDD#</span>
                        </label>
                    </div>

                    {/* Description & Action */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Defeito
                            </label>
                            <textarea 
                                rows={3}
                                value={editFormData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-blue-500" /> Ação Técnico
                            </label>
                            <textarea 
                                rows={3}
                                value={editFormData.analystAction}
                                onChange={(e) => handleInputChange('analystAction', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Parts & Tests Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Parts */}
                        <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" /> Peça?
                                </span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="modalPartReplaced"
                                            checked={editFormData.partReplaced === true} 
                                            onChange={() => handleInputChange('partReplaced', true)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Sim</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="modalPartReplaced"
                                            checked={editFormData.partReplaced === false} 
                                            onChange={() => handleInputChange('partReplaced', false)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Não</span>
                                    </label>
                                </div>
                            </div>
                            {editFormData.partReplaced && (
                                <input 
                                    type="text"
                                    value={editFormData.partDescription || ''}
                                    onChange={(e) => handleInputChange('partDescription', e.target.value)}
                                    placeholder="Qual peça? Ex: HD, Fonte..."
                                    className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            )}
                        </div>

                         {/* Card Test */}
                         <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 flex flex-col justify-center">
                             <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-sm font-bold text-blue-800 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Cartão?
                                </span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="testWithCard"
                                            checked={editFormData.testWithCard === true} 
                                            onChange={() => handleInputChange('testWithCard', true)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-blue-900">Sim</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="testWithCard"
                                            checked={editFormData.testWithCard === false} 
                                            onChange={() => handleInputChange('testWithCard', false)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-blue-900">Não</span>
                                    </label>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {/* SIC Validation & Witness */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* SIC */}
                        <div className="bg-indigo-50 p-3 md:p-4 rounded-lg border border-indigo-200">
                             <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> SIC
                             </h3>
                             <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editFormData.sicWithdrawal}
                                        onChange={(e) => handleInputChange('sicWithdrawal', e.target.checked)}
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-indigo-900">Saques</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editFormData.sicDeposit}
                                        onChange={(e) => handleInputChange('sicDeposit', e.target.checked)}
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-indigo-900">Depósitos</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editFormData.sicSensors}
                                        onChange={(e) => handleInputChange('sicSensors', e.target.checked)}
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-indigo-900">Sensores</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editFormData.sicSmartPower}
                                        onChange={(e) => handleInputChange('sicSmartPower', e.target.checked)}
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-indigo-900">SmartPwr</span>
                                </label>
                             </div>
                        </div>

                         {/* Witness */}
                        <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                            <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" /> Responsável (Loja)
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <input 
                                        type="text"
                                        value={editFormData.clientWitnessName || ''}
                                        onChange={(e) => handleInputChange('clientWitnessName', e.target.value)}
                                        placeholder="Nome"
                                        className="w-full px-3 py-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <input 
                                        type="text"
                                        value={editFormData.clientWitnessId || ''}
                                        onChange={(e) => handleInputChange('clientWitnessId', e.target.value)}
                                        placeholder="Matrícula / ID"
                                        className="w-full px-3 py-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-800 rounded-xl p-3 md:p-4 text-gray-200">
                         <div className="flex justify-between items-center mb-2">
                           <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Resumo</h3>
                           <button 
                             type="button"
                             onClick={handleCopySummary}
                             className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                           >
                             {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                             {copied ? 'Copiado' : 'Copiar'}
                           </button>
                         </div>
                         <textarea 
                           readOnly
                           rows={6}
                           value={summaryText}
                           className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 md:p-3 text-[10px] md:text-xs font-mono text-gray-300 focus:outline-none resize-none"
                         />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 md:p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl pb-6 sm:pb-4">
                    <button 
                        onClick={() => setSelectedTicket(null)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveAndClose}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-green-200 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* List View */}
      {escalatedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 border-dashed">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Tudo sob controle!</h3>
              <p className="text-gray-500 text-center px-4">Nenhum chamado escalado pendente.</p>
          </div>
      ) : (
          <div className="grid gap-4">
            {escalatedTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-xl p-4 md:p-6 border-l-4 border-l-red-500 shadow-sm border-y border-r border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">CRÍTICO</span>
                                <span className="text-xs text-gray-400">#{ticket.taskId || ticket.id}</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {ticket.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 leading-snug">{ticket.subject || ticket.customerName}</h3>
                             <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{ticket.locationName}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{ticket.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                             <button 
                                onClick={() => setSelectedTicket(ticket)}
                                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-indigo-200"
                            >
                                <Eye className="w-4 h-4" />
                                Validar
                            </button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
      )}
    </div>
  );
};