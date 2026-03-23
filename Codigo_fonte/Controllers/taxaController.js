import { connection } from '../Config/db.js';

// GET /taxa-cambio — taxa do dia actual ou mais recente
export async function obterTaxaActual(req, res) {
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM taxa_cambio ORDER BY data DESC LIMIT 1`
    );
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro obterTaxaActual:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /taxa-cambio/historico — histórico de taxas
export async function obterHistorico(req, res) {
  try {
    const { limite = 30 } = req.query;
    const [rows] = await connection.execute(
      `SELECT * FROM taxa_cambio ORDER BY data DESC LIMIT ?`,
      [parseInt(limite)]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro obterHistorico:', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /taxa-cambio — registar nova taxa
export async function registarTaxa(req, res) {
  try {
    const { data, usd_para_kz, eur_para_kz, fonte = 'manual' } = req.body;
    if (!data || !usd_para_kz) {
      return res.status(400).json({ error: 'data e usd_para_kz são obrigatórios' });
    }

    // Se já existe para esta data, actualiza
    const [existente] = await connection.execute(
      `SELECT id_taxa FROM taxa_cambio WHERE data = ?`, [data]
    );

    if (existente.length > 0) {
      await connection.execute(
        `UPDATE taxa_cambio SET usd_para_kz = ?, eur_para_kz = ?, fonte = ? WHERE data = ?`,
        [usd_para_kz, eur_para_kz || null, fonte, data]
      );
      const [updated] = await connection.execute(
        `SELECT * FROM taxa_cambio WHERE data = ?`, [data]
      );
      return res.json(updated[0]);
    }

    // Cria nova
    const [result] = await connection.execute(
      `INSERT INTO taxa_cambio (data, usd_para_kz, eur_para_kz, fonte) VALUES (?, ?, ?, ?)`,
      [data, usd_para_kz, eur_para_kz || null, fonte]
    );
    const [nova] = await connection.execute(
      `SELECT * FROM taxa_cambio WHERE id_taxa = ?`, [result.insertId]
    );
    res.status(201).json(nova[0]);
  } catch (err) {
    console.error('Erro registarTaxa:', err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /taxa-cambio/:id — eliminar taxa
export async function eliminarTaxa(req, res) {
  try {
    const { id } = req.params;
    await connection.execute(`DELETE FROM taxa_cambio WHERE id_taxa = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro eliminarTaxa:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /taxa-cambio/converter — converte valor de moeda para AOA
export async function converter(req, res) {
  try {
    const { valor, moeda, data } = req.query;
    if (!valor || !moeda) return res.status(400).json({ error: 'valor e moeda são obrigatórios' });

    let taxa;
    if (data) {
      const [rows] = await connection.execute(
        `SELECT * FROM taxa_cambio WHERE data <= ? ORDER BY data DESC LIMIT 1`, [data]
      );
      taxa = rows[0];
    } else {
      const [rows] = await connection.execute(
        `SELECT * FROM taxa_cambio ORDER BY data DESC LIMIT 1`
      );
      taxa = rows[0];
    }

    if (!taxa) return res.status(404).json({ error: 'Nenhuma taxa disponível' });

    const v = parseFloat(valor);
    let valorAOA = v;

    if (moeda.toUpperCase() === 'USD') valorAOA = v * parseFloat(taxa.usd_para_kz);
    else if (moeda.toUpperCase() === 'EUR') valorAOA = v * parseFloat(taxa.eur_para_kz || taxa.usd_para_kz);

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