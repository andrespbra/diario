import React, { useState } from 'react';
import { User, Lock, ArrowRight, Headphones, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { DataManager } from '../services/dataManager';
import { UserProfile } from '../types';

interface LoginPageProps {
    onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await DataManager.authenticate(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
        setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 -skew-y-3 origin-top-left transform -translate-y-20 z-0"></div>
       
       <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 border border-gray-800">
          <div className="p-8 space-y-8">
             <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 mb-2 shadow-lg shadow-indigo-500/30">
                    <Headphones className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">HelpDesk AI Pro</h1>
                <p className="text-gray-400 text-sm">
                    Acesso Seguro (Cloud Online)
                </p>
             </div>

             {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 text-red-200 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                </div>
             )}

             <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuário</label>
                   <div className="relative group">
                      <User className="w-5 h-5 text-gray-500 absolute left-3 top-3 transition-colors group-focus-within:text-indigo-500" />
                      <input 
                        required
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: admin"
                        className="w-full pl-10 pr-4 py-3 bg-[#1F2937] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
                   <div className="relative group">
                      <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-3 transition-colors group-focus-within:text-indigo-500" />
                      <input 
                        required
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-10 pr-4 py-3 bg-[#1F2937] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                      />
                   </div>
                </div>

                <button 
                   type="submit"
                   disabled={loading}
                   className="w-full font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/50"
                >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     <>Entrar <ArrowRight className="w-4 h-4" /></>
                   }
                </button>
             </form>
             
             {/* Cloud Hint */}
             <div className="pt-2 border-t border-gray-800/50">
                 <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                     <Cloud className="w-3 h-3" /> Conectado ao Supabase
                 </div>
                 
                 {/* SQL Helper Hint */}
                 <div className="bg-black/30 p-2 rounded border border-gray-700 mt-2 text-center">
                    <p className="font-mono text-gray-500 mb-1 text-[10px] uppercase">Credenciais Padrão (Após rodar SQL)</p>
                    <p className="text-white font-mono text-xs">User: admin</p>
                    <p className="text-white font-mono text-xs">Pass: 123456</p>
                </div>
             </div>
          </div>
          
          <div className="bg-[#111827] px-8 py-4 border-t border-gray-800 text-center">
             <p className="text-gray-500 text-xs font-medium tracking-wide">© 2025 HelpDesk AI. Todos os direitos reservados.</p>
          </div>
       </div>
    </div>
  );
};