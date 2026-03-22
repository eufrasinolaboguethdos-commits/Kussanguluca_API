// ============================================================
// Controllers/fluxoController.js
// Fluxo de Caixa Real e Projectado
// ============================================================

import { connection } from "../Config/db.js";
import { listarReceitas } from "../Models/receitaModel.js";
import { listarDespesas } from "../Models/despesaModel.js";
import { calcularProjecaoFluxo } from "../Utils/calculoFinanceiro.js";

const buscarIdEmpresa = async (req) => {
  const id_empresa = req.query.id_empresa || req.body?.id_empresa;
  if (id_empresa) return id_empresa;
  const [rows] = await connection.execute(
    'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
    [req.usuario.id]
  );
  return rows[0]?.id_empresa;
};

// GET /fluxo?id_empresa=X — fluxo real + projecção
export async function obterFluxo(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);

    const receitas = await listarReceitas(id_empresa);
    const despesas = await listarDespesas(id_empresa);

    // Fluxo real — agrupa por mês
    const mapaReal = {};

    receitas.forEach(r => {
      const chave = r.data ? r.data.toString().substring(0, 7) : 'sem-data';
      if (!mapaReal[chave]) mapaReal[chave] = { mes: chave, receitas: 0, despesas: 0, saldo: 0 };
      mapaReal[chave].receitas += Number(r.valor);
    });

    despesas.forEach(d => {
      const chave = d.data ? d.data.toString().substring(0, 7) : 'sem-data';
      if (!mapaReal[chave]) mapaReal[chave] = { mes: chave, receitas: 0, despesas: 0, saldo: 0 };
      mapaReal[chave].despesas += Number(d.valor);
    });

    const fluxoReal = Object.values(mapaReal)
      .map(m => ({ ...m, saldo: m.receitas - m.despesas }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6); // últimos 6 meses

    // Projecção para os próximos 3 meses
    const projecao = calcularProjecaoFluxo(receitas, despesas, 3);

    res.json({
      fluxoReal,
      projecao: projecao.projecao,
      mediaReceita: projecao.mediaReceita,
      mediaDespesa: projecao.mediaDespesa,
      alertaNegativo: projecao.alertaNegativo
    });

  } catch (error) {
    console.error('Erro fluxo:', error);
    res.status(500).json({ error: error.message });
  }
}