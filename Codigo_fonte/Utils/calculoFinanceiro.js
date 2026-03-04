export function calcularResumoFinanceiro(receitas = [], despesas = []) {

  const totalReceitas = receitas.reduce((total, r) => total + Number(r.valor), 0);

  const totalDespesas = despesas.reduce((total, d) => total + Number(d.valor), 0);

  const fluxoCaixa = totalReceitas - totalDespesas;

  const margemLucro = totalReceitas > 0
    ? ((fluxoCaixa / totalReceitas) * 100).toFixed(2)
    : 0;

  const situacao =
    fluxoCaixa > 0
      ? "Lucro"
      : fluxoCaixa < 0
      ? "Prejuízo"
      : "Equilibrado";

  return {
    totalReceitas,
    totalDespesas,
    fluxoCaixa,
    margemLucro: Number(margemLucro),
    situacao
  };
}