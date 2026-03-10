import { api } from './api';

export const receitaService = {
  /**
   * Listar todas as receitas
   * GET /receitas
   */
  getAll: async () => {
    try {
      console.log('📊 Buscando receitas...');
      const response = await api.get('/receitas');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar receitas:', error);
      throw error;
    }
  },

  /**
   * Buscar uma receita específica
   * GET /receitas/:id
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/receitas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar receita ${id}:`, error);
      throw error;
    }
  },

  /**
   * Criar nova receita
   * POST /receitas
   */
  create: async (data) => {
    try {
      console.log('💰 Criando receita:', data);
      
      // Adaptar os campos conforme o teu backend
      const payload = {
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        data: data.data,
        categoria: data.categoria,
        // id_empresa vem do token no backend
      };
      
      const response = await api.post('/receitas', payload);
      console.log('✅ Receita criada:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao criar receita:', error);
      throw error;
    }
  },

  /**
   * Atualizar receita
   * PUT /receitas/:id
   */
  update: async (id, data) => {
    try {
      console.log('✏️ Atualizando receita:', id, data);
      
      const payload = {
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        data: data.data,
        categoria: data.categoria,
      };
      
      const response = await api.put(`/receitas/${id}`, payload);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Erro ao atualizar receita ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletar receita (soft delete)
   * DELETE /receitas/:id
   */
  delete: async (id) => {
    try {
      console.log('🗑️ Deletando receita:', id);
      const response = await api.delete(`/receitas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao deletar receita ${id}:`, error);
      throw error;
    }
  }
};

export default receitaService;