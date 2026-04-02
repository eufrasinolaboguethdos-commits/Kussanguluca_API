import { criarUsuario, buscarUsuarioPorEmail, listarUsuarios, buscarUsuarioPorId, atualizarUsuario, deletarUsuario } from '../Models/usuarioModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connection } from '../Config/db.js';

export async function registrarUsuario(req, res) {
  try {
    const { nome, email, senha } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);
    const id = await criarUsuario({ nome, email, senha: senhaHash });
    res.status(201).json({ id, nome, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function loginUsuario(req, res) {
  console.log("BODY:", req.body);
  try {
    const { email, senha } = req.body;

    // Verificar se os dados estão sendo recebidos corretamente
    console.log('Email recebido:', email);
    console.log('Senha recebida:', senha);

    // Buscar o usuário pelo email
    const usuario = await buscarUsuarioPorEmail(email);
    console.log("USER:", usuario);

    // Verificar se o usuário foi encontrado
    if (!usuario) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    if (usuario.apagado === 1) {
      return res.status(401).json({
        error: 'Esta conta foi eliminada. Contacte o suporte se acredita que foi um erro.'
      });
    }
    // Verificar a senha comparando com o hash no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      console.log('Senha inválida para o usuário:', email);
      return res.status(401).json({ error: 'Senha inválida' });
    }

    // Verificar se o usuário possui empresa cadastrada
    const buscarIdEmpresaPeloIdUsuario = async (id_usuario) => {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [id_usuario]
      );
      return rows[0]?.id_empresa;
    };

    // Se tudo estiver correto, gerar o token
    const idEmpresa = await buscarIdEmpresaPeloIdUsuario(usuario.id_usuario);

    const token = jwt.sign(
      { id: usuario.id_usuario, id_empresa: idEmpresa || null },
      process.env.JWT_SECRET,
      { expiresIn: '3600s' }
    );

    res.json({
      token,
      user: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        id_empresa: idEmpresa
      }
    });

  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ message: "Erro no servidor" });
  }

}
export async function obterUsuarios(req, res) {
  try {

    const usuarios = await listarUsuarios();

    res.json(usuarios);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET usuário por ID
export async function id_Usuario(req, res) {
  try {

    const usuario = await buscarUsuarioPorId(req.params.id);

    if (!usuario)
      return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(usuario);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT atualizar
export async function updateUsuario(req, res) {
  try {

    const { nome, email } = req.body;

    await atualizarUsuario(req.params.id, { nome, email });

    res.json({ message: "Usuário atualizado" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE usuário
export async function apagar_Usuario(req, res) {
  try {

    await deletarUsuario(req.params.id);

    res.json({ message: "Usuário deletado" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function resetSenha(req, res) {
  try {
    const { email, novaSenha } = req.body;

    // verificar se o utilizador existe
    const usuario = await buscarUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(404).json({ error: 'Email não encontrado' });
    }

    // hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // atualizar no banco
    await connection.execute(
      'UPDATE usuario SET senha = ? WHERE email = ?',
      [senhaHash, email]
    );

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}