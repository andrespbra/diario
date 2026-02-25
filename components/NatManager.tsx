
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Database, FileText, CheckCircle2, AlertCircle, Loader2, Download, Network, X, Filter } from 'lucide-react';
import Papa from 'papaparse';
import { DataManager } from '../services/dataManager';
import { NatEntry } from '../types';
import { generateNatIcon } from '../services/iconGenerator';

export const NatManager: React.FC = () => {
  const [entries, setEntries] = useState<NatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEntries();
    loadIcon();
  }, []);

  const loadIcon = async () => {
    try {
      const icon = await generateNatIcon();
      setGeneratedIcon(icon);
    } catch (err) {
      console.error("Failed to generate icon", err);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await DataManager.getNatEntries();
      setEntries(data);
    } catch (error) {
      console.error("Erro ao carregar NAT:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
      complete: async (results) => {
        try {
          const rawData = results.data as any[];
          
          const mappedData: NatEntry[] = rawData.map(row => {
            return {
              hostname: (row['HOSTNAME'] || row['HOST'] || '').toString().trim(),
              modelo: (row['MODELO'] || row['MODEL'] || '').toString().trim(),
              serie: (row['SERIE'] || row['SÉRIE'] || row['SERIAL'] || '').toString().trim(),
              filial: (row['FILIAL'] || row['BRANCH'] || '').toString().trim()
            };
          }).filter(item => item.hostname);

          if (mappedData.length === 0) {
            throw new Error("Nenhum dado válido encontrado no CSV. Verifique se o arquivo contém a coluna HOSTNAME.");
          }

          const count = await DataManager.upsertNatEntries(mappedData);
          setStatus({ type: 'success', message: `${count} registros NAT importados/atualizados com sucesso!` });
          fetchEntries();
        } catch (error: any) {
          setStatus({ type: 'error', message: error.message || "Erro ao processar arquivo." });
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        setStatus({ type: 'error', message: "Erro no parser de CSV: " + error.message });
        setImporting(false);
      }
    });
  };

  const filteredEntries = entries.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      (e.hostname || '').toLowerCase().includes(term) ||
      (e.modelo || '').toLowerCase().includes(term) ||
      (e.serie || '').toLowerCase().includes(term) ||
      (e.filial || '').toLowerCase().includes(term)
    );
  });

  const highlightText = (text: string | undefined | null, highlight: string) => {
    const safeText = text || '';
    if (!highlight.trim()) return safeText;
    const parts = safeText.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {generatedIcon ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
              <img src={generatedIcon} alt="NAT Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
              <Network className="w-8 h-8 text-indigo-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Base NAT
            </h1>
            <p className="text-slate-500">Gerenciamento de equipamentos NAT via importação CSV</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importar CSV
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{status.message}</p>
          <button onClick={() => setStatus(null)} className="ml-auto p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchTerm ? 'text-indigo-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Buscar por hostname, modelo, série ou filial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-xs font-bold whitespace-nowrap">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 border-b border-slate-200">Hostname</th>
                <th className="px-6 py-4 border-b border-slate-200">Modelo</th>
                <th className="px-6 py-4 border-b border-slate-200">Série</th>
                <th className="px-6 py-4 border-b border-slate-200">Filial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Carregando dados...</p>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      {searchTerm ? <Search className="w-6 h-6 text-slate-300" /> : <FileText className="w-6 h-6 text-slate-300" />}
                    </div>
                    <p className="text-slate-500 font-medium">
                      {searchTerm ? 'Nenhum resultado para sua busca' : 'Nenhum registro encontrado'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {searchTerm ? 'Tente termos mais genéricos ou verifique a ortografia' : 'Importe um arquivo CSV para começar'}
                    </p>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
                      >
                        Limpar busca
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-indigo-600 font-medium">
                        {highlightText(entry.hostname, searchTerm)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {highlightText(entry.modelo, searchTerm)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {highlightText(entry.serie, searchTerm)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-500 uppercase">
                        {highlightText(entry.filial, searchTerm)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredEntries.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Mostrando {filteredEntries.length} de {entries.length} registros
            </p>
            {searchTerm && (
              <p className="text-xs text-indigo-400 italic">
                Filtrado por "{searchTerm}"
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
          <h3 className="text-indigo-900 font-semibold text-sm mb-1">Dica de Importação</h3>
          <p className="text-indigo-700 text-xs leading-relaxed">
            O arquivo CSV deve conter os cabeçalhos: <code className="bg-indigo-100 px-1 rounded">HOSTNAME</code>, 
            <code className="bg-indigo-100 px-1 rounded">MODELO</code>, 
            <code className="bg-indigo-100 px-1 rounded">SERIE</code> e 
            <code className="bg-indigo-100 px-1 rounded">FILIAL</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

