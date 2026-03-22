import { api } from './api';
 
export const saudeService = {
  obter: (id_empresa) =>
    api.get('/saude', { params: { id_empresa } }).then(r => r.data),
 
  historico: (id_empresa) =>
    api.get('/saude/historico', { params: { id_empresa } }).then(r => r.data),
};