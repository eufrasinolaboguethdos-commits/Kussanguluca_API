import { api } from './api';

export const despesaService = {
  getAll: async () => {
    const response = await api.get('/despesas');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/despesas/${id}`);
    return response.data;
  },

  create: async (data) => {
    const payload = {
      descricao: data.descricao,
      valor: parseFloat(data.valor),
      data: data.data,
      categoria: data.categoria,
    };
    const response = await api.post('/despesas', payload);
    return response.data;
  },

  update: async (id, data) => {
    const payload = {
      descricao: data.descricao,
      valor: parseFloat(data.valor),
      data: data.data,
      categoria: data.categoria,
    };
    const response = await api.put(`/despesas/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/despesas/${id}`);
    return response.data;
  }
};

export default despesaService;