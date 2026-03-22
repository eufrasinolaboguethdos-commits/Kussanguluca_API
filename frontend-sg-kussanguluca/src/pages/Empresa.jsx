import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiHome, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave,
  FiPlus, FiTrash2, FiCheckCircle, FiArrowLeft, FiBriefcase
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import empresaService from '../services/empresaService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const Empresas = () => {
  const { user: _user, activeCompany, setActiveCompany } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [modo, setModo] = useState('lista');
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { carregarEmpresas(); }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const dados = await empresaService.getByUser();
      setEmpresas(dados);
      const savedId = localStorage.getItem('activeCompanyId');
      if (savedId && !activeCompany) {
        const empresa = dados.find(e => String(e.id_empresa) === String(savedId));
        if (empresa) setActiveCompany(empresa);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = () => {
    setModo('criar');
    setEmpresaEditando(null);
    reset({ nome: '', NIF: '', setor: '', email: '', telefone: '', endereco: '', cidade: '', provincia: '' });
  };

  const handleEditar = (empresa) => { setModo('editar'); setEmpresaEditando(empresa); reset(empresa); };

  const handleSelecionar = (empresa) => {
    localStorage.setItem('activeCompanyId', String(empresa.id_empresa));
    setActiveCompany(empresa);
    setMensagem(`Empresa "${empresa.nome}" selecionada!`);
    setTimeout(() => setMensagem(''), 2000);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (modo === 'criar') {
        const novaEmpresa = await empresaService.create(data);
        setEmpresas([...empresas, novaEmpresa]);
        setMensagem('Empresa criada com sucesso!');
        if (empresas.length === 0) {
          setActiveCompany(novaEmpresa);
          localStorage.setItem('activeCompanyId', String(novaEmpresa.id_empresa));
        }
      } else {
        await empresaService.update(empresaEditando.id_empresa, data);
        const atualizadas = empresas.map(e => e.id_empresa === empresaEditando.id_empresa ? { ...e, ...data } : e);
        setEmpresas(atualizadas);
        setMensagem('Empresa atualizada com sucesso!');
        if (activeCompany?.id_empresa === empresaEditando.id_empresa) setActiveCompany({ ...activeCompany, ...data });
      }
      setModo('lista');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) return;
    try {
      await empresaService.delete(id);
      setEmpresas(empresas.filter(e => e.id_empresa !== id));
      if (activeCompany?.id_empresa === id) { setActiveCompany(null); localStorage.removeItem('activeCompanyId'); }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir empresa.');
    }
  };

  const voltar = () => { if (modo === 'lista') { navigate('/dashboard'); } else { setModo('lista'); } };

  // ── LISTA ───────────────────────────────────────────────────
  if (modo === 'lista') {
    return (
      <div className="space-y-5 animate-fade-in-up max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 bg-brand-50 rounded-xl">
                <FiBriefcase className="text-brand-500" size={18} />
              </span>
              Minhas Empresas
            </h1>
            <p className="text-gray-400 text-sm mt-1 ml-10">Gerencie as suas empresas e seleccione qual usar</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={voltar} className="flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-sm px-4 py-2.5">
              <FiArrowLeft size={16} /> Voltar
            </Button>
            <Button onClick={handleCriar} className="flex items-center gap-2 rounded-xl text-sm px-4 py-2.5 shadow-md">
              <FiPlus size={16} /> Nova Empresa
            </Button>
          </div>
        </div>

        {/* Mensagem de sucesso */}
        {mensagem && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-lg flex-shrink-0">
              <FiCheckCircle className="text-emerald-600" size={16} />
            </div>
            <p className="text-emerald-800 font-medium text-sm">{mensagem}</p>
          </div>
        )}

        {/* Lista vazia */}
        {empresas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="p-4 bg-gray-50 rounded-2xl inline-block mb-4">
              <FiBriefcase className="text-gray-300" size={48} />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-gray-400 text-sm mb-6">Crie a sua primeira empresa para começar</p>
            <Button onClick={handleCriar} className="rounded-xl shadow-md px-5 py-2.5">
              <FiPlus size={16} className="mr-2" /> Criar Empresa
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {empresas.map((empresa) => {
              const savedId = localStorage.getItem('activeCompanyId');
              const isAtiva = String(empresa.id_empresa) === String(savedId) ||
                              activeCompany?.id_empresa === empresa.id_empresa;
              const initials = empresa.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

              return (
                <div
                  key={empresa.id_empresa}
                  className={`bg-white rounded-2xl shadow-sm p-6 border-2 transition-all ${
                    isAtiva
                      ? 'border-brand-400 shadow-lg shadow-brand-100/50'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold tracking-tight ${
                      isAtiva
                        ? 'bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {initials}
                    </div>
                    {isAtiva && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-semibold">
                        <FiCheckCircle size={12} /> Ativa
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-0.5">{empresa.nome}</h3>
                  <p className="text-xs text-gray-400 mb-5">{empresa.setor} • NIF: {empresa.NIF}</p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSelecionar(empresa)}
                      disabled={isAtiva}
                      className={`flex-1 rounded-xl text-sm font-semibold py-2.5 transition-all ${
                        isAtiva
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isAtiva ? '✓ Selecionada' : 'Selecionar'}
                    </Button>
                    <Button
                      onClick={() => handleEditar(empresa)}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <FiEdit2 size={16} />
                    </Button>
                    <Button
                      onClick={() => handleExcluir(empresa.id_empresa)}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── FORMULÁRIO ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">

      {/* Header formulário */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={voltar} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <FiArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {modo === 'criar' ? 'Nova Empresa' : 'Editar Empresa'}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {modo === 'criar' ? 'Preencha os dados da nova empresa' : 'Actualize os dados da empresa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Nome da Empresa *"
            icon={<FiHome className="text-gray-400" />}
            error={errors.nome}
            {...register('nome', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
          />
          <Input
            label="NIF *"
            icon={<FiBriefcase className="text-gray-400" />}
            error={errors.NIF}
            {...register('NIF', { required: 'NIF é obrigatório', pattern: { value: /^[0-9]{10}$/, message: 'NIF deve ter 10 dígitos' } })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor de Atividade</label>
            <select {...register('setor')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 text-sm bg-white">
              <option value="Tecnologia">Tecnologia</option>
              <option value="Comércio">Comércio</option>
              <option value="Serviços">Serviços</option>
              <option value="Indústria">Indústria</option>
              <option value="Agricultura">Agricultura</option>
              <option value="Construção">Construção</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <Input
            label="Email Corporativo *"
            type="email"
            icon={<FiMail className="text-gray-400" />}
            error={errors.email}
            {...register('email', { required: 'Email é obrigatório', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' } })}
          />
          <Input
            label="Telefone *"
            icon={<FiPhone className="text-gray-400" />}
            error={errors.telefone}
            {...register('telefone', { required: 'Telefone é obrigatório' })}
          />
          <Input
            label="Cidade *"
            error={errors.cidade}
            {...register('cidade', { required: 'Cidade é obrigatória' })}
          />
        </div>

        <Input
          label="Endereço Completo *"
          icon={<FiMapPin className="text-gray-400" />}
          error={errors.endereco}
          {...register('endereco', { required: 'Endereço é obrigatório' })}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={voltar} className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl py-2.5">
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading} className="flex-1 rounded-xl shadow-md py-2.5">
            <FiSave size={16} className="mr-2" />
            {modo === 'criar' ? 'Criar Empresa' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Empresas;