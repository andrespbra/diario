import React, { useState } from 'react';
import { UserProfile, UserLevel } from '../types';
import { UserPlus, Shield, User, Trash2, Save, Lock, Loader2, Search, X, Mail, Key } from 'lucide-react';

interface SettingsProps {
  users: UserProfile[];
  onAddUser: (user: UserProfile, password?: string) => Promise<void>;
  onDeleteUser: (userId: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Shield className="w-6 h-6 text-indigo-600" />
             Gestão de Equipe
           </h1>
           <p className="text-sm text-gray-500">Administre o acesso e permissões dos colaboradores.</p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative group">
                 <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                 <input 
                    type="text" 
                    placeholder="Buscar colaborador..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 bg-white shadow-sm transition-all"
                 />
             </div>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform active:scale-95"
             >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Usuário</span>
             </button>
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                   <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Colaborador</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Credenciais</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nível de Acesso</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredUsers.length === 0 ? (
                       <tr>
                           <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                               <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                               <p>Nenhum usuário encontrado.</p>
                           </td>
                       </tr>
                   ) : (
                       filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white ${user.nivel === 'Admin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                      {user.name.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="font-bold text-gray-900">{user.name}</span>
                                     <span className="text-xs text-green-600 flex items-center gap-1">
                                         <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Ativo
                                     </span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm font-medium font-mono">{user.username}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                                   user.nivel === 'Admin' 
                                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                   {user.nivel === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                                   {user.nivel}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button 
                                   onClick={() => onDeleteUser(user.id)}
                                   disabled={user.username === 'admin'} 
                                   className={`p-2 rounded-lg transition-colors group-hover:bg-white ${
                                      user.username === 'admin' 
                                         ? 'text-gray-300 cursor-not-allowed' 
                                         : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                   }`}
                                   title={user.username === 'admin' ? "Admin principal não pode ser removido" : "Revogar acesso"}
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </td>
                          </tr>
                       ))
                   )}
                </tbody>
             </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 p-3 text-xs text-gray-500 flex justify-between items-center">
              <span>Mostrando {filteredUsers.length} colaboradores</span>
              <span>HelpDesk AI Security</span>
          </div>
      </div>

      {/* CRM Style Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                
                {/* Modal Header */}
                <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                           <UserPlus className="w-5 h-5 text-indigo-400" />
                           Cadastrar Colaborador
                        </h2>
                        <p className="text-gray-400 text-xs mt-0.5">Preencha os dados para criar um novo acesso.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input 
                                    required
                                    type="text" 
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    placeholder="Ex: João Silva"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email / Login</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <input 
                                        required
                                        type="text" 
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                        placeholder="usuario@empresa"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Senha Temporária</label>
                                <div className="relative">
                                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <input 
                                        required
                                        type="password" 
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        placeholder="Min. 6 caracteres"
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Permissão de Acesso</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`cursor-pointer border rounded-lg p-3 flex flex-col gap-1 transition-all ${newUser.nivel === 'Analista' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-700 text-sm">Analista</span>
                                        <input 
                                            type="radio" 
                                            name="nivel" 
                                            value="Analista" 
                                            checked={newUser.nivel === 'Analista'}
                                            onChange={() => setNewUser({...newUser, nivel: 'Analista'})}
                                            className="accent-indigo-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Acesso padrão a chamados e painel.</p>
                                </label>

                                <label className={`cursor-pointer border rounded-lg p-3 flex flex-col gap-1 transition-all ${newUser.nivel === 'Admin' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-700 text-sm">Admin</span>
                                        <input 
                                            type="radio" 
                                            name="nivel" 
                                            value="Admin"
                                            checked={newUser.nivel === 'Admin'}
                                            onChange={() => setNewUser({...newUser, nivel: 'Admin'})}
                                            className="accent-purple-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Controle total e gestão de usuários.</p>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-2">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Usuário
                        </button>
                    </div>

                </form>
            </div>
        </div>
      )}
    </div>
  );
};