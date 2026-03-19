
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Ticket, 
  TicketStatus, 
  NatEntry, 
  OffenderType 
} from '../types';
import { DataManager } from '../services/dataManager';
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
import { 
  BarChart3, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Network, 
  PhoneCall, 
  Download, 
  Filter, 
  Search, 
  ChevronDown, 
  FileText, 
  Table,
  MapPin,
  Calendar,
  Tag,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ReportsProps {
  tickets: Ticket[];
  natEntries: NatEntry[];
  onRefresh?: () => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export const Reports: React.FC<ReportsProps> = ({ tickets, natEntries, onRefresh }) => {
  const [filterFilial, setFilterFilial] = useState<string>('all');
  const [filterNLVDD, setFilterNLVDD] = useState<string>('all');
  const [filterEscalated, setFilterEscalated] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<number | null>(null);
  const [columnExists, setColumnExists] = useState<boolean | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);

  useEffect(() => {
    const checkColumn = async () => {
      const { exists } = await DataManager.verifyFilialColumn();
      setColumnExists(exists);
    };
    checkColumn();
  }, []);

  const handleFixFiliais = async () => {
    setIsFixing(true);
    setFixResult(null);
    setFixError(null);
    try {
      const count = await DataManager.fixMissingFiliais();
      setFixResult(count);
      if (count > 0 && onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
      setFixError(err.message || "Erro ao corrigir filiais.");
    } finally {
      setIsFixing(false);
    }
  };

  // Unique filiais for filter
  const filiais = useMemo(() => {
    const unique = new Set(tickets.map(t => t.filial).filter(Boolean));
    return Array.from(unique).sort();
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesFilial = filterFilial === 'all' || t.filial === filterFilial;
      const matchesNLVDD = filterNLVDD === 'all' || (filterNLVDD === 'yes' ? t.tagNLVDD : !t.tagNLVDD);
      const matchesEscalated = filterEscalated === 'all' || (filterEscalated === 'yes' ? t.isEscalated : !t.isEscalated);
      const matchesSearch = searchTerm === '' || 
        t.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.hostname.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilial && matchesNLVDD && matchesEscalated && matchesSearch;
    });
  }, [tickets, filterFilial, filterNLVDD, filterEscalated, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const inProgress = filteredTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
    const tigerTeam = filteredTickets.filter(t => t.isTigerTeam).length;
    const escalated = filteredTickets.filter(t => t.isEscalated).length;
    
    const natHostnames = new Set(natEntries.map(n => n.hostname?.toLowerCase()));
    const openWithNat = filteredTickets.filter(t => 
      t.status === TicketStatus.OPEN && 
      t.hostname && 
      natHostnames.has(t.hostname.toLowerCase())
    ).length;
    
    const open = filteredTickets.filter(t => t.status === TicketStatus.OPEN).length;

    return { total, inProgress, tigerTeam, escalated, openWithNat, open };
  }, [filteredTickets, natEntries]);

  // Chart Data: Tickets vs Filial
  const filialChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const f = t.filial || 'N/A';
      counts[f] = (counts[f] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredTickets]);

  // Chart Data: Top Locations
  const locationChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      counts[t.locationName] = (counts[t.locationName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredTickets]);

  // Chart Data: Offender Categories
  const offenderChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      if (t.offenderRecidivism) {
        counts[t.offenderRecidivism] = (counts[t.offenderRecidivism] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTickets]);

  // List: Escalated by Client (Assuming isEscalated means escalated by client in this context)
  const escalatedByClient = useMemo(() => {
    return filteredTickets.filter(t => t.isEscalated);
  }, [filteredTickets]);

  // List: All Open Tickets
  const allOpenTickets = useMemo(() => {
    return filteredTickets.filter(t => t.status === TicketStatus.OPEN);
  }, [filteredTickets]);

  const exportToCSV = () => {
    const headers = ['ID', 'Task ID', 'Filial', 'Cliente', 'Hostname', 'Status', 'Escalado', 'Tiger Team', 'Data'];
    const rows = filteredTickets.map(t => [
      t.id,
      t.taskId,
      t.filial || '',
      t.customerName,
      t.hostname,
      t.status,
      t.isEscalated ? 'Sim' : 'Não',
      t.isTigerTeam ? 'Sim' : 'Não',
      new Date(t.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_chamados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(filteredTickets, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_chamados_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios Executivos</h1>
          <p className="text-slate-500 font-medium">Análise detalhada e métricas de performance operacional.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToJSON}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            JSON
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por Task ID, Cliente ou Hostname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterFilial}
                onChange={(e) => setFilterFilial(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">Todas as Filiais</option>
                {filiais.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterNLVDD}
                onChange={(e) => setFilterNLVDD(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">#NLVDD# (Todos)</option>
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterEscalated}
                onChange={(e) => setFilterEscalated(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">Escalados (Todos)</option>
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ReportCard title="TOTAL DE CHAMADOS" value={stats.total} icon={BarChart3} color="bg-indigo-600" />
        <ReportCard title="EM ATENDIMENTO" value={stats.inProgress} icon={Clock} color="bg-blue-500" />
        <ReportCard title="TIGER TEAM (198)" value={stats.tigerTeam} icon={Zap} color="bg-amber-500" />
        <ReportCard title="ESCALADOS" value={stats.escalated} icon={AlertTriangle} color="bg-red-500" />
        <ReportCard title="ABERTOS COM NAT" value={stats.openWithNat} icon={Network} color="bg-cyan-600" />
        <ReportCard title="EM ABERTO" value={stats.open} icon={PhoneCall} color="bg-slate-700" />
      </div>

      {/* Data Maintenance Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Wrench className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Manutenção de Dados</h3>
                <p className="text-sm text-slate-500 font-medium">Corrija chamados sem filial classificada usando a base de ativos.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {fixResult !== null && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-right-4">
                  <CheckCircle2 className="w-4 h-4" />
                  {fixResult} chamados corrigidos!
                </div>
              )}
              {fixError && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-right-4">
                  <AlertCircle className="w-4 h-4" />
                  {fixError}
                </div>
              )}
              <button 
                onClick={handleFixFiliais}
                disabled={isFixing || columnExists === false}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  isFixing || columnExists === false
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'
                }`}
              >
                {isFixing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    Corrigir Filiais
                  </>
                )}
              </button>
            </div>
          </div>

          {columnExists === false && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1 uppercase tracking-tight">Coluna 'filial' ausente na tabela 'tickets'</h4>
                  <p className="text-xs text-amber-800 mb-3 font-medium">
                    A coluna 'filial' não foi detectada no banco de dados. 
                    Para habilitar esta função, execute o comando SQL abaixo no seu dashboard do Supabase:
                  </p>
                  <div className="relative group">
                    <pre className="bg-white/80 p-4 rounded-xl text-[11px] font-mono text-slate-800 overflow-x-auto border border-amber-200 shadow-inner">
                      ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS filial TEXT;
                    </pre>
                    <button 
                      onClick={() => navigator.clipboard.writeText("ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS filial TEXT;")}
                      className="absolute top-2 right-2 p-2 bg-white rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                      title="Copiar SQL"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dashboards Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Chamados vs Filial</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 10 Filiais</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filialChartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {filialChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Locais com Maiores Índices</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 10 Sites</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                  {locationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dashboard Row 2: Offender Categories */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Categorias de Ofensores</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribuição de Recidiva</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={offenderChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {offenderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingLeft: '40px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {offenderChartData.slice(0, 6).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">{item.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Chamados</span>
                </div>
              </div>
            ))}
            {offenderChartData.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <p className="text-sm font-bold">Sem dados de ofensores</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Escalated by Client */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Escalonados pelo Cliente</h3>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full">{escalatedByClient.length}</span>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filial</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {escalatedByClient.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{t.taskId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 truncate max-w-[150px]">{t.customerName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{t.filial || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {escalatedByClient.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">Nenhum chamado escalado encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Open Tickets */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <PhoneCall className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Todos os Chamados em Aberto</h3>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full">{allOpenTickets.length}</span>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hostname</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allOpenTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{t.taskId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{t.hostname}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        t.priority === 'Crítica' ? 'bg-red-100 text-red-700' : 
                        t.priority === 'Alta' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {allOpenTickets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">Nenhum chamado em aberto.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReportCardProps {
  title: string;
  value: number;
  icon: any;
  color: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="h-1 w-8 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} w-2/3`}></div>
      </div>
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);
