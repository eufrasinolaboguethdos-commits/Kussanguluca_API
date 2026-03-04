import express from "express";
import { dashboard } from "../Controllers/dashboardController.js";
import { authMiddleware } from '../Middleware/authMiddleware.js';



const router = express.Router();

// Rota principal do dashboard
router.get('/', authMiddleware, dashboard);

// Futuro: rota mensal
// router.get("/mensal", dashboardMensal);

export default router;