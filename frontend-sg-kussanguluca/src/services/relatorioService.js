import { api } from "./api";

export const relatorioService = {
  /**
   * Gerar relatório financeiro
   * POST /relatorio (ou GET conforme o teu backend)
   */
  gerarRelatorio: async (periodo) => {
    try {
      console.log('📊 Gerando relatório...', periodo);
      
      // Se o teu backend espera POST com body:
      const response = await api.post('/relatorio', periodo);
      
      // Se for GET com query params:
      // const response = await api.get(`/relatorio?inicio=${periodo.inicio}&fim=${periodo.fim}`);
      
      console.log('✅ Relatório gerado:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      throw error;
    }
  },

  /**
   * Exportar relatório para PDF
   * POST /relatorio/pdf
   */
  exportarPDF: async (periodo) => {
    try {
      const response = await api.post('/relatorio/pdf', periodo, {
        responseType: 'blob' // Para receber arquivo
      });
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${periodo.inicio}_${periodo.fim}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      throw error;
    }
  },

  /**
   * Enviar relatório por email
   * POST /relatorio/email
   */
  enviarEmail: async (periodo, email) => {
    try {
      const response = await api.post('/relatorio/email', {
        periodo,
        email
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
};

export default relatorioService;