import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import usuarioRoutes from './Codigo_fonte/Routes/usuarioRoutes.js';
import empresaRoutes from './Codigo_fonte/Routes/empresaRoutes.js';
import receitaRoutes from './Codigo_fonte/Routes/receitaRoutes.js';
import despesaRoutes from './Codigo_fonte/Routes/despesaRoutes.js';
import dashboardRoutes from "./Codigo_fonte/Routes/dashboardRoutes.js";
import relatorioRoutes from "./Codigo_fonte/Routes/relatorioRoutes.js";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/usuarios', usuarioRoutes);
app.use('/empresas', empresaRoutes);
app.use('/receitas', receitaRoutes);
app.use('/despesas', despesaRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/relatorio", relatorioRoutes);

app.get('/', (req, res) => {
        res.send('API KUSSANGULUCA FUNCIONOU, AZIMBORAAAA!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>{
    console.log(`Servidor está a rodar na porta ${PORT}`);
});