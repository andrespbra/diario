
import React, { useState, useEffect } from 'react';
import { TicketPriority, TicketStatus, Ticket, UserProfile } from '../types';
import { analyzeTicketProblem } from '../services/geminiService';
import { Sparkles, Save, Loader2, User, FileText, MapPin, Hash, Monitor, Clock, Tag, Briefcase, Wrench, CheckSquare, Copy, Check, Users, AlertOctagon, Zap, Barcode } from 'lucide-react';

interface NewTicketFormProps {
  onSubmit: (ticket: Ticket) => void;
  currentUser: UserProfile;
}

const SUBJECT_OPTIONS = [
  "1100 - Codigo",
  "1101 - Codigo de peças",
  "1102 - Codigo de midia",
  "1200 - Duvida técnica",
  "1201 - Interpretação defeito",
  "1202 - Testes perifericos",
  "1203 - Sistema de ensinamento",
  "1204 - Status sensores",
  "1205 - Diag não carrega",
  "1206 - Erro de HW",
  "1207 - Duvida em configuração"
];

export const NewTicketForm: React.FC<NewTicketFormProps> = ({ onSubmit, currentUser }) => {
  // Função corrigida para retornar o horário LOCAL em formato YYYY-MM-DDTHH:mm
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    customerName: '',
    analystName: currentUser.name,
    locationName: '',
    supportStartTime: getCurrentDateTime(),
    supportEndTime: '', 
    taskId: '',
    serviceRequest: '',
    hostname: '',
    serialNumber: '',
    subject: SUBJECT_OPTIONS[0],
    description: '',
    analystAction: '',
    isDueCall: false,
    usedACFS: false,
    hasInkStaining: false,
    partReplaced: false,
    partDescription: '',
    tagVLDD: false,
    tagNLVDD: false,
    clientWitnessName: '',
    clientWitnessId: '',
    isEscalated: false,
    isTigerTeam: false
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ solution: string; priority: TicketPriority; escalated: boolean } | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, supportStartTime: getCurrentDateTime() }));
  }, []);

  useEffect(() => {
    const generateSummary = () => {
      const start = formData.supportStartTime ? new Date(formData.supportStartTime).toLocaleString() : 'N/A';
      const end = formData.supportEndTime ? new Date(formData.supportEndTime).toLocaleString() : 'Em aberto';

      return `RESUMO DE ATENDIMENTO
------------------------------------------
ANALISTA: ${formData.analystName}
CLIENTE/LOCAL: ${formData.locationName} | CONTATO: ${formData.customerName}
HOSTNAME: ${formData.hostname} | N. SÉRIE: ${formData.serialNumber || 'N/A'}
TASK: ${formData.taskId} | INC / RITM: ${formData.serviceRequest}
ASSUNTO: ${formData.subject}
TIGER TEAM: ${formData.isTigerTeam ? 'SIM (#198)' : 'NÃO'}
STATUS: ${formData.isEscalated ? 'ESCALONADO (CRÍTICO)' : 'NORMAL'}

ACOMPANHAMENTO:
Cliente: ${formData.clientWitnessName || 'N/A'} (Matrícula: ${formData.clientWitnessId || 'N/A'})

DESCRIÇÃO DO PROBLEMA:
${formData.description || 'N/A'}

AÇÃO DO ANALISTA:
${formData.analystAction || 'N/A'}

VALIDADORES:
[${formData.isDueCall ? 'X' : ' '}] Ligação Devida
[${formData.usedACFS ? 'X' : ' '}] Utilizou ACFS
[${formData.hasInkStaining ? 'X' : ' '}] Ocorreu Entintamento
[${formData.tagVLDD ? 'X' : ' '}] #VLDD#
[${formData.tagNLVDD ? 'X' : ' '}] #NLVDD#

PEÇAS:
Troca de Peça: ${formData.partReplaced ? 'SIM' : 'NÃO'}
${formData.partReplaced ? `Peça(s): ${formData.partDescription}` : ''}

HORÁRIOS:
Início: ${start}
Final:  ${end}
------------------------------------------`;
    };
    setSummaryText(generateSummary());
  }, [formData]);

  const handleAnalyze = async () => {
    if (!formData.description) return;
    setIsAnalyzing(true);
    const context = `Assunto: ${formData.subject}. Descrição: ${formData.description}`;
    const result = await analyzeTicketProblem(context);
    setAiSuggestion({
      solution: result.suggestedSolution,
      priority: result.recommendedPriority,
      escalated: result.isEscalationRecommended
    });
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se a IA sugeriu escalonamento ou o usuário marcou manualmente, o chamado é considerado escalonado
    const isEscalatedFinal = formData.isTigerTeam || formData.isEscalated || (aiSuggestion ? aiSuggestion.escalated : false);
    const priorityFinal = formData.isTigerTeam ? TicketPriority.CRITICAL : (isEscalatedFinal ? TicketPriority.CRITICAL : (aiSuggestion ? aiSuggestion.priority : TicketPriority.MEDIUM));
    
    let initialStatus = TicketStatus.OPEN;
    
    // REGRAS DE STATUS:
    if (formData.isTigerTeam) {
        initialStatus = TicketStatus.IN_PROGRESS;
    } else if (isEscalatedFinal) {
        // Chamados escalonados para validação PRECISAM entrar como OPEN para aparecer na fila de validação,
        // mesmo que o técnico de nível 1 tenha preenchido o horário de término da sua parte.
        initialStatus = TicketStatus.OPEN;
    } else if (formData.supportEndTime) {
        initialStatus = TicketStatus.RESOLVED;
    }

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      ...formData,
      status: initialStatus,
      priority: priorityFinal,
      isEscalated: !!isEscalatedFinal,
      isTigerTeam: !!formData.isTigerTeam,
      aiSuggestedSolution: aiSuggestion?.solution,
      createdAt: new Date(),
    };
    onSubmit(newTicket);
    setFormData({
      customerName: '',
      analystName: currentUser.name,
      locationName: '',
      supportStartTime: getCurrentDateTime(),
      supportEndTime: '', 
      taskId: '',
      serviceRequest: '',
      hostname: '',
      serialNumber: '',
      subject: SUBJECT_OPTIONS[0],
      description: '',
      analystAction: '',
      isDueCall: false,
      usedACFS: false,
      hasInkStaining: false,
      partReplaced: false,
      partDescription: '',
      tagVLDD: false,
      tagNLVDD: false,
      clientWitnessName: '',
      clientWitnessId: '',
      isEscalated: false,
      isTigerTeam: false
    });
    setAiSuggestion(null);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setTimeNow = (field: 'supportStartTime' | 'supportEndTime') => {
    handleChange(field, getCurrentDateTime());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Novo Atendimento Técnico
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Preencha os detalhes técnicos do suporte realizado.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados do Analista
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analista</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={formData.analystName}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Início do Suporte</label>
                    <button type="button" onClick={() => setTimeNow('supportStartTime')} className="text-[10px] text-indigo-600 font-bold hover:underline">AGORA</button>
                </div>
                <input
                  required
                  type="datetime-local"
                  value={formData.supportStartTime}
                  onChange={(e) => handleChange('supportStartTime', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Final do Suporte</label>
                    <button type="button" onClick={() => setTimeNow('supportEndTime')} className="text-[10px] text-indigo-600 font-bold hover:underline">AGORA</button>
                </div>
                <input
                  type="datetime-local"
                  value={formData.supportEndTime}
                  onChange={(e) => handleChange('supportEndTime', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Local e Equipamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium text-gray-700">Nome do Local / Cliente</label>
                <input
                  required
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => handleChange('locationName', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Loja Centro"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Hostname</label>
                <div className="relative">
                  <Monitor className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    required
                    type="text"
                    value={formData.hostname}
                    onChange={(e) => handleChange('hostname', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="WK-001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">N. Série</label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="S/N: 12345"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cliente (Solicitante)</label>
                <input
                  required
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Quem ligou"
                />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Acompanhamento Local
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome do Cliente (Local)</label>
                <input
                  type="text"
                  value={formData.clientWitnessName}
                  onChange={(e) => handleChange('clientWitnessName', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Quem acompanhou a atividade"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Matrícula</label>
                <input
                  type="text"
                  value={formData.clientWitnessId}
                  onChange={(e) => handleChange('clientWitnessId', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="ID / Matrícula"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" /> Task / Chamado
                </label>
                <input
                  required
                  type="text"
                  value={formData.taskId}
                  onChange={(e) => handleChange('taskId', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="TASK-1234"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" /> INC / RITM (Chamado do Cliente)
                </label>
                <input
                  type="text"
                  value={formData.serviceRequest}
                  onChange={(e) => handleChange('serviceRequest', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="INC / RITM-9999"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" /> Subject (Assunto)
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {SUBJECT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Nível Crítico
                </label>
                <div className="flex flex-col gap-2">
                    <div 
                        onClick={() => handleChange('isTigerTeam', !formData.isTigerTeam)}
                        className={`cursor-pointer w-full px-3 py-2 rounded-lg border flex items-center justify-between transition-colors ${formData.isTigerTeam ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                        <span className={`text-xs font-bold flex items-center gap-1 ${formData.isTigerTeam ? 'text-amber-700' : 'text-gray-400'}`}>
                            <Zap className="w-3 h-3" /> #198 TIGER TEAM
                        </span>
                        <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${formData.isTigerTeam ? 'bg-amber-500' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${formData.isTigerTeam ? 'translate-x-3' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    <div 
                        onClick={() => handleChange('isEscalated', !formData.isEscalated)}
                        className={`cursor-pointer w-full px-3 py-2 rounded-lg border flex items-center justify-between transition-colors ${formData.isEscalated ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                        <span className={`text-xs font-bold flex items-center gap-1 ${formData.isEscalated ? 'text-red-700' : 'text-gray-400'}`}>
                            <AlertOctagon className="w-3 h-3" /> ESCALONAR
                        </span>
                        <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${formData.isEscalated ? 'bg-red-500' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${formData.isEscalated ? 'translate-x-3' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
             </div>
          </div>

           <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Validadores Técnicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.isDueCall}
                    onChange={(e) => handleChange('isDueCall', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">Ligação Devida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.usedACFS}
                    onChange={(e) => handleChange('usedACFS', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">Utilizou ACFS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.hasInkStaining}
                    onChange={(e) => handleChange('hasInkStaining', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">Ocorreu Entintamento</span>
                </label>
              </div>
               <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.tagVLDD}
                    onChange={(e) => handleChange('tagVLDD', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-purple-700 transition-colors">#VLDD#</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.tagNLVDD}
                    onChange={(e) => handleChange('tagNLVDD', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-purple-700 transition-colors">#NLVDD#</span>
                </label>
              </div>
              <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-indigo-200 shadow-sm">
                 <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    Foi trocado Peça?
                 </label>
                 <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="partReplaced"
                        checked={formData.partReplaced === true}
                        onChange={() => handleChange('partReplaced', true)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Sim</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="partReplaced"
                        checked={formData.partReplaced === false}
                        onChange={() => handleChange('partReplaced', false)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Não</span>
                    </label>
                 </div>
                 {formData.partReplaced && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text" 
                        value={formData.partDescription}
                        onChange={(e) => handleChange('partDescription', e.target.value)}
                        placeholder="Qual peça foi trocada? (Ex: Fonte ATX, Cabo Flat)"
                        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                 )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Descrição do Problema (Para IA)
                </label>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!formData.description || isAnalyzing}
                  className="text-xs flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isAnalyzing ? 'Analisando...' : 'Classificar com IA'}
                </button>
              </div>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Descreva o erro, sintomas e o que o cliente relatou..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Ação Analista (Resolução)
              </label>
              <textarea
                required
                rows={6}
                value={formData.analystAction}
                onChange={(e) => handleChange('analystAction', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                placeholder="Descreva os passos técnicos realizados, testes e solução aplicada..."
              />
            </div>
          </div>

          {aiSuggestion && (
            <div className={`rounded-xl p-4 border ${aiSuggestion.escalated ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} animate-in fade-in zoom-in-95 duration-300`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${aiSuggestion.escalated ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-semibold ${aiSuggestion.escalated ? 'text-red-900' : 'text-emerald-900'}`}>
                    Análise da IA
                  </h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Sugestão Técnica:</span> {aiSuggestion.solution}</p>
                    <div className="flex gap-3 mt-2">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold border ${aiSuggestion.escalated ? 'bg-red-100 border-red-200 text-red-700' : 'bg-emerald-100 border-emerald-200 text-emerald-700'}`}>
                         Prioridade Recomendada: {aiSuggestion.priority}
                       </span>
                       {aiSuggestion.escalated && (
                         <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">
                           ESCALONAMENTO RECOMENDADO
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl p-4 text-gray-200">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Resumo para Cópia</h3>
               <button 
                 type="button"
                 onClick={handleCopySummary}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
               >
                 {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                 {copied ? 'Copiado!' : 'Copiar Resumo'}
               </button>
             </div>
             <textarea 
               readOnly
               rows={8}
               value={summaryText}
               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-gray-600 resize-none"
             />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform active:scale-95 shadow-lg shadow-indigo-200"
            >
              <Save className="w-5 h-5" />
              Salvar Atendimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
