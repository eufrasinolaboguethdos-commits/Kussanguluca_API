import { api } from './api';
 
export const contaService = {
  listar: (id_empresa, filtros = {}) =>
    api.get('/contas', { params: { id_empresa, ...filtros } }).then(r => r.data),
 
  resumo: (id_empresa) =>
    api.get('/contas/resumo', { params: { id_empresa } }).then(r => r.data),
 
  criar: (data) =>
    api.post('/contas', data).then(r => r.data),
 
  actualizar: (id, data) =>
    api.put(`/contas/${id}`, data).then(r => r.data),
 
  pagar: (id) =>
    api.patch(`/contas/${id}/pagar`).then(r => r.data),
 
  eliminar: (id) =>
    api.delete(`/contas/${id}`).then(r => r.data),
};