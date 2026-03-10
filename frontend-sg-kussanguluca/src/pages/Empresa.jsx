import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  FiHome, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX,
  FiPlus, FiTrash2, FiCheckCircle, FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import  empresaService from '../services/empresaService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const Empresas = () => {
  // AGORA FUNCIONA - useAuth importado acima
  const { user: _user, activeCompany, setActiveCompany } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [modo, setModo] = useState('lista');
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate(); // <-- ADICIONAR
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();


  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const dados = await empresaService.getByUser();
      setEmpresas(dados);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = () => {
    setModo('criar');
    setEmpresaEditando(null);
    reset({
      nome: '',
      NIF: '',
      setor: 'Tecnologia',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      provincia: ''
    });
  };

  const handleEditar = (empresa) => {
    setModo('editar');
    setEmpresaEditando(empresa);
    reset(empresa);
  };

  const handleSelecionar = (empresa) => {
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
        
        // Se for a primeira empresa, seleciona automaticamente
        if (empresas.length === 0) {
          setActiveCompany(novaEmpresa);
        }
      } else {
        await empresaService.update(empresaEditando.id_empresa, data);
        const atualizadas = empresas.map(e => 
          e.id_empresa === empresaEditando.id_empresa ? { ...e, ...data } : e
        );
        setEmpresas(atualizadas);
        setMensagem('Empresa atualizada com sucesso!');
        
        // Se a empresa ativa foi editada, atualiza no contexto
        if (activeCompany?.id_empresa === empresaEditando.id_empresa) {
          setActiveCompany({ ...activeCompany, ...data });
        }
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
      
      // Se excluiu a empresa ativa, limpa seleção
      if (activeCompany?.id_empresa === id) {
        setActiveCompany(null);
        localStorage.removeItem('activeCompany');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir empresa.');
    }
  };

  const voltar = () => {
    if (modo === 'lista') {
      navigate('/dashboard');
    } else {
      setModo('lista');
    }
  };

  // Renderizar lista
  if (modo === 'lista') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FiHome className="text-brand-500" />
              Minhas Empresas
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas empresas e selecione qual usar
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={voltar} className="flex items-center gap-2 bg-gray-100 text-gray-700">
              <FiArrowLeft size={18} />
              Voltar
            </Button>
            <Button onClick={handleCriar} className="flex items-center gap-2">
              <FiPlus size={18} />
              Nova Empresa
            </Button>
          </div>
        </div>

        {mensagem && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <FiCheckCircle className="text-green-500" size={24} />
            <p className="text-green-800 font-medium">{mensagem}</p>
          </div>
        )}

        {empresas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FiHome className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma empresa cadastrada
            </h3>
            <p className="text-gray-500 mb-6">
              Crie sua primeira empresa para começar
            </p>
            <Button onClick={handleCriar}>
              <FiPlus className="mr-2" />
              Criar Empresa
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {empresas.map((empresa) => (
              <div 
                key={empresa.id_empresa} 
                className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                  activeCompany?.id_empresa === empresa.id_empresa 
                    ? 'border-brand-500 ring-2 ring-brand-100' 
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 text-2xl font-bold">
                    {empresa.nome.charAt(0).toUpperCase()}
                  </div>
                  {activeCompany?.id_empresa === empresa.id_empresa && (
                    <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <FiCheckCircle size={14} />
                      Ativa
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-1">{empresa.nome}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {empresa.setor} • NIF: {empresa.NIF}
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSelecionar(empresa)}
                    className={`flex-1 ${
                      activeCompany?.id_empresa === empresa.id_empresa
                        ? 'bg-green-500 hover:bg-green-600'
                        : ''
                    }`}
                    disabled={activeCompany?.id_empresa === empresa.id_empresa}
                  >
                    {activeCompany?.id_empresa === empresa.id_empresa ? 'Selecionada' : 'Selecionar'}
                  </Button>
                  <Button 
                    onClick={() => handleEditar(empresa)}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <FiEdit2 size={18} />
                  </Button>
                  <Button 
                    onClick={() => handleExcluir(empresa.id_empresa)}
                    className="bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <FiTrash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Renderizar formulário (criar/editar)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={voltar} className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {modo === 'criar' ? 'Nova Empresa' : 'Editar Empresa'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome da Empresa *"
            icon={<FiHome className="text-gray-400" />}
            error={errors.nome}
            {...register('nome', { 
              required: 'Nome é obrigatório',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' }
            })}
          />
          
          <Input
            label="NIF *"
            icon={<FiHome className="text-gray-400" />}
            error={errors.NIF}
            {...register('NIF', { 
              required: 'NIF é obrigatório',
              pattern: { value: /^[0-9]{10}$/, message: 'NIF deve ter 10 dígitos' }
            })}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor de Atividade
            </label>
            <select
              {...register('setor')}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
            >
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
            {...register('email', { 
              required: 'Email é obrigatório',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
            })}
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

        <div className="flex gap-3 pt-4">
          <Button 
            type="button"
            onClick={voltar} 
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            <FiSave className="mr-2" />
            {modo === 'criar' ? 'Criar Empresa' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Empresas;