import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/authService'; // <-- IMPORTAR ASSIM
import AuthContext from './AuthContext';

export const AuthProvider = ({ children }) => {
  // Usar nomes diferentes para evitar qualquer conflito
  const [userState, setUserState] = useState(null);
  const [activeCompanyState, setActiveCompanyState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedCompany = localStorage.getItem('activeCompany');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUserState(parsedUser);
          
          if (savedCompany) {
            const parsedCompany = JSON.parse(savedCompany);
            setActiveCompanyState(parsedCompany);
            axios.defaults.headers.common['X-Company-ID'] = parsedCompany.id_empresa;
          }
        } catch (error) {
          console.error('Erro ao restaurar sessão:', error);
          // Limpar dados inválidos
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('activeCompany');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Função de login
  const signIn = async (email, senha) => {
    try {
      const response = await authService.login({ email, senha });
      
      // Guardar dados
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Atualizar headers do axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      
      // Atualizar estado
      setUserState(response.user);
      
      // Se vier empresas, guardar
      if (response.empresas) {
        localStorage.setItem('userCompanies', JSON.stringify(response.empresas));
      }
      
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  // Função para definir empresa ativa
  const setActiveCompany = (company) => {
    if (company) {
      setActiveCompanyState(company);
      localStorage.setItem('activeCompany', JSON.stringify(company));
      axios.defaults.headers.common['X-Company-ID'] = company.id_empresa;
    } else {
      setActiveCompanyState(null);
      localStorage.removeItem('activeCompany');
      delete axios.defaults.headers.common['X-Company-ID'];
    }
  };

  // Função de logout
  const logout = () => {
    // Limpar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeCompany');
    localStorage.removeItem('userCompanies');
    localStorage.removeItem('activeCompanyId');
    
    // Limpar estados
    setUserState(null);
    setActiveCompanyState(null);
    
    // Limpar headers do axios
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['X-Company-ID'];
  };

  // Valor do contexto - expor userState como "user"
  const value = {
    user: userState,              // <-- expõe como "user"
    setUser: setUserState,        // <-- expõe a função também se precisares
    activeCompany: activeCompanyState,
    setActiveCompany,
    signIn,
    logout,
    loading,
    isAuthenticated: !!userState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;