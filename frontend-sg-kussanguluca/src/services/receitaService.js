import { api } from './api';

export const receitaService = {
  getAll: async (id_empresa) => {
    const response = await api.get(`/receitas?id_empresa=${id_empresa}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/receitas/${id}`);
    return response.data;
  },

  // ✅ agora envia id_empresa no payload
  create: async (data) => {
    const payload = {
      descricao: data.descricao,
      valor: parseFloat(data.valor),
      data: data.data,
      categoria: data.categoria,
      id_empresa: data.id_empresa,
    };
    const response = await api.post('/receitas', payload);
    return response.data;
  },

  update: async (id, data) => {
    const payload = {
      descricao: data.descricao,
      valor: parseFloat(data.valor),
      data: data.data,
      categoria: data.categoria,
    };
    const response = await api.put(`/receitas/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/receitas/${id}`);
    return response.data;
  }
};

export default receitaService;