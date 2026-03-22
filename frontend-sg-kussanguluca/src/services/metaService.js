import { api } from './api';
 
export const metaService = {
  listar: (id_empresa, filtros = {}) =>
    api.get('/metas', { params: { id_empresa, ...filtros } }).then(r => r.data),
 
  actual: (id_empresa) =>
    api.get('/metas/actual', { params: { id_empresa } }).then(r => r.data),
 
  criar: (data) =>
    api.post('/metas', data).then(r => r.data),
 
  actualizar: (id, data) =>
    api.put(`/metas/${id}`, data).then(r => r.data),
 
  eliminar: (id) =>
    api.delete(`/metas/${id}`).then(r => r.data),
};
export default metaService; 