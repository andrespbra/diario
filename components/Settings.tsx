import React, { useState } from 'react';
import { UserProfile, UserLevel } from '../types';
import { UserPlus, Shield, User, Trash2, Save, Lock, Loader2, Search, X, Mail, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsProps {
  users: UserProfile[];
  onAddUser: (user: UserProfile, password?: string) => Promise<void>;
  onDeleteUser: (userId: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '', 
    nivel: 'Analista' as UserLevel
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to preview email (Must match App.tsx logic)
  const getPreviewEmail = (username: string) => {
      const rawInput = username.trim().toLowerCase();
      if (!rawInput) return '...';

      if (rawInput.includes('@')) {
          return rawInput;
      }

      // Allow a-z, 0-9 and dots. Remove consecutive dots.
      const clean = rawInput
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]/g, "")
          .replace(/\.+/g, ".");
      
      return `${clean}@example.com`;
  };

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
      id: generateId(),
      name: newUser.name,
      username: newUser.username,
      nivel: newUser.nivel,
      mustChangePassword: true // Default for new users created via settings
    };

    await onAddUser(userProfile, newUser.password);
    
    setIsSubmitting(false);
    setNewUser({ name: '', username: '', password: '', nivel: 'Analista' });
    setIsDrawerOpen(false);
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
             Gestão de Acessos
           </h1>
           <p className="text-sm text-gray-500">Controle de usuários, senhas e permissões.</p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative group">
                 <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                 <input 
                    type="text" 
                    placeholder="Buscar usuário..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 bg-white shadow-sm transition-all"
                 />
             </div>
             <button 
                onClick={() => setIsDrawerOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-gray-200 flex items-center gap-2 transition-all transform active:scale-95"
             >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Cadastro</span>
             </button>
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col relative z-0">
          <div className="overflow-auto flex-1">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                   <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Login</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status Senha</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Perfil</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredUsers.length === 0 ? (
                       <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                               <div className="flex flex-col items-center">
                                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                        <User className="w-8 h-8 text-gray-300" />
                                   </div>
                                   <p className="font-medium">Nenhum usuário encontrado</p>
                               </div>
                           </td>
                       </tr>
                   ) : (
                       filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm ${user.nivel === 'Admin' ? 'bg-indigo-600' : 'bg-slate-500'}`}>
                                      {user.name.charAt(0)}
                                   </div>
                                   <div>
                                     <span className="block font-semibold text-gray-900 text-sm">{user.name}</span>
                                     <span className="text-[10px] text-gray-400 uppercase tracking-wide">ID: {user.id.substring(0, 4)}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-sm font-medium">{user.username}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                {user.mustChangePassword ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                        <AlertCircle className="w-3 h-3" /> Troca Pendente
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                        <CheckCircle2 className="w-3 h-3" /> OK
                                    </span>
                                )}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                                   user.nivel === 'Admin' 
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                   {user.nivel === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
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
                                         : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                   }`}
                                   title={user.username === 'admin' ? "Sistema" : "Remover usuário"}
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
          <div className="bg-white border-t border-gray-200 p-3 text-xs text-gray-400 flex justify-end">
              Security Log Active • {filteredUsers.length} Users
          </div>
      </div>

      {/* CRM Style Side Drawer (Overlay) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Novo Usuário
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Preencha os dados de acesso.</p>
                    </div>
                    <button 
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drawer Body (Form) */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="userForm" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Avatar Preview Placeholder */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center border-2 border-indigo-100 text-indigo-300">
                                {newUser.name ? (
                                    <span className="text-2xl font-bold text-indigo-600">{newUser.name.charAt(0)}</span>
                                ) : (
                                    <User className="w-8 h-8" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Nome Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input 
                                        required
                                        type="text" 
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Ex: Ana Souza"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Login / Usuário</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input 
                                        required
                                        type="text" 
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Ex: ana.souza (sem espaços)"
                                    />
                                </div>
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex items-start gap-2 mt-2">
                                    <Mail className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-indigo-700">
                                        Login interno: <span className="font-bold">{getPreviewEmail(newUser.username)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Senha Inicial</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input 
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-orange-500 pl-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> O usuário precisará alterar esta senha no próximo login.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 block">Nível de Permissão</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`relative cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${newUser.nivel === 'Analista' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <User className={`w-5 h-5 ${newUser.nivel === 'Analista' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <input 
                                            type="radio" 
                                            name="nivel" 
                                            value="Analista" 
                                            checked={newUser.nivel === 'Analista'}
                                            onChange={() => setNewUser({...newUser, nivel: 'Analista'})}
                                            className="sr-only"
                                        />
                                        {newUser.nivel === 'Analista' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 text-sm block">Analista</span>
                                        <span className="text-[10px] text-gray-500 leading-tight">Acesso padrão a chamados e painel operacional.</span>
                                    </div>
                                </label>

                                <label className={`relative cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${newUser.nivel === 'Admin' ? 'border-gray-800 bg-gray-50 ring-1 ring-gray-800' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <Shield className={`w-5 h-5 ${newUser.nivel === 'Admin' ? 'text-gray-900' : 'text-gray-400'}`} />
                                        <input 
                                            type="radio" 
                                            name="nivel" 
                                            value="Admin"
                                            checked={newUser.nivel === 'Admin'}
                                            onChange={() => setNewUser({...newUser, nivel: 'Admin'})}
                                            className="sr-only"
                                        />
                                        {newUser.nivel === 'Admin' && <CheckCircle2 className="w-4 h-4 text-gray-900" />}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 text-sm block">Admin</span>
                                        <span className="text-[10px] text-gray-500 leading-tight">Controle total, relatórios e gestão de usuários.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-lg text-sm font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        form="userForm"
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Cadastro
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};