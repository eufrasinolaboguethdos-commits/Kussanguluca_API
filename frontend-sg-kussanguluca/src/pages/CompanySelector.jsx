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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
        {/* Efeitos de fundo no loading */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent animate-pulse-slow pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent animate-pulse-slower pointer-events-none" />
        
        <div className="relative">
          <div className="absolute inset-0 bg-brand-400/20 rounded-full blur-2xl animate-pulse-glow"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-brand-500 relative z-10 shadow-lg shadow-brand-500/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos de fundo animados */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent animate-pulse-slow pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent animate-pulse-slower pointer-events-none" />
      
      {/* Partículas decorativas */}
      <div className="absolute top-20 right-20 w-2 h-2 bg-blue-400/30 rounded-full animate-float blur-sm pointer-events-none" />
      <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-float-delayed blur-sm pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-indigo-400/30 rounded-full animate-float-slow blur-sm pointer-events-none" />

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-brand-500/10 w-full max-w-2xl p-8 relative overflow-hidden border border-white/50 animate-fade-in-up">
        {/* Brilho sutil no topo do card */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"></div>
        
        {/* Orbe decorativo no fundo do card */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-brand-700 to-gray-900 animate-gradient-x">
            Bem-vindo, {user?.nome}!
          </h1>
          <p className="text-gray-600">
            Selecione uma empresa para continuar ou crie uma nova
          </p>
          
          {/* Linha decorativa */}
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent rounded-full"></div>
          </div>
        </div>

        {empresas.length === 0 ? (
          <div className="text-center py-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg shadow-brand-500/20 animate-bounce-slow">
              <div className="absolute inset-0 bg-brand-400/20 rounded-full blur-xl animate-pulse-glow"></div>
              <FiBriefcase className="text-brand-500 relative z-10" size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Crie a sua primeira empresa para começar a gerir as finanças
            </p>
            <Button onClick={handleCreateCompany} className="flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 hover:scale-105">
              <FiPlus size={20} />
              Criar Empresa
            </Button>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Suas Empresas ({empresas.length})
            </h3>

            {empresas.map((empresa, index) => (
              <div
                key={empresa.id_empresa}
                onClick={() => handleSelectCompany(empresa)}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden group animate-slide-in-up ${
                  selectedEmpresa?.id_empresa === empresa.id_empresa
                    ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-blue-50 shadow-lg shadow-brand-500/20'
                    : 'border-gray-200 hover:border-brand-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:shadow-md'
                }`}
              >
                {/* Efeito de shimmer ao hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000"></div>
                
                {/* Brilho na seleção */}
                {selectedEmpresa?.id_empresa === empresa.id_empresa && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/10 to-transparent animate-shimmer-fast"></div>
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-lg flex items-center justify-center text-brand-600 font-bold text-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    {empresa.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">
                      {empresa.nome}
                    </h4>
                    <p className="text-sm text-gray-500">
                      NIF: {empresa.NIF} • {empresa.setor}
                    </p>
                  </div>
                </div>

                {selectedEmpresa?.id_empresa === empresa.id_empresa ? (
                  <FiCheckCircle className="text-brand-500 relative z-10 animate-scale-in" size={24} />
                ) : (
                  <FiChevronRight className="text-gray-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-300 relative z-10" size={20} />
                )}
              </div>
            ))}

            <div className="pt-4 border-t border-gray-200 mt-6">
              <button
                onClick={handleCreateCompany}
                className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-gradient-to-r hover:from-brand-50 hover:to-blue-50/30 transition-all duration-300 flex items-center justify-center gap-2 text-gray-600 hover:text-brand-600 relative overflow-hidden group hover:shadow-md"
              >
                {/* Efeito de shimmer ao hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000"></div>
                
                <FiPlus size={20} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                <span className="font-medium relative z-10">Criar Nova Empresa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        @keyframes shimmer-fast {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
            background-size: 200% auto;
          }
          50% {
            background-position: 100% 50%;
            background-size: 200% auto;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 8s ease-in-out infinite 2s;
        }

        .animate-float-slow {
          animation: float 10s ease-in-out infinite 1s;
        }

        .animate-shimmer-fast {
          animation: shimmer-fast 2s ease-in-out infinite;
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-pulse-slow {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-slower {
          animation: pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default CompanySelector;