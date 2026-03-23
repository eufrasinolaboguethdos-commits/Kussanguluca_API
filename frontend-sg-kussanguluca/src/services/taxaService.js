import { api } from './api';

export const taxaService = {
  obterActual: () =>
    api.get('/taxa-cambio').then(r => r.data),

  historico: (limite = 30) =>
    api.get('/taxa-cambio/historico', { params: { limite } }).then(r => r.data),

  registar: (dados) =>
    api.post('/taxa-cambio', dados).then(r => r.data),

  eliminar: (id) =>
    api.delete(`/taxa-cambio/${id}`).then(r => r.data),

  converter: (valor, moeda, data = null) =>
    api.get('/taxa-cambio/converter', { params: { valor, moeda, data } }).then(r => r.data),
};