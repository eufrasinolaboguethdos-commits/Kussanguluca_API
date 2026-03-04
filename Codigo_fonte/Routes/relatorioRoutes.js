import express from "express";
import { relatorio } from "../Controllers/relatorioController.js";
import { authMiddleware } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.get("/", authMiddleware, relatorio);

export default router;