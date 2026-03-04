import { listarReceitas } from "../Models/receitaModel.js";
import { listarDespesas } from "../Models/despesaModel.js";
import { gerarRelatorioFinanceiro } from "../Utils/relatorioFinanceiro.js";
import { connection } from "../Config/db.js";

export async function relatorio(req, res) {
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
        //const { data, valor, categoria, descricao } = req.body;
    
        const id_empresa =  await buscarIdEmpresaPeloIdUsuario(req.usuario.id); 


    const receitas = await listarReceitas(id_empresa);
    const despesas = await listarDespesas(id_empresa);

    const relatorio = gerarRelatorioFinanceiro(receitas, despesas);

    res.json(relatorio);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}