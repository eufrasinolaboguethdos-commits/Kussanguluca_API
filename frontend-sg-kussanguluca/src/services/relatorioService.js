import { api } from "./api";

export const relatorioService = {
  // ✅ envia id_empresa junto com o período
  gerarRelatorio: async (periodo, id_empresa) => {
    const response = await api.post('/relatorio', { ...periodo, id_empresa });
    return response.data;
  },

  exportarPDF: async (periodo, id_empresa) => {
    const response = await api.post('/relatorio/pdf', { ...periodo, id_empresa }, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${periodo.inicio}_${periodo.fim}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  enviarEmail: async (periodo, email, id_empresa) => {
    const response = await api.post('/relatorio/email', { periodo, email, id_empresa });
    return response.data;
  }
};

export default relatorioService;