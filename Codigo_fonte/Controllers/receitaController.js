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

    const id_empresa = req.body.id_empresa 
  ? Number(req.body.id_empresa) 
  : await buscarIdEmpresaPeloIdUsuario(req.usuario.id);
  
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
// Controllers/receitaController.js
export async function listar(req, res) {
  try {
    // 1) tente pegar da query (?id_empresa=5)
    let id_empresa = req.query.id_empresa ? Number(req.query.id_empresa) : null;

    // 2) se não vier na query, resolva pelo usuário logado
    if (!id_empresa) {
      const [rows] = await connection.execute(
        'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
        [req.usuario?.id]
      );
      id_empresa = rows[0]?.id_empresa ? Number(rows[0].id_empresa) : null;
    }

    // 3) valide
    if (!id_empresa) {
      return res.status(400).json({ error: 'id_empresa obrigatório' });
    }

    const receitas = await listarReceitas(id_empresa);
    return res.json(receitas);
  } catch (err) {
    console.error('Erro em listar receitas:', err);
    return res.status(500).json({ error: err.message });
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