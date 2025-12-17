import React, { useState } from 'react';
import { UserProfile, UserLevel } from '../types';
import { UserPlus, Shield, User, Trash2, Save, Lock, Loader2 } from 'lucide-react';

interface SettingsProps {
  users: UserProfile[];
  onAddUser: (user: UserProfile, password?: string) => Promise<void>;
  onDeleteUser: (userId: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '', 
    nivel: 'Analista' as UserLevel
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe ID generator
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password) return;
    
    setIsSubmitting(true);

    const userProfile: UserProfile = {
      id: generateId(), // ID temporário, será substituído pelo real na função pai
      name: newUser.name,
      username: newUser.username,
      nivel: newUser.nivel
    };

    await onAddUser(userProfile, newUser.password);
    
    setIsSubmitting(false);
    setNewUser({ name: '', username: '', password: '', nivel: 'Analista' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-slate-800 p-2 rounded-lg">
           <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Gerenciar Acessos</h1>
           <p className="text-sm text-gray-500">Controle de usuários e permissões do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-1">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                 <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Adicionar Usuário
                 </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nome</label>
                    <input 
                      required
                      type="text" 
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Nome do colaborador"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Login (Email/User)</label>
                    <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input 
                        required
                        type="text" 
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        placeholder="usuario.sistema"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Senha Inicial</label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input 
                        required
                        type="password" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Permissão</label>
                    <select 
                       value={newUser.nivel}
                       onChange={(e) => setNewUser({...newUser, nivel: e.target.value as UserLevel})}
                       className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                       <option value="Analista">Analista</option>
                       <option value="Admin">Administrador</option>
                    </select>
                 </div>

                 <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                 >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Cadastrar
                        </>
                    )}
                 </button>
              </form>
           </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                 <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-600" />
                    Usuários Cadastrados
                 </h2>
                 <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                    Total: {users.length}
                 </span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                       <tr>
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Login</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nível</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${user.nivel === 'Admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                                      {user.name.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="font-bold text-gray-900">{user.name}</span>
                                     <span className="text-[10px] text-gray-400 font-mono">ID: {user.id.substring(0, 8)}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-sm text-gray-600 font-medium font-mono">
                                {user.username}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                   user.nivel === 'Admin' 
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                   {user.nivel}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button 
                                   onClick={() => onDeleteUser(user.id)}
                                   disabled={user.username === 'admin'} 
                                   className={`p-2 rounded-lg transition-colors ${
                                      user.username === 'admin' 
                                         ? 'text-gray-300 cursor-not-allowed' 
                                         : 'text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100'
                                   }`}
                                   title="Remover"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};