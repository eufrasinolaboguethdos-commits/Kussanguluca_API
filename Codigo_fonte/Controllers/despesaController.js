import {
  criarDespesa,
  listarDespesas,
  buscarDespesaPorId,
  actualizarDespesa,
  deletarDespesa
} from '../Models/despesaModel.js';

import { connection } from '../Config/db.js';


// ✅ Criar despesa
export async function criar(req, res) {
  try {

    const buscarIdEmpresaPeloIdUsuario = async (id_usuario) => {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [id_usuario]
      );
 
      return rows[0]?.id_empresa;
    };

    console.log("usuario:", req.usuario);
    console.log("id_empresa:", await buscarIdEmpresaPeloIdUsuario(req.usuario.id));
    console.log("body:", req.body);
    const { data, valor, categoria, descricao } = req.body;

    const id_empresa = req.body.id_empresa 
  ? Number(req.body.id_empresa) 
  : await buscarIdEmpresaPeloIdUsuario(req.usuario.id);
  
    const id = await criarDespesa({
      id_empresa,
      data,
      valor,
      categoria,
      descricao
    });

    res.status(201).json({ id, data, valor, categoria, descricao });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Listar despesas
export async function listar(req, res) {
  try {
    let id_empresa = req.query.id_empresa ? Number(req.query.id_empresa) : null;

    if (!id_empresa) {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [req.usuario?.id]
      );
      id_empresa = rows[0]?.id_empresa ? Number(rows[0].id_empresa) : null;
    }

    if (!id_empresa) {
      return res.status(400).json({ error: 'id_empresa obrigatório' });
    }

    const despesas = await listarDespesas(id_empresa);
    res.json(despesas);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Buscar despesa por ID
export async function buscarPorId(req, res) {
  try {
  const buscarDespesaPorId = async (id_usuario) => {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [id_usuario]
      );
      return rows[0]?.id_empresa;
    };
    
    const id_empresa = await buscarDespesaPorId(req.usuario.id);


    const despesa = await buscarDespesaPorId(
      req.params.id,
      id_empresa
    );

    if (!despesa)
      return res.status(404).json({ error: "Despesa não encontrada" });

    res.json(despesa);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Atualizar despesa
export async function atualizar(req, res) {
  try {
       const buscarDespesaPorId = async (id_usuario) => {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [id_usuario]
      );
      return rows[0]?.id_empresa;
    };
    
    const id_empresa = await buscarDespesaPorId(req.usuario.id);

    await actualizarDespesa(
      req.params.id,
      id_empresa,
      req.body
    );

    res.json({ message: "Despesa atualizada" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Deletar despesa
export async function deletar(req, res) {
 
  try {
    
    const buscarDespesaPorId = async (id_usuario) => {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [id_usuario]
      );
      return rows[0]?.id_empresa;
    };
    
    const id_empresa = await buscarDespesaPorId(req.usuario.id);

    await deletarDespesa(
      req.params.id,
      id_empresa
    );

    res.json({ message: "Despesa deletada" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}