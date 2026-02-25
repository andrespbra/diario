
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Database, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import { DataManager } from '../services/dataManager';
import { NatEntry } from '../types';

export const NatManager: React.FC = () => {
  const [entries, setEntries] = useState<NatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

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
      complete: async (results) => {
        try {
          const rawData = results.data as any[];
          
          // Mapeamento de campos (suporta maiúsculas/minúsculas)
          const mappedData: NatEntry[] = rawData.map(row => {
            const getVal = (keys: string[]) => {
              const key = keys.find(k => row[k] !== undefined || row[k.toUpperCase()] !== undefined || row[k.toLowerCase()] !== undefined);
              return key ? (row[key] || row[key.toUpperCase()] || row[key.toLowerCase()] || '').toString().trim() : '';
            };

            return {
              hostname: getVal(['HOSTNAME', 'hostname', 'Host']),
              modelo: getVal(['MODELO', 'modelo', 'Model']),
              serie: getVal(['SERIE', 'serie', 'Serial', 'Série']),
              filial: getVal(['FILIAL', 'filial', 'Branch'])
            };
          }).filter(item => item.hostname);

          if (mappedData.length === 0) {
            throw new Error("Nenhum dado válido encontrado no CSV. Verifique os cabeçalhos: HOSTNAME, MODELO, SERIE, FILIAL.");
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

  const filteredEntries = entries.filter(e => 
    e.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.filial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Base NAT
          </h1>
          <p className="text-slate-500">Gerenciamento de equipamentos NAT via importação CSV</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importar CSV
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por hostname, modelo, série ou filial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
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
                      <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhum registro encontrado</p>
                    <p className="text-slate-400 text-xs mt-1">Importe um arquivo CSV para começar</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-indigo-600 font-medium">{entry.hostname}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.modelo}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.serie}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-500 uppercase">
                        {entry.filial}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredEntries.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/30">
            <p className="text-xs text-slate-400 font-medium">
              Mostrando {filteredEntries.length} de {entries.length} registros
            </p>
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
