
import React, { useState, useEffect } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { 
  Zap, AlertCircle, Clock, ShieldAlert, ChevronRight, 
  MapPin, Monitor, CheckCircle2, Trophy, History, 
  X, User, Wrench, Hash, Copy, Check, Save, 
  CreditCard, Activity, XCircle, Eye, Tag, FileText, Barcode
} from 'lucide-react';

interface TigerTeamProps {
  tickets: Ticket[];
  onResolve: (ticket: Ticket) => void;
}

export const TigerTeam: React.FC<TigerTeamProps> = ({ tickets, onResolve }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editFormData, setEditFormData] = useState<Ticket | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [copied, setCopied] = useState(false);

  const getStatusBadge = (status: TicketStatus) => {
    switch(status) {
      case TicketStatus.RESOLVED: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">Resolvido</span>;
      case TicketStatus.CLOSED: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200">Fechado</span>;
      case TicketStatus.OPEN:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Aberto</span>;
      case TicketStatus.IN_PROGRESS:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Em Andamento</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">{status}</span>;
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      setEditFormData({ 
        ...selectedTicket,
        testWithCard: selectedTicket.testWithCard || false,
        sicWithdrawal: selectedTicket.sicWithdrawal || false,
        sicDeposit: selectedTicket.sicDeposit || false,
        sicSensors: selectedTicket.sicSensors || false,
        sicSmartPower: selectedTicket.sicSmartPower || false,
        clientWitnessName: selectedTicket.clientWitnessName || '',
        clientWitnessId: selectedTicket.clientWitnessId || ''
      });
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (editFormData) {
      const summary = `=== OPERAÇÃO TIGER TEAM #198 ===
------------------------------------------
TASK: ${editFormData.taskId} | INC / RITM: ${editFormData.serviceRequest}
HOSTNAME: ${editFormData.hostname} | N. SÉRIE: ${editFormData.serialNumber || 'N/A'}
CLIENTE: ${editFormData.customerName}
TAGS: ${editFormData.tagVLDD ? '#VLDD#' : ''} ${editFormData.tagNLVDD ? '#NLVDD#' : ''}

DEFEITO RECLAMADO:
${editFormData.description}

AÇÃO TÉCNICA TIGER:
${editFormData.analystAction}

VALIDAÇÃO TÉCNICA:
Troca de Peça: ${editFormData.partReplaced ? `SIM (${editFormData.partDescription})` : 'NÃO'}
Teste com Cartão: ${editFormData.testWithCard ? 'REALIZADO' : 'NÃO REALIZADO'}

VALIDAÇÃO SIC:
[${editFormData.sicWithdrawal ? 'X' : ' '}] Saques
[${editFormData.sicDeposit ? 'X' : ' '}] Depósitos
[${editFormData.sicSensors ? 'X' : ' '}] Sensoriamento
[${editFormData.sicSmartPower ? 'X' : ' '}] SmartPower

RESPONSÁVEL LOCAL:
Nome: ${editFormData.clientWitnessName || 'N/A'}
Matrícula: ${editFormData.clientWitnessId || 'N/A'}

SITUAÇÃO: ${editFormData.status.toUpperCase()}
------------------------------------------`;
      setSummaryText(summary);
    }
  }, [editFormData]);

  const allTigerTickets = tickets.filter(t => !!t.isTigerTeam);

  const activeMissions = allTigerTickets.filter(t => 
    t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED
  );

  const completedMissions = allTigerTickets.filter(t => 
    t.status === TicketStatus.CLOSED || t.status === TicketStatus.RESOLVED
  );

  const displayTickets = activeTab === 'active' ? activeMissions : completedMissions;

  const formatTimeOpen = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); 
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleInputChange = (field: keyof Ticket, value: any) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  const handleSave = (resolve: boolean = false) => {
    if (editFormData) {
      const finalTicket = { 
        ...editFormData, 
        status: resolve ? TicketStatus.RESOLVED : editFormData.status 
      };
      onResolve(finalTicket);
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
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      {selectedTicket && editFormData && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col transition-all overflow-hidden border border-amber-500/20">
            <div className="bg-slate-900 px-4 py-4 md:px-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">DETALHES DO ATENDIMENTO #198</h2>
                  <p className="text-xs text-amber-400 font-mono tracking-wider">{editFormData.taskId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto space-y-6 bg-white flex-1">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Hash className="w-3 h-3" /> TASK</label>
                  <input 
                    type="text" 
                    value={editFormData.taskId} 
                    onChange={(e) => handleInputChange('taskId', e.target.value)}
                    className="w-full font-mono text-sm font-bold text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Tag className="w-3 h-3" /> INC / RITM</label>
                  <input 
                    type="text" 
                    value={editFormData.serviceRequest} 
                    onChange={(e) => handleInputChange('serviceRequest', e.target.value)}
                    className="w-full font-mono text-sm font-bold text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Monitor className="w-3 h-3" /> HOSTNAME</label>
                  <input 
                    type="text" 
                    value={editFormData.hostname} 
                    onChange={(e) => handleInputChange('hostname', e.target.value)}
                    className="w-full font-mono text-sm font-bold text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Barcode className="w-3 h-3" /> N. SÉRIE</label>
                  <input 
                    type="text" 
                    value={editFormData.serialNumber} 
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    className="w-full font-mono text-sm font-bold text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">#VLDD# / #NLVDD#</label>
                  <div className="flex gap-2 h-[42px] items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-2 py-2 rounded-lg grow justify-center">
                      <input type="checkbox" checked={editFormData.tagVLDD} onChange={(e) => handleInputChange('tagVLDD', e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                      <span className="text-[10px] font-bold text-purple-700">#VLDD#</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-2 py-2 rounded-lg grow justify-center">
                      <input type="checkbox" checked={editFormData.tagNLVDD} onChange={(e) => handleInputChange('tagNLVDD', e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                      <span className="text-[10px] font-bold text-purple-700">#NLVDD#</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> DEFEITO (Relato)
                  </label>
                  <textarea 
                    value={editFormData.description} 
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> AÇÃO TÉCNICA
                  </label>
                  <textarea 
                    value={editFormData.analystAction} 
                    onChange={(e) => handleInputChange('analystAction', e.target.value)}
                    placeholder="Quais ações de elite foram tomadas?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-2">
                      <Wrench className="w-3 h-3" /> TROCA DE PEÇA?
                    </label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="part_replaced_modal" checked={editFormData.partReplaced} onChange={() => handleInputChange('partReplaced', true)} />
                        <span className="text-sm">SIM</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="part_replaced_modal" checked={!editFormData.partReplaced} onChange={() => handleInputChange('partReplaced', false)} />
                        <span className="text-sm">NÃO</span>
                      </label>
                    </div>
                    {editFormData.partReplaced && (
                      <input 
                        type="text" 
                        value={editFormData.partDescription || ''} 
                        onChange={(e) => handleInputChange('partDescription', e.target.value)}
                        placeholder="QUAL PEÇA?"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> TESTE COM CARTÃO?
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="card_test_modal" checked={editFormData.testWithCard} onChange={() => handleInputChange('testWithCard', true)} />
                        <span className="text-xs font-bold text-blue-900">SIM</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        {/* Fix: Changed 'card_test_modal' to 'testWithCard' to match the Ticket interface keys */}
                        <input type="radio" name="card_test_modal" checked={!editFormData.testWithCard} onChange={() => handleInputChange('testWithCard', false)} />
                        <span className="text-xs font-bold text-blue-900">NÃO</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <label className="text-xs font-bold text-indigo-700 uppercase mb-4 block flex items-center gap-2">
                    <Activity className="w-4 h-4" /> SIC (VALIDAÇÃO)
                  </label>
                  <div className="grid grid-cols-2 gap-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.sicWithdrawal} onChange={(e) => handleInputChange('sicWithdrawal', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="text-sm text-indigo-900">SAQUES</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.sicDeposit} onChange={(e) => handleInputChange('sicDeposit', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="text-sm text-indigo-900">DEPÓSITOS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.sicSensors} onChange={(e) => handleInputChange('sicSensors', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="text-sm text-indigo-900">SENSORES</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.sicSmartPower} onChange={(e) => handleInputChange('sicSmartPower', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="text-sm text-indigo-900">SMARTPOWER</span>
                    </label>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <label className="text-xs font-bold text-emerald-700 uppercase mb-4 block flex items-center gap-2">
                    <User className="w-4 h-4" /> RESPONSÁVEL
                  </label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">NOME</span>
                      <input 
                        type="text" 
                        value={editFormData.clientWitnessName || ''} 
                        onChange={(e) => handleInputChange('clientWitnessName', e.target.value)}
                        placeholder="Nome acompanhante"
                        className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">MATRÍCULA</span>
                      <input 
                        type="text" 
                        value={editFormData.clientWitnessId || ''} 
                        onChange={(e) => handleInputChange('clientWitnessId', e.target.value)}
                        placeholder="Matrícula"
                        className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 md:p-6 text-white relative shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> RESUMO FINAL
                  </label>
                  <button 
                    onClick={handleCopySummary} 
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'COPIAR RESUMO'}
                  </button>
                </div>
                <textarea 
                  readOnly 
                  rows={8}
                  value={summaryText} 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-[11px] md:text-xs font-mono text-slate-300 outline-none resize-none leading-relaxed" 
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-3 pb-10 sm:pb-4">
              <button onClick={() => setSelectedTicket(null)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800">DESCARTAR</button>
              <button onClick={() => handleSave(false)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-colors">
                <Save className="w-4 h-4" /> SALVAR ANDAMENTO
              </button>
              <button onClick={() => handleSave(true)} className="px-8 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-200 flex items-center gap-2 hover:bg-amber-600 transition-colors">
                <CheckCircle2 className="w-4 h-4" /> FINALIZAR MISSÃO
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {activeTab === 'active' ? 'Nenhum chamado #198 ativo no radar.' : 'Nenhuma missão Tiger Team finalizada.'}
                </p>
            </div>
        ) : (
            displayTickets.map((ticket) => (
                <div key={ticket.id} className="group relative bg-white border border-amber-500/30 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-xl">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center">
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                                    {ticket.taskId}
                                </span>
                                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                    <Zap className="w-3 h-3 animate-pulse" /> TIGER TEAM #198
                                </span>
                                <div className="ml-auto md:ml-0">
                                    {getStatusBadge(ticket.status)}
                                </div>
                                {activeTab === 'active' && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                      <Clock className="w-3 h-3" /> {formatTimeOpen(ticket.createdAt)} EM ABERTO
                                  </span>
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
                            <button 
                              onClick={() => setSelectedTicket(ticket)}
                              className={`p-3 rounded-lg transition-colors ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-lg hover:bg-amber-500' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                            >
                                {activeTab === 'active' ? <ChevronRight className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
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
                <p className="text-sm font-bold text-slate-900">Apenas #198</p>
            </div>
        </div>
      </div>
    </div>
  );
};
