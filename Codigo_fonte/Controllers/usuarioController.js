import { criarUsuario, buscarUsuarioPorEmail, listarUsuarios, buscarUsuarioPorId, atualizarUsuario, deletarUsuario } from '../Models/usuarioModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
  try {
    const { email, senha } = req.body;
    const usuario = await buscarUsuarioPorEmail(email, senha);

    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Senha inválida' });


    const token = jwt.sign({ id: usuario.id_usuario, id_empresa: usuario.id_empresa, }, process.env.JWT_SECRET, { expiresIn: '3600s' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
