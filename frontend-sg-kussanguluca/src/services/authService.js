import { api } from './api';

export const authService = {
  /**
   * Fazer login
   * POST /usuarios/login
   */
  login: async (credentials) => {
    try {
      console.log('🔐 Tentando login...', credentials.email);
      
      const response = await api.post('/usuarios/login', {
        email: credentials.email,
        senha: credentials.password // ou 'password' conforme o teu backend
      });
      
      console.log('✅ Login bem-sucedido:', response.data);
      return response.data; // { token, user }
      
    } catch (error) {
      console.error('❌ Erro no login:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Registar novo utilizador
   * POST /usuarios
   */
  register: async (userData) => {
    try {
      console.log('📝 Tentando registo...', userData.email);
      
      const response = await api.post('/usuarios', {
        nome: userData.nome,
        email: userData.email,
        senha: userData.password,
        // Adiciona outros campos conforme o teu backend
      });
      
      console.log('✅ Registo bem-sucedido:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro no registo:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Buscar dados do utilizador logado
   * GET /usuarios/perfil
   */
  getMe: async () => {
    try {
      const response = await api.get('/usuarios/perfil');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      throw error;
    }
  }
};

export default authService;