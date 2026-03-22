import { api } from './api';
 
export const fluxoService = {
  obter: (id_empresa) =>
    api.get('/fluxo', { params: { id_empresa } }).then(r => r.data),
};
 