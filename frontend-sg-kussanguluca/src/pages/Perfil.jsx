import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiSave, FiArrowLeft,
  FiShield, FiCheckCircle, FiEdit2
} from 'react-icons/fi';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const Perfil = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [abaActiva, setAbaActiva] = useState('info');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const { register: regInfo, handleSubmit: subInfo, formState: { errors: errInfo, isSubmitting: subInfoLoading } } = useForm({
    defaultValues: { nome: user?.nome || '', email: user?.email || '' }
  });

  const { register: regSenha, handleSubmit: subSenha, reset: resetSenha, watch, formState: { errors: errSenha, isSubmitting: subSenhaLoading } } = useForm();

  const novaSenha = watch('novaSenha');

  const onSubmitInfo = async (data) => {
    try {
      setErro('');
      await api.put('/usuarios/perfil', data);
      setMensagem('Dados actualizados com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao actualizar dados.');
    }
  };

  const onSubmitSenha = async (data) => {
    try {
      setErro('');
      await api.put('/usuarios/senha', { senhaActual: data.senhaActual, novaSenha: data.novaSenha });
      setMensagem('Senha alterada com sucesso!');
      resetSenha();
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao alterar senha.');
    }
  };

  const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : '?';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Voltar"
        >
          <FiArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Perfil</h1>
          <p className="text-gray-400 text-xs mt-0.5">Gerencie as suas informações pessoais</p>
        </div>
      </div>

      {/* Card de perfil */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-brand-500 opacity-10 blur-3xl" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg flex-shrink-0">
            {inicial}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.nome || 'Utilizador'}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-brand-500/20 border border-brand-400/30 rounded-full text-xs font-semibold text-brand-300">
              <FiShield size={11} /> {user?.perfil || 'empreendedor'}
            </span>
          </div>
        </div>
      </div>

      {/* Mensagem de sucesso/erro */}
      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={18} />
          <p className="text-emerald-800 font-medium text-sm">{mensagem}</p>
        </div>
      )}
      {erro && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <p className="text-rose-700 font-medium text-sm">{erro}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'info',  label: 'Informações', icon: FiUser },
            { id: 'senha', label: 'Senha',        icon: FiLock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAbaActiva(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${
                abaActiva === tab.id
                  ? 'border-brand-500 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              aria-selected={abaActiva === tab.id}
              role="tab"
            >
              <tab.icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6" role="tabpanel">

          {/* Aba Informações */}
          {abaActiva === 'info' && (
            <form onSubmit={subInfo(onSubmitInfo)} className="space-y-4" noValidate>
              <Input
                label="Nome Completo *"
                icon={<FiUser className="text-gray-400" />}
                error={errInfo.nome}
                {...regInfo('nome', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
              />
              <Input
                label="Email *"
                type="email"
                icon={<FiMail className="text-gray-400" />}
                error={errInfo.email}
                {...regInfo('email', { required: 'Email é obrigatório', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' } })}
              />
              <div className="pt-2">
                <Button type="submit" isLoading={subInfoLoading} className="w-full rounded-xl shadow-md py-2.5">
                  <FiSave size={15} className="mr-2" /> Guardar Alterações
                </Button>
              </div>
            </form>
          )}

          {/* Aba Senha */}
          {abaActiva === 'senha' && (
            <form onSubmit={subSenha(onSubmitSenha)} className="space-y-4" noValidate>
              <Input
                label="Senha Actual *"
                type="password"
                icon={<FiLock className="text-gray-400" />}
                error={errSenha.senhaActual}
                {...regSenha('senhaActual', { required: 'Senha actual obrigatória' })}
              />
              <Input
                label="Nova Senha *"
                type="password"
                icon={<FiLock className="text-gray-400" />}
                error={errSenha.novaSenha}
                {...regSenha('novaSenha', {
                  required: 'Nova senha obrigatória',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                })}
              />
              <Input
                label="Confirmar Nova Senha *"
                type="password"
                icon={<FiLock className="text-gray-400" />}
                error={errSenha.confirmarSenha}
                {...regSenha('confirmarSenha', {
                  required: 'Confirmação obrigatória',
                  validate: v => v === novaSenha || 'As senhas não coincidem'
                })}
              />
              <div className="pt-2">
                <Button type="submit" isLoading={subSenhaLoading} className="w-full rounded-xl shadow-md py-2.5 bg-brand-500 hover:bg-brand-600 text-white">
                  <FiEdit2 size={15} className="mr-2" /> Alterar Senha
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;