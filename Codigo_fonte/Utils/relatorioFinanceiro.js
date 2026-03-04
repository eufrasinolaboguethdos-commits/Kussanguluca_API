import { calcularResumoFinanceiro } from "./calculoFinanceiro.js";

/**
 * Gera relatório financeiro detalhado
 * @param {Array} receitas - array de { valor, categoria, data }
 * @param {Array} despesas - array de { valor, categoria, data }
 * @returns {Object} relatório completo
 */
export function gerarRelatorioFinanceiro(receitas = [], despesas = []) {
  
  const resumo = calcularResumoFinanceiro(receitas, despesas);

  // Agrupamento por categoria
  const categoriasReceitas = {};
  receitas.forEach(r => {
    categoriasReceitas[r.categoria] = (categoriasReceitas[r.categoria] || 0) + Number(r.valor);
  });

  const categoriasDespesas = {};
  despesas.forEach(d => {
    categoriasDespesas[d.categoria] = (categoriasDespesas[d.categoria] || 0) + Number(d.valor);
  });

  return {
    resumo,
    categoriasReceitas,
    categoriasDespesas,
    totalReceitas: resumo.totalReceitas,
    totalDespesas: resumo.totalDespesas,
    fluxoCaixa: resumo.fluxoCaixa,
    situacao: resumo.situacao,
    margemLucro: resumo.margemLucro
  };
}