
import React, { useState, useEffect, useMemo } from 'react';
import { Asset } from '../types';
import { DataManager } from '../services/dataManager';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  Database, 
  Upload, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet,
  Monitor,
  MapPin,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ArrowRight,
  X,
  Info
} from 'lucide-react';
import Papa from 'papaparse';

export const AssetManager: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setAssets([]);
        setMessage({ text: "O banco de dados não está configurado. A importação está desativada.", type: 'warning' });
        return;
      }
      const data = await DataManager.getAssets();
      setAssets(data);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Erro ao carregar: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured) {
      alert("Erro: Banco de Dados não configurado. Não é possível importar dados no Modo Demo.");
      if (e.target) e.target.value = '';
      return;
    }

    setImporting(true);
    setMessage({ text: "Lendo arquivo e preparando dados...", type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      delimiter: ";",
      transformHeader: (h) => h.replace(/^\ufeff/g, '').trim(),
      complete: async (results) => {
        try {
          const rows = results.data;
          if (!rows || rows.length === 0) throw new Error("O arquivo selecionado parece estar vazio.");

          // Mapeamento Ultra-Resiliente (Ignora caracteres especiais nos nomes das colunas)
          const getValue = (row: any, aliases: string[]) => {
            const keys = Object.keys(row);
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            for (const alias of aliases) {
              const target = normalize(alias);
              const foundKey = keys.find(k => normalize(k).includes(target));
              if (foundKey) return row[foundKey];
            }
            return '';
          };

          const mappedAssets: Asset[] = rows.map((row: any) => {
            const hostname = getValue(row, ['HOSTNAME', 'HOST']);
            // Se não houver hostname, tentamos o TERM ID como fallback ou ignoramos
            if (!hostname) return null;

            return {
              termId: String(getValue(row, ['SGPI', 'TERM_ID', 'TERM ID', 'SGPI (TERM ID)']) || '').trim(),
              produto: String(getValue(row, ['PRODUTO', 'MODELO']) || '').trim(),
              hostname: String(hostname).trim(),
              serialNumber: String(getValue(row, ['Equip|Serie', 'Serie', 'SERIAL', 'N_SERIE']) || '').trim(),
              equipTipo2: String(getValue(row, ['Equip.|Tipo-2', 'Tipo', 'TIPO_EQUIP']) || '').trim(),
              filial: String(getValue(row, ['Filial', 'FILIAL_NOME']) || '').trim(),
              codSite: String(getValue(row, ['Cod. Site', 'Cod Site', 'COD_SITE']) || '').trim(),
              locationName: String(getValue(row, ['Site Nome', 'Site', 'SITE_NOME', 'NOME_SITE']) || '').trim()
            };
          }).filter((a): a is Asset => a !== null && a.hostname.length > 0);

          if (mappedAssets.length === 0) {
            throw new Error("Não foi possível identificar a coluna 'HOSTNAME'. Verifique o cabeçalho do seu CSV.");
          }

          setMessage({ text: `Enviando ${mappedAssets.length} registros para o banco de dados...`, type: 'info' });
          const count = await DataManager.upsertAssets(mappedAssets);
          
          setMessage({ text: `${count} ativos importados/atualizados com sucesso!`, type: 'success' });
          await loadAssets();
        } catch (err: any) {
          console.error("Erro Crítico na Importação:", err);
          setMessage({ text: err.message, type: 'error' });
        } finally {
          setImporting(false);
          if (e.target) e.target.value = '';
        }
      },
      error: (error) => {
        setMessage({ text: `Erro ao processar CSV: ${error.message}`, type: 'error' });
        setImporting(false);
      }
    });
  };

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const lowSearch = searchTerm.toLowerCase();
    return assets.filter(a => 
      (a.hostname || '').toLowerCase().includes(lowSearch) ||
      (a.serialNumber || '').toLowerCase().includes(lowSearch) ||
      (a.locationName || '').toLowerCase().includes(lowSearch) ||
      (a.termId || '').toLowerCase().includes(lowSearch)
    );
  }, [assets, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Base de Ativos
          </h1>
          <p className="text-sm text-gray-500">Gestão de equipamentos para preenchimento automático.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>

          <label className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 text-sm ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{importing ? 'Importando...' : 'Importar CSV'}</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={importing} />
          </label>
          
          <button onClick={loadAssets} disabled={loading} className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Ambiente de Demonstração (Local)</p>
            <p className="text-xs text-amber-700">Conecte o Supabase para habilitar a importação definitiva e o armazenamento em nuvem.</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          message.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-xs font-bold uppercase hover:underline">Fechar</button>
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            {loading && assets.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">Sincronizando base de dados...</p>
               </div>
            ) : filteredAssets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-gray-500">
                <FileSpreadsheet className="w-12 h-12 text-gray-200 mb-3" />
                <p className="font-bold">{searchTerm ? 'Nada encontrado.' : 'Nenhum ativo cadastrado.'}</p>
                <p className="text-xs text-gray-400 mt-1">Clique em importar para carregar sua planilha.</p>
              </div>
            ) : viewMode === 'table' ? (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Equipamento</th>
                    <th className="px-6 py-4">SGPI / Site</th>
                    <th className="px-6 py-4">Nome do Site</th>
                    <th className="px-6 py-4">Tipo / Produto</th>
                    <th className="px-6 py-4 text-right">Filial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssets.map((asset, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                            <Monitor className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 font-mono text-sm">{asset.hostname}</span>
                            <span className="text-[10px] text-gray-500 font-mono">S/N: {asset.serialNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-indigo-700 font-mono">{asset.termId}</span>
                          <span className="text-[10px] text-gray-400">Site: {asset.codSite}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700 text-xs uppercase line-clamp-1">{asset.locationName}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-600">{asset.equipTipo2}</span>
                           <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{asset.produto}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">
                          {asset.filial.split('-')[0]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {filteredAssets.map((asset, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Monitor className="w-12 h-12" /></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-indigo-600 font-mono">{asset.hostname}</h3>
                        <p className="text-[10px] text-gray-400 font-mono">SN: {asset.serialNumber}</p>
                      </div>
                      <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded">
                        {asset.termId}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-700 font-semibold uppercase leading-tight line-clamp-2">{asset.locationName}</p>
                    </div>
                    <div className="mt-2 pt-3 border-t border-gray-50 flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.produto.split(' ')[0]}</span>
                       <span className="text-[9px] font-bold text-indigo-600 uppercase">{asset.codSite}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
            <span>{filteredAssets.length} registros</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className={isSupabaseConfigured ? 'text-green-600' : 'text-gray-400'}>{isSupabaseConfigured ? 'Sincronizado' : 'Modo Demo'}</span>
            </div>
          </div>
      </div>
    </div>
  );
};
