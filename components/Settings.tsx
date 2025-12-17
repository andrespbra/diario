import React, { useState } from 'react';
import { UserProfile, UserLevel } from '../types';
import { UserPlus, Shield, User, Trash2, Save, Lock, Info } from 'lucide-react';

interface SettingsProps {
  users: UserProfile[];
  onAddUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '', // Visual only for this demo
    nivel: 'Analista' as UserLevel
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username) return;

    const userProfile: UserProfile = {
      id: crypto.randomUUID(), // Simulating Supabase UUID
      name: newUser.name,
      username: newUser.username,
      nivel: newUser.nivel
    };

    onAddUser(userProfile);
    setNewUser({ name: '', username: '', password: '', nivel: 'Analista' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-slate-800 p-2 rounded-lg">
           <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
           <p className="text-sm text-gray-500">Gerenciamento de usuários e permissões (Tabela: perfis_usuario).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-1">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                 <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Novo Usuário
                 </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Ex: Maria Silva"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Usuário</label>
                    <input 
                      required
                      type="text" 
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="Ex: maria.silva"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Senha Provisória</label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input 
                        required
                        type="password" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="••••••"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nível de Acesso</label>
                    <select 
                       value={newUser.nivel}
                       onChange={(e) => setNewUser({...newUser, nivel: e.target.value as UserLevel})}
                       className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                       <option value="Analista">Analista</option>
                       <option value="Admin">Administrador</option>
                    </select>
                    <div className="flex items-start gap-2 mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Ao criar no Supabase, o sistema completará o email automaticamente (ex: usuario@helpdesk.com).</p>
                    </div>
                 </div>
                 <button 
                    type="submit"
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                 >
                    <Save className="w-4 h-4" />
                    Cadastrar Usuário
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
                 <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    Total: {users.length}
                 </span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                       <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nível</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.nivel === 'Admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                      {user.name.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="font-medium text-gray-900">{user.name}</span>
                                     <span className="text-[10px] text-gray-400 font-mono">ID: {user.id.slice(0, 8)}...</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                {user.username}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                                   disabled={user.username === 'admin'} // Cannot delete main admin
                                   className={`p-2 rounded-lg transition-colors ${
                                      user.username === 'admin' 
                                         ? 'text-gray-300 cursor-not-allowed' 
                                         : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                   }`}
                                   title="Remover Usuário"
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