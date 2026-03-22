// ============================================================
// Controllers/saudeController.js
// Saúde financeira — semáforo verde/amarelo/vermelho
// ============================================================

import { connection } from "../Config/db.js";
import { listarReceitas } from "../Models/receitaModel.js";
import { listarDespesas } from "../Models/despesaModel.js";
import { calcularSaudeFinanceira } from "../Utils/calculoFinanceiro.js";

const buscarIdEmpresa = async (req) => {
  const id_empresa = req.query.id_empresa;
  if (id_empresa) return id_empresa;
  const [rows] = await connection.execute(
    'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
    [req.usuario.id]
  );
  return rows[0]?.id_empresa;
};

// GET /saude?id_empresa=X
export async function obterSaude(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);
    if (!id_empresa) return res.status(400).json({ error: 'Empresa não encontrada' });

    const receitas = await listarReceitas(id_empresa);
    const despesas = await listarDespesas(id_empresa);

    const totalReceitas = receitas.reduce((s, r) => s + Number(r.valor), 0);
    const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);

    const saude = calcularSaudeFinanceira(totalReceitas, totalDespesas);

    // Guardar na BD
    await connection.execute(
      `INSERT INTO saude_financeira 
        (id_empresa, data_calculo, total_receitas, total_despesas, saldo,
         margem_lucro, racao_despesa, nivel, pontuacao, analise_texto)
       VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_receitas = VALUES(total_receitas),
         total_despesas = VALUES(total_despesas),
         saldo          = VALUES(saldo),
         margem_lucro   = VALUES(margem_lucro),
         racao_despesa  = VALUES(racao_despesa),
         nivel          = VALUES(nivel),
         pontuacao      = VALUES(pontuacao),
         analise_texto  = VALUES(analise_texto)`,
      [
        id_empresa,
        totalReceitas,
        totalDespesas,
        saude.saldo,
        saude.margemLucro,
        saude.racaoDespesa,
        saude.nivel,
        saude.pontuacao,
        saude.analise_texto
      ]
    );

    res.json({
      id_empresa,
      totalReceitas,
      totalDespesas,
      ...saude
    });

  } catch (error) {
    console.error('Erro saude:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /saude/historico?id_empresa=X
export async function historicoSaude(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);

    const [rows] = await connection.execute(
      `SELECT * FROM saude_financeira
       WHERE id_empresa = ?
       ORDER BY data_calculo DESC
       LIMIT 12`,
      [id_empresa]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}