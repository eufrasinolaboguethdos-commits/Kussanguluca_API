import { connection } from '../Config/db.js';


// CREATE
export async function criarEmpresa({ nome, NIF, setor, id_usuario }) {
  const [result] = await connection.execute(
    'INSERT INTO empresa (nome, NIF, setor, id_usuario) VALUES (?, ?, ?, ?)',
    [nome, NIF, setor, id_usuario]
  );

  return result.insertId;
}


// READ - listar empresas do usuário
export async function listarEmpresas(id_usuario) {
  const [rows] = await connection.execute(
    'SELECT * FROM empresa WHERE id_usuario = ?',
    [id_usuario]
  );

  return rows;
}


// READ - buscar empresa por ID
export async function buscarEmpresaPorId(id_empresa) {
  const [rows] = await connection.execute(
    'SELECT * FROM empresa WHERE id_empresa = ?',
    [id_empresa]
  );

  return rows[0];
}


// UPDATE
export async function updateEmpresa(id_empresa, { nome, NIF, setor }) {
  const [result] = await connection.execute(
    `UPDATE empresa 
     SET nome = ?, NIF = ?, setor = ?
     WHERE id_empresa = ?`,
    [nome, NIF, setor, id_empresa]
  );

  return result.affectedRows;
}


// DELETE
export async function apagarEmpresa(id_empresa) {
  const [result] = await connection.execute(
    'DELETE FROM empresa WHERE id_empresa = ?',
    [id_empresa]
  );

  return result.affectedRows;
}
