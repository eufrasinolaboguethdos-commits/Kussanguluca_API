// ============================================================
// Controllers/metaController.js
// Metas Mensais de Receita e Despesa
// ============================================================

import { connection } from "../Config/db.js";
import { calcularProgressoMeta } from "../Utils/calculoFinanceiro.js";

const buscarIdEmpresa = async (req) => {
  const id_empresa = req.query.id_empresa || req.body?.id_empresa;
  if (id_empresa) return id_empresa;
  const [rows] = await connection.execute(
    'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
    [req.usuario.id]
  );
  return rows[0]?.id_empresa;
};

// GET /metas?id_empresa=X&mes=3&ano=2026
export async function listarMetas(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);
    const { mes, ano } = req.query;

    let sql = `SELECT * FROM meta WHERE id_empresa = ?`;
    const params = [id_empresa];

    if (mes) { sql += ' AND mes = ?'; params.push(mes); }
    if (ano) { sql += ' AND ano = ?'; params.push(ano); }

    sql += ' ORDER BY ano DESC, mes DESC';

    const [metas] = await connection.execute(sql, params);

    // Calcular progresso actualizado para cada meta
    const metasComProgresso = await Promise.all(metas.map(async (meta) => {
      const dataIni = `${meta.ano}-${String(meta.mes).padStart(2,'0')}-01`;
      const dataFim = `${meta.ano}-${String(meta.mes).padStart(2,'0')}-31`;

      const [[receitaRow]] = await connection.execute(
        `SELECT COALESCE(SUM(valor), 0) AS total FROM receita
         WHERE id_empresa = ? AND apagado = 0 AND data BETWEEN ? AND ?`,
        [id_empresa, dataIni, dataFim]
      );

      const [[despesaRow]] = await connection.execute(
        `SELECT COALESCE(SUM(valor), 0) AS total FROM despesa
         WHERE id_empresa = ? AND apagado = 0 AND data BETWEEN ? AND ?`,
        [id_empresa, dataIni, dataFim]
      );

      const receitaRealizada = Number(receitaRow.total);
      const despesaRealizada = Number(despesaRow.total);
      const progresso = calcularProgressoMeta(meta, receitaRealizada, despesaRealizada);

      return {
        ...meta,
        receita_realizada: receitaRealizada,
        despesa_realizada: despesaRealizada,
        ...progresso
      };
    }));

    res.json(metasComProgresso);
  } catch (error) {
    console.error('Erro listar metas:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /metas/actual?id_empresa=X — meta do mês actual
export async function metaActual(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);
    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();

    const [[meta]] = await connection.execute(
      `SELECT * FROM meta WHERE id_empresa = ? AND mes = ? AND ano = ?`,
      [id_empresa, mes, ano]
    );

    if (!meta) {
      return res.json({ existe: false, mes, ano, mensagem: 'Nenhuma meta definida para este mês' });
    }

    const dataIni = `${ano}-${String(mes).padStart(2,'0')}-01`;
    const dataFim = `${ano}-${String(mes).padStart(2,'0')}-31`;

    const [[receitaRow]] = await connection.execute(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM receita
       WHERE id_empresa = ? AND apagado = 0 AND data BETWEEN ? AND ?`,
      [id_empresa, dataIni, dataFim]
    );

    const [[despesaRow]] = await connection.execute(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM despesa
       WHERE id_empresa = ? AND apagado = 0 AND data BETWEEN ? AND ?`,
      [id_empresa, dataIni, dataFim]
    );

    const receitaRealizada = Number(receitaRow.total);
    const despesaRealizada = Number(despesaRow.total);
    const progresso = calcularProgressoMeta(meta, receitaRealizada, despesaRealizada);

    res.json({
      existe: true,
      ...meta,
      receita_realizada: receitaRealizada,
      despesa_realizada: despesaRealizada,
      ...progresso
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /metas
export async function criarMeta(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);
    const { mes, ano, meta_receita, meta_despesa_max } = req.body;

    if (!mes || !ano) {
      return res.status(400).json({ error: 'Campos obrigatórios: mes, ano' });
    }

    await connection.execute(
      `INSERT INTO meta (id_empresa, mes, ano, meta_receita, meta_despesa_max)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         meta_receita     = VALUES(meta_receita),
         meta_despesa_max = VALUES(meta_despesa_max)`,
      [id_empresa, mes, ano, meta_receita || 0, meta_despesa_max || 0]
    );

    res.status(201).json({ mensagem: 'Meta criada/actualizada com sucesso' });
  } catch (error) {
    console.error('Erro criar meta:', error);
    res.status(500).json({ error: error.message });
  }
}

// PUT /metas/:id
export async function actualizarMeta(req, res) {
  try {
    const { id } = req.params;
    const { meta_receita, meta_despesa_max } = req.body;

    await connection.execute(
      `UPDATE meta SET
         meta_receita     = COALESCE(?, meta_receita),
         meta_despesa_max = COALESCE(?, meta_despesa_max)
       WHERE id_meta = ?`,
      [meta_receita, meta_despesa_max, id]
    );

    res.json({ mensagem: 'Meta actualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /metas/:id
export async function eliminarMeta(req, res) {
  try {
    const { id } = req.params;
    await connection.execute(`DELETE FROM meta WHERE id_meta = ?`, [id]);
    res.json({ mensagem: 'Meta eliminada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}