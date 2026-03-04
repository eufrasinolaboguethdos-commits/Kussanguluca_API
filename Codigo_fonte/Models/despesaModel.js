import { connection } from '../Config/db.js';


// ✅ Criar despesa
export async function criarDespesa({ data, valor, categoria, descricao, id_empresa }) {

  const [result] = await connection.execute(
    `INSERT INTO Despesa
    (data, valor, categoria, descricao, id_empresa)
    VALUES (?, ?, ?, ?, ?)`,
    [data, valor, categoria, descricao, id_empresa]
  );

  return result.insertId;
}


// ✅ Listar despesas da empresa
export async function listarDespesas(id_empresa) {

  const [rows] = await connection.execute(
    `SELECT * FROM Despesa
     WHERE id_empresa = ? AND apagado = 0
     ORDER BY data DESC`,
    [id_empresa]
  );

  return rows;
}


// ✅ Buscar despesa por ID
export async function buscarDespesaPorId(id_despesa, id_empresa) {

  const [rows] = await connection.execute(
    `SELECT * FROM Despesa
     WHERE id_despesa = ? AND id_empresa = ? AND apagado = 0`,
    [id_despesa, id_empresa]
  );

  return rows[0];
}


// 🔒 Atualizar despesa
export async function actualizarDespesa(id_despesa, id_empresa, dados) {

  const [check] = await connection.execute(
    `SELECT id_despesa FROM Despesa
     WHERE id_despesa = ? AND id_empresa = ? AND apagado = 0`,
    [id_despesa, id_empresa]
  );

  if (check.length === 0) {
    throw new Error("Despesa não encontrada ou acesso negado");
  }

  const { data, valor, categoria, descricao } = dados;

  const [result] = await connection.execute(
    `UPDATE Despesa
     SET data = ?, valor = ?, categoria = ?, descricao = ?
     WHERE id_despesa = ? AND id_empresa = ?`,
    [data, valor, categoria, descricao, id, id_empresa]
  );

  return result.affectedRows;
}


// 🔒 Deletar despesa (soft delete)
export async function deletarDespesa(id_despesa, id_empresa) {

  const [check] = await connection.execute(
    `SELECT id_despesa FROM Despesa
     WHERE id_despesa = ? AND id_empresa = ? AND apagado = 0`,
    [id_despesa, id_empresa]
  );

  if (check.length === 0) {
    throw new Error("Despesa não encontrada ou acesso negado");
  }

  const [result] = await connection.execute(
    `UPDATE Despesa
     SET apagado = 1
     WHERE id_despesa = ? AND id_empresa = ?`,
    [id_despesa, id_empresa]
  );

  return result.affectedRows;
}