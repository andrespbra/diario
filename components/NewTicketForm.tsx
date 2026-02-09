
import React, { useState, useEffect } from 'react';
import { TicketPriority, TicketStatus, Ticket, UserProfile, Asset } from '../types';
import { analyzeTicketProblem } from '../services/geminiService';
import { Sparkles, Save, Loader2, User, FileText, MapPin, Hash, Monitor, Clock, Tag, Briefcase, Wrench, CheckSquare, Copy, Check, Users, AlertOctagon, Zap, Barcode, Database } from 'lucide-react';

interface NewTicketFormProps {
  onSubmit: (ticket: Ticket) => void;
  currentUser: UserProfile;
  prefilledAsset?: Asset | null;
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

export const NewTicketForm: React.FC<NewTicketFormProps> = ({ onSubmit, currentUser, prefilledAsset }) => {
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
    isTigerTeam: false,
    // Novos campos vinculados ao Ativo
    termId: '',
    filial: '',
    codSite: '',
    equipTipo2: '',
    produto: ''
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ solution: string; priority: TicketPriority; escalated: boolean } | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [copied, setCopied] = useState(false);

  // Efeito para preencher o formulário se um ativo for selecionado na base
  useEffect(() => {
    if (prefilledAsset) {
      setFormData(prev => ({
        ...prev,
        hostname: prefilledAsset.hostname,
        serialNumber: prefilledAsset.serialNumber,
        locationName: prefilledAsset.locationName,
        termId: prefilledAsset.termId,
        filial: prefilledAsset.filial,
        codSite: prefilledAsset.codSite,
        equipTipo2: prefilledAsset.equipTipo2,
        produto: prefilledAsset.produto,
        supportStartTime: getCurrentDateTime()
      }));
    }
  }, [prefilledAsset]);

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
TERM ID: ${formData.termId || 'N/A'}
TASK: ${formData.taskId} | INC / RITM: ${formData.serviceRequest}
ASSUNTO: ${formData.subject}
TIGER TEAM: ${formData.isTigerTeam ? 'SIM (#198)' : 'NÃO'}
STATUS: ${formData.isEscalated ? 'ESCALONADO (CRÍTICO)' : 'NORMAL'}

ACOMPANHAMENTO:
Cliente: ${formData.clientWitnessName || 'N/A'} (Matrícula: ${formData.clientWitnessId || 'N/A'})

DESCRIÇÃO DO PROBLEMA:
${formData.description || 'N/A'}

PLANO DE AÇÃO / AÇÃO DO ANALISTA:
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
    
    const isActuallyEscalated = formData.isEscalated || (aiSuggestion ? aiSuggestion.escalated : false);
    
    let initialStatus = TicketStatus.OPEN;
    let priorityFinal = aiSuggestion ? aiSuggestion.priority : TicketPriority.MEDIUM;

    if (formData.isTigerTeam) {
        initialStatus = TicketStatus.IN_PROGRESS;
        priorityFinal = TicketPriority.CRITICAL;
    } else if (isActuallyEscalated) {
        initialStatus = TicketStatus.OPEN;
        priorityFinal = TicketPriority.CRITICAL;
    } else if (formData.supportEndTime) {
        initialStatus = TicketStatus.RESOLVED;
    }

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      ...formData,
      status: initialStatus,
      priority: priorityFinal,
      isEscalated: !!(isActuallyEscalated || formData.isTigerTeam),
      isTigerTeam: !!formData.isTigerTeam,
      aiSuggestedSolution: aiSuggestion?.solution,
      createdAt: new Date(),
    };
    
    onSubmit(newTicket);
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
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {prefilledAsset ? 'Novo Atendimento (Ativo Vinculado)' : 'Novo Atendimento Técnico'}
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Preencha os detalhes técnicos do suporte realizado.</p>
          </div>
          {prefilledAsset && (
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs font-bold flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              DADOS DA BASE CARREGADOS
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Dados do Analista e Horários */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados do Atendimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analista Responsável</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={formData.analystName}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none font-semibold"
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

          {/* Dados do Equipamento (Travados se vierem da base) */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Informações do Ativo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Hostname</label>
                <div className="relative">
                  <Monitor className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    required
                    readOnly={!!prefilledAsset}
                    type="text"
                    value={formData.hostname}
                    onChange={(e) => handleChange('hostname', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none ${prefilledAsset ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`}
                    placeholder="WK-001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">N. Série</label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    readOnly={!!prefilledAsset}
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none ${prefilledAsset ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`}
                    placeholder="S/N: 12345"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Term ID (SGPI)</label>
                <input
                  readOnly={!!prefilledAsset}
                  type="text"
                  value={formData.termId}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filial / Cod. Site</label>
                <input
                  readOnly={!!prefilledAsset}
                  type="text"
                  value={formData.filial ? `${formData.filial} (${formData.codSite})` : ''}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium text-gray-700">Localização / Cliente</label>
                <input
                  required
                  readOnly={!!prefilledAsset}
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => handleChange('locationName', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-200 outline-none ${prefilledAsset ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium text-gray-700">Produto / Modelo</label>
                <input
                  readOnly={!!prefilledAsset}
                  type="text"
                  value={formData.produto}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>

          {/* Chamado do Cliente e Níveis Críticos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" /> Número da Task / Chamado Interno
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
                  <Tag className="w-4 h-4 text-gray-400" /> INC / RITM (Chamado Externo)
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
                  <Zap className="w-4 h-4 text-amber-500" /> Nível Crítico
                </label>
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => handleChange('isTigerTeam', !formData.isTigerTeam)}
                        className={`flex-1 px-3 py-2 rounded-lg border flex items-center justify-between transition-colors ${formData.isTigerTeam ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                        <span className={`text-xs font-bold flex items-center gap-1 ${formData.isTigerTeam ? 'text-amber-700' : 'text-gray-400'}`}>
                            TIGER TEAM
                        </span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${formData.isTigerTeam ? 'bg-amber-500' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${formData.isTigerTeam ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleChange('isEscalated', !formData.isEscalated)}
                        className={`flex-1 px-3 py-2 rounded-lg border flex items-center justify-between transition-colors ${formData.isEscalated ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                        <span className={`text-xs font-bold flex items-center gap-1 ${formData.isEscalated ? 'text-red-700' : 'text-gray-400'}`}>
                            ESCALADO
                        </span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${formData.isEscalated ? 'bg-red-500' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${formData.isEscalated ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Descrição e Plano de Ação */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Descrição do Defeito (Relatado pelo Técnico)
                </label>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!formData.description || isAnalyzing}
                  className="text-xs flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-full font-bold transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Analisar com IA
                </button>
              </div>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Descreva o defeito encontrado e sintomas relatados pelo técnico em campo..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Plano de Ação Sugerido / Ações Tomadas
              </label>
              <textarea
                required
                rows={6}
                value={formData.analystAction}
                onChange={(e) => handleChange('analystAction', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 font-medium"
                placeholder="Descreva os passos sugeridos para a resolução ou o que já foi executado pelo técnico..."
              />
            </div>
          </div>

          {/* Validadores Extras */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Validadores Técnicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={formData.isDueCall} onChange={(e) => handleChange('isDueCall', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Ligação Devida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={formData.usedACFS} onChange={(e) => handleChange('usedACFS', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Utilizou ACFS</span>
                </label>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={formData.tagVLDD} onChange={(e) => handleChange('tagVLDD', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" />
                  <span className="text-sm font-bold text-gray-700">#VLDD#</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={formData.tagNLVDD} onChange={(e) => handleChange('tagNLVDD', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" />
                  <span className="text-sm font-bold text-gray-700">#NLVDD#</span>
                </label>
              </div>
              <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-indigo-200">
                 <label className="text-sm font-semibold text-gray-700 mb-2 block">Peças Trocadas?</label>
                 <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.partReplaced} onChange={() => handleChange('partReplaced', true)} /> <span className="text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!formData.partReplaced} onChange={() => handleChange('partReplaced', false)} /> <span className="text-sm">Não</span>
                    </label>
                 </div>
                 {formData.partReplaced && (
                    <input type="text" value={formData.partDescription} onChange={(e) => handleChange('partDescription', e.target.value)} placeholder="Descrição da peça" className="w-full px-3 py-2 text-sm rounded border border-gray-300 outline-none" />
                 )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 text-gray-200">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Resumo do Chamado</h3>
               <button type="button" onClick={handleCopySummary} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                 {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copiado!' : 'Copiar'}
               </button>
             </div>
             <textarea readOnly rows={6} value={summaryText} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-[10px] font-mono text-gray-400 resize-none outline-none" />
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl font-bold shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all transform active:scale-95">
              <Save className="w-5 h-5" />
              Salvar Atendimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
