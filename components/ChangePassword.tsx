import React, { useState } from 'react';
import { Lock, Save, KeyRound, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

interface ChangePasswordProps {
  onPasswordChange: (newPassword: string) => Promise<void>;
  username: string;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onPasswordChange, username }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await onPasswordChange(newPassword);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-orange-50 p-6 border-b border-orange-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert className="w-7 h-7 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Alteração de Senha Obrigatória</h2>
            <p className="text-sm text-gray-500 mt-1">
                Olá <span className="font-semibold text-gray-700">{username}</span>. Por segurança, você deve definir uma nova senha para continuar.
            </p>
        </div>

        {/* Form */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
                    <div className="relative">
                        <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input 
                            required
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input 
                            required
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Nova Senha
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};