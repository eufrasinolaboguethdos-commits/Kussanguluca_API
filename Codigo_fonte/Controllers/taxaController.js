import { connection } from '../Config/db.js';

// GET taxa actual
export async function obterTaxaActual(req, res) {
  try {
    const { id_empresa } = req.usuario;

    const [rows] = await connection.execute(
      `SELECT * FROM taxa_cambio 
       WHERE id_empresa = ? 
       ORDER BY data DESC 
       LIMIT 1`,
      [id_empresa]
    );

    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro obterTaxaActual:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET histórico
export async function obterHistorico(req, res) {
  try {
    const { id_empresa } = req.usuario;
    const limite = parseInt(req.query.limite) || 30;

    const [rows] = await connection.execute(
      `SELECT * FROM taxa_cambio 
       WHERE id_empresa = ? 
       ORDER BY data DESC 
       LIMIT ?`,
      [id_empresa, limite]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro obterHistorico:', err);
    res.status(500).json({ error: err.message });
  }
}

// POST nova taxa
export async function registarTaxa(req, res) {
  try {
    const { id_empresa } = req.usuario;
    const { data, usd_para_kz, eur_para_kz, fonte = 'manual' } = req.body;

    if (!data || !usd_para_kz) {
      return res.status(400).json({ error: 'data e usd_para_kz são obrigatórios' });
    }

    const [existente] = await connection.execute(
      `SELECT id_taxa FROM taxa_cambio 
       WHERE data = ? AND id_empresa = ?`,
      [data, id_empresa]
    );

    if (existente.length > 0) {
      await connection.execute(
        `UPDATE taxa_cambio 
         SET usd_para_kz = ?, eur_para_kz = ?, fonte = ? 
         WHERE data = ? AND id_empresa = ?`,
        [usd_para_kz, eur_para_kz || null, fonte, data, id_empresa]
      );

      const [updated] = await connection.execute(
        `SELECT * FROM taxa_cambio 
         WHERE data = ? AND id_empresa = ?`,
        [data, id_empresa]
      );

      return res.json(updated[0]);
    }

    const [result] = await connection.execute(
      `INSERT INTO taxa_cambio 
       (id_empresa, data, usd_para_kz, eur_para_kz, fonte) 
       VALUES (?, ?, ?, ?, ?)`,
      [id_empresa, data, usd_para_kz, eur_para_kz || null, fonte]
    );

    const [nova] = await connection.execute(
      `SELECT * FROM taxa_cambio WHERE id_taxa = ?`,
      [result.insertId]
    );

    res.status(201).json(nova[0]);

  } catch (err) {
    console.error('Erro registarTaxa:', err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE
export async function eliminarTaxa(req, res) {
  try {
    const { id_empresa } = req.usuario;
    const { id } = req.params;

    await connection.execute(
      `DELETE FROM taxa_cambio 
       WHERE id_taxa = ? AND id_empresa = ?`,
      [id, id_empresa]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Erro eliminarTaxa:', err);
    res.status(500).json({ error: err.message });
  }
}

// CONVERTER
export async function converter(req, res) {
  try {
    const { id_empresa } = req.usuario;
    const { valor, moeda, data } = req.query;

    if (!valor || !moeda) {
      return res.status(400).json({ error: 'valor e moeda são obrigatórios' });
    }

    let taxa;

    if (data) {
      const [rows] = await connection.execute(
        `SELECT * FROM taxa_cambio 
         WHERE id_empresa = ? AND data <= ? 
         ORDER BY data DESC 
         LIMIT 1`,
        [id_empresa, data]
      );
      taxa = rows[0];
    } else {
      const [rows] = await connection.execute(
        `SELECT * FROM taxa_cambio 
         WHERE id_empresa = ? 
         ORDER BY data DESC 
         LIMIT 1`,
        [id_empresa]
      );
      taxa = rows[0];
    }

    if (!taxa) {
      return res.status(404).json({ error: 'Nenhuma taxa disponível' });
    }

    const v = parseFloat(valor);
    let valorAOA = v;

    if (moeda.toUpperCase() === 'USD') {
      valorAOA = v * parseFloat(taxa.usd_para_kz);
    } else if (moeda.toUpperCase() === 'EUR') {
      valorAOA = v * parseFloat(taxa.eur_para_kz || taxa.usd_para_kz);
    }

    res.json({
      valorOriginal: v,
      moeda: moeda.toUpperCase(),
      valorAOA,
      taxa: taxa.usd_para_kz,
      dataUltimaTaxa: taxa.data
    });

  } catch (err) {
    console.error('Erro converter:', err);
    res.status(500).json({ error: err.message });
  }
}