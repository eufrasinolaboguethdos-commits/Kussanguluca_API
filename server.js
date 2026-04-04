import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import usuarioRoutes from './Codigo_fonte/Routes/usuarioRoutes.js';
import empresaRoutes from './Codigo_fonte/Routes/empresaRoutes.js';
import receitaRoutes from './Codigo_fonte/Routes/receitaRoutes.js';
import despesaRoutes from './Codigo_fonte/Routes/despesaRoutes.js';
import dashboardRoutes from "./Codigo_fonte/Routes/dashboardRoutes.js";
import relatorioRoutes from "./Codigo_fonte/Routes/relatorioRoutes.js";
import { httpLogger } from "./Codigo_fonte/Middleware/loggerMiddleware.js";
import exportRoutes from './Codigo_fonte/Routes/exportRoutes.js';
import saudeRoutes  from './Codigo_fonte/Routes/saudeRoutes.js';
import contaRoutes  from './Codigo_fonte/Routes/contaRoutes.js';
import metaRoutes   from './Codigo_fonte/Routes/metaRoutes.js';
import fluxoRoutes  from './Codigo_fonte/Routes/fluxoRoutes.js';
import taxaRoutes from './Codigo_fonte/Routes/taxaRoutes.js';
import eliminacaoRoutes from './Codigo_fonte/Routes/eliminacaoRoutes.js';
import kussRoutes from './Codigo_fonte/Routes/kussRoutes.js';


dotenv.config();
const app = express();

// No topo do ficheiro
//const cors = require('cors');

// Depois de criar o app
app.use(cors({
  origin: 'http://localhost:5173', // URL do teu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.use('/usuarios', usuarioRoutes);
app.use('/empresas', empresaRoutes);
app.use('/receitas', receitaRoutes);
app.use('/despesas', despesaRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/relatorio", relatorioRoutes);
app.use('/exportar', exportRoutes);
app.use('/saude',   saudeRoutes);
app.use('/contas',  contaRoutes);
app.use('/metas',   metaRoutes);
app.use('/fluxo',   fluxoRoutes);
app.use('/taxa-cambio', taxaRoutes);
app.use('/eliminacao', eliminacaoRoutes);
app.use('/kuss', kussRoutes);


app.get('/', (req, res) => {
        res.send('API KUSSANGULUCA FUNCIONOU, AZIMBORAAAA!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>{
    console.log(`Servidor está a rodar na porta ${PORT}`);
});