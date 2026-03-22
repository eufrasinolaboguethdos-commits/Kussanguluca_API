// ============================================================
// Controllers/contaController.js
// Contas a Pagar e a Receber
// ============================================================

import { connection } from "../Config/db.js";

const buscarIdEmpresa = async (req) => {
  const id_empresa = req.query.id_empresa || req.body?.id_empresa;
  if (id_empresa) return id_empresa;
  const [rows] = await connection.execute(
    'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
    [req.usuario.id]
  );
  return rows[0]?.id_empresa;
};

// GET /contas?id_empresa=X&tipo=pagar|receber&estado=pendente
export async function listarContas(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);
    const { tipo, estado } = req.query;

    let sql = `SELECT * FROM conta WHERE id_empresa = ? AND apagado = 0`;
    const params = [id_empresa];

    if (tipo)   { sql += ' AND tipo = ?';   params.push(tipo); }
    if (estado) { sql += ' AND estado = ?'; params.push(estado); }

    sql += ' ORDER BY data_vencimento ASC';

    const [rows] = await connection.execute(sql, params);

    // Marca automaticamente como vencido se passou da data
    const hoje = new Date().toISOString().split('T')[0];
    const vencidas = rows.filter(c => c.estado === 'pendente' && c.data_vencimento < hoje);

    if (vencidas.length > 0) {
      const ids = vencidas.map(c => c.id_conta);
      await connection.execute(
        `UPDATE conta SET estado = 'vencido' WHERE id_conta IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      vencidas.forEach(c => { c.estado = 'vencido'; });
    }

    // Alerta: vence nos próximos 3 dias
    const em3Dias = new Date();
    em3Dias.setDate(em3Dias.getDate() + 3);
    const dataAlerta = em3Dias.toISOString().split('T')[0];

    const comAlerta = rows.map(c => ({
      ...c,
      alerta_vencimento: c.estado === 'pendente' && c.data_vencimento <= dataAlerta && c.data_vencimento >= hoje
    }));

    res.json(comAlerta);
  } catch (error) {
    console.error('Erro listar contas:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /contas
export async function criarConta(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);
    const { tipo, descricao, valor, data_vencimento, entidade, categoria, observacao } = req.body;

    if (!tipo || !descricao || !valor || !data_vencimento) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, descricao, valor, data_vencimento' });
    }

    const [result] = await connection.execute(
      `INSERT INTO conta 
        (id_empresa, tipo, descricao, valor, data_vencimento, entidade, categoria, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_empresa, tipo, descricao, valor, data_vencimento, entidade || null, categoria || null, observacao || null]
    );

    res.status(201).json({ id_conta: result.insertId, mensagem: 'Conta criada com sucesso' });
  } catch (error) {
    console.error('Erro criar conta:', error);
    res.status(500).json({ error: error.message });
  }
}

// PUT /contas/:id
export async function actualizarConta(req, res) {
  try {
    const { id } = req.params;
    const { descricao, valor, data_vencimento, estado, data_pagamento, entidade, categoria, observacao } = req.body;

    await connection.execute(
      `UPDATE conta SET
        descricao       = COALESCE(?, descricao),
        valor           = COALESCE(?, valor),
        data_vencimento = COALESCE(?, data_vencimento),
        estado          = COALESCE(?, estado),
        data_pagamento  = COALESCE(?, data_pagamento),
        entidade        = COALESCE(?, entidade),
        categoria       = COALESCE(?, categoria),
        observacao      = COALESCE(?, observacao)
       WHERE id_conta = ? AND apagado = 0`,
      [descricao, valor, data_vencimento, estado, data_pagamento, entidade, categoria, observacao, id]
    );

    res.json({ mensagem: 'Conta actualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /contas/:id/pagar — marca como paga
export async function marcarComoPaga(req, res) {
  try {
    const { id } = req.params;
    const hoje = new Date().toISOString().split('T')[0];

    await connection.execute(
      `UPDATE conta SET estado = 'pago', data_pagamento = ? WHERE id_conta = ?`,
      [hoje, id]
    );

    res.json({ mensagem: 'Conta marcada como paga' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /contas/:id
export async function eliminarConta(req, res) {
  try {
    const { id } = req.params;
    await connection.execute(
      `UPDATE conta SET apagado = 1 WHERE id_conta = ?`,
      [id]
    );
    res.json({ mensagem: 'Conta eliminada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /contas/resumo?id_empresa=X
export async function resumoContas(req, res) {
  try {
    const id_empresa = await buscarIdEmpresa(req);

    const [rows] = await connection.execute(
      `SELECT
         SUM(CASE WHEN tipo = 'receber' AND estado = 'pendente' THEN valor ELSE 0 END) AS total_receber,
         SUM(CASE WHEN tipo = 'pagar'   AND estado = 'pendente' THEN valor ELSE 0 END) AS total_pagar,
         SUM(CASE WHEN estado = 'vencido' THEN valor ELSE 0 END)                       AS total_vencido,
         COUNT(CASE WHEN estado = 'pendente' THEN 1 END)                               AS qtd_pendentes
       FROM conta
       WHERE id_empresa = ? AND apagado = 0`,
      [id_empresa]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}