import { 
  criarReceita, 
  listarReceitas, 
  buscarReceitaPorId, 
  actualizarReceita, 
  deletarReceita 
} from '../Models/receitaModel.js';
import { connection } from '../Config/db.js';


// ✅ Criar receita
export async function criar(req, res) {
  try {
     // buscar id da empresa pelo id do usuario
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

    const id_empresa =  await buscarIdEmpresaPeloIdUsuario(req.usuario.id);
    
     if (!id_empresa) {
      return res.status(400).json({
        error: "Usuário não possui empresa cadastrada"
      });
    }
    const id = await criarReceita({
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


// ✅ Listar receitas da empresa logada
export async function listar(req, res) {
  try {

      const buscarDespesaPorId = async (id_usuario) => {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [id_usuario]
      );
      return rows[0]?.id_empresa;
    };
    
    const id_empresa = await buscarDespesaPorId(req.usuario.id);

    const receitas = await listarReceitas(id_empresa);

    res.json(receitas);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Buscar receita por ID
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

    const receita = await buscarReceitaPorId(req.params.id, id_empresa);

    if (!receita)
      return res.status(404).json({ error: "Receita não encontrada" });

    res.json(receita);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Atualizar receita
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

    await actualizarReceita(
      req.params.id,
      id_empresa,
      req.body
    );

    res.json({ message: "Receita atualizada" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ✅ Deletar receita (soft delete)
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

    await deletarReceita(req.params.id, id_empresa);

    res.json({ message: "Receita deletada" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}