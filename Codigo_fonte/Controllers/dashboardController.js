import { calcularResumoFinanceiro } from "../Utils/calculoFinanceiro.js";
import { listarReceitas } from "../Models/receitaModel.js";
import { listarDespesas } from "../Models/despesaModel.js";
import { connection } from "../Config/db.js";

export async function dashboard(req, res) {
  try {



    const buscarIdEmpresaPeloIdUsuario = async (id_usuario) => {
          const [rows] = await connection.execute(
            'SELECT id_empresa FROM empresa WHERE id_usuario = ?',
            [id_usuario]
          );
          return rows[0]?.id_empresa;
        };
     const id_empresa =  await buscarIdEmpresaPeloIdUsuario(req.usuario.id); 


    const receitas = await listarReceitas(id_empresa);
    const despesas = await listarDespesas(id_empresa);

    const resumo = calcularResumoFinanceiro(receitas, despesas);

    res.json(resumo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}