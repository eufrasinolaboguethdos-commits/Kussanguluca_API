import api from './api';

const empresaService = {
  // Buscar empresas do utilizador logado
  getByUser: async () => {
    try {
      const response = await api.get('/empresas/user');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empresas do utilizador:', error);
      throw error;
    }
  },

  // Buscar empresa por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/empresas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      throw error;
    }
  },

  // Criar nova empresa
  create: async (data) => {
    try {
      const response = await api.post('/empresas', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      throw error;
    }
  },

  // Atualizar empresa
  update: async (id, data) => {
    try {
      const response = await api.put(`/empresas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw error;
    }
  },

  // Excluir empresa
  delete: async (id) => {
    try {
      const response = await api.delete(`/empresas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      throw error;
    }
  },

  // Definir empresa ativa (opcional - notificar backend)
  setActive: async (empresaId) => {
    try {
      const response = await api.post('/empresas/active', { empresaId });
      return response.data;
    } catch (error) {
  console.warn('Endpoint /empresas/active não disponível:', error);
  return { success: true };
}
  }
};

export default empresaService;