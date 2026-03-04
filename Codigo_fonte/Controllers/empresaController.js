import { criarEmpresa, listarEmpresas, buscarEmpresaPorId,updateEmpresa,apagarEmpresa} from '../Models/empresaModel.js';
//import jwt from 'jsonwebtoken';




// CREATE
export async function adicionarEmpresa(req, res) {
  try {
    const id_usuario = req.usuarioId; // 👈 vem do middleware
    const { nome, NIF, setor } = req.body;

    if (!nome || !NIF || !setor) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    const id = await criarEmpresa({
      nome,
      NIF,
      setor,
      id_usuario
    });

    res.status(201).json({
      id_empresa: id,
      nome,
      NIF,
      setor
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// READ - listar empresas
export async function obterEmpresas(req, res) {
  try {
    const id_usuario = req.usuarioId;

    const empresas = await listarEmpresas(id_usuario);

    res.json(empresas);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// READ - buscar empresa por ID
export async function obterEmpresaPorId(req, res) {
  try {
    const { id } = req.params;

    const empresa = await buscarEmpresaPorId(id);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(empresa);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// UPDATE
export async function updateEmpresas(req, res) {
  try {
    const { id } = req.params;
    const { nome, NIF, setor } = req.body;

    const actualizado = await updateEmpresa(id, {
      nome,
      NIF,
      setor
    });

    if (!actualizado) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({ message: 'Empresa actualizada com sucesso' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// DELETE
export async function apagarEmpresaController(req, res) {
  try {
    const { id } = req.params;

    const apagado = await apagarEmpresa(id);

    if (!apagado) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({ message: 'Empresa apagada com sucesso' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}