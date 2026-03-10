import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { empresaService } from '../services/empresaService';
import { useAuth } from '../hooks/useAuth';
import { useCompanyId } from '../hooks/useCompanyId';
import Button from '../components/ui/Button';
import { FiBriefcase, FiPlus, FiChevronRight, FiCheckCircle } from 'react-icons/fi';

const CompanySelector = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const { user } = useAuth();
  // ✅ usa selectCompany do hook centralizado
  const { selectCompany } = useCompanyId();
  const navigate = useNavigate();

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const dados = await empresaService.getByUser();
      setEmpresas(dados || []);

      // Se só tiver uma empresa, seleciona automaticamente
      if (dados?.length === 1) {
        handleSelectCompany(dados[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (empresa) => {
    setSelectedEmpresa(empresa);
    // ✅ grava no localStorage E atualiza o hook de uma vez
    selectCompany(empresa);

    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const handleCreateCompany = () => {
    navigate('/empresa');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.nome}!
          </h1>
          <p className="text-gray-600">
            Selecione uma empresa para continuar ou crie uma nova
          </p>
        </div>

        {empresas.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="text-brand-500" size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Crie a sua primeira empresa para começar a gerir as finanças
            </p>
            <Button onClick={handleCreateCompany} className="flex items-center gap-2 mx-auto">
              <FiPlus size={20} />
              Criar Empresa
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Suas Empresas ({empresas.length})
            </h3>

            {empresas.map((empresa) => (
              <div
                key={empresa.id_empresa}
                onClick={() => handleSelectCompany(empresa)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  selectedEmpresa?.id_empresa === empresa.id_empresa
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold text-xl">
                    {empresa.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{empresa.nome}</h4>
                    <p className="text-sm text-gray-500">
                      NIF: {empresa.NIF} • {empresa.setor}
                    </p>
                  </div>
                </div>

                {selectedEmpresa?.id_empresa === empresa.id_empresa ? (
                  <FiCheckCircle className="text-brand-500" size={24} />
                ) : (
                  <FiChevronRight className="text-gray-400" size={20} />
                )}
              </div>
            ))}

            <div className="pt-4 border-t border-gray-200 mt-6">
              <button
                onClick={handleCreateCompany}
                className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-brand-600"
              >
                <FiPlus size={20} />
                <span className="font-medium">Criar Nova Empresa</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySelector;