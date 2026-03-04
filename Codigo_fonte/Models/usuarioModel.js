import { connection } from '../Config/db.js';



export async function criarUsuario({ nome, email, senha, id_empresa }) {
    const [result] = await connection.execute(
        'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, senha]
    );
    return result.insertId;
    
}

export async function buscarUsuarioPorEmail(email){
    const [rows] = await connection.execute(
        'SELECT * FROM usuario WHERE email = ?',
        [email]
    );
    return rows[0];
}

// Buscar usuário por ID
export async function buscarUsuarioPorId(id) {
  const [rows] = await connection.execute(
    'SELECT * FROM usuario WHERE id_usuario = ?',
    [id]
  );
  return rows[0];
}


export async function listarUsuarios() {
  const [rows] = await connection.execute(
    'SELECT id_usuario, nome, email, perfil FROM usuario'
  );
  return rows;
}

// Atualizar usuário
export async function atualizarUsuario(id, dados) {
  const [result] = await connection.execute(
    'UPDATE Usuario SET nome = ?, email = ? WHERE id_usuario = ?',
    [dados.nome, dados.email, id]
  );

  return result[0];
}


// Deletar usuário
export async function deletarUsuario(id) {
  const [result] = await connection.execute(
    'DELETE FROM usuario WHERE id_usuario = ?',
    [id]
  );

  return result[0];
}
