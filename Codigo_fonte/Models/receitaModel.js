import { connection } from '../Config/db.js';


// ✅ Criar receita
export async function criarReceita({  data, valor, categoria, descricao, id_empresa }) {
  const [result] = await connection.execute(
    `INSERT INTO Receita 
    ( data, valor, categoria, descricao, id_empresa)
    VALUES (?, ?, ?, ?, ?)`,
    [ data, valor, categoria, descricao, id_empresa]
  );

  return result.insertId;
}


// ✅ Listar todas receitas da empresa
export async function listarReceitas(id_empresa) {
  const [rows] = await connection.execute(
    `SELECT * FROM Receita 
     WHERE id_empresa = ? AND apagado = 0
     ORDER BY data DESC`,
    [id_empresa]
  );

  return rows;
}


// ✅ Buscar uma receita específica
export async function buscarReceitaPorId(id, id_empresa) {
  const [rows] = await connection.execute(
    `SELECT * FROM Receita 
     WHERE id = ? AND id_empresa = ? AND apagado = 0`,
    [id, id_empresa]
  );

  return rows[0];
}


// 🔒 Atualizar receita (com verificação de segurança)
export async function actualizarReceita(id_receita, id_empresa, dados) {

  // verificar se a receita pertence à empresa
  const [check] = await connection.execute(
    `SELECT id_receita FROM Receita 
     WHERE id_receita = ? AND id_empresa = ? AND apagado = 0`,
    [id_receita, id_empresa]
  );

  if (check.length === 0) {
    throw new Error("Receita não encontrada ou acesso negado");
  }

  const { data, valor, categoria, descricao } = dados;

  const [result] = await connection.execute(
    `UPDATE Receita
     SET data = ?, valor = ?, categoria = ?, descricao = ?
     WHERE id_receita = ? AND id_empresa = ?`,
    [data, valor, categoria, descricao, id_receita, id_empresa]
  );

  return result.affectedRows;
}


// 🔒 Delete seguro (Soft Delete)
export async function deletarReceita(id_receita, id_empresa) {

  // verificar se pertence à empresa
  const [check] = await connection.execute(
    `SELECT id_receita FROM Receita
     WHERE id_receita = ? AND id_empresa = ? AND apagado = 0`,
    [id_receita, id_empresa]
  );

  if (check.length === 0) {
    throw new Error("Receita não encontrada ou acesso negado");
  }

  const [result] = await connection.execute(
    `UPDATE Receita
     SET apagado = 1
     WHERE id_receita = ? AND id_empresa = ?`,
    [id_receita, id_empresa]
  );

  return result.affectedRows;
}