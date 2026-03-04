import express from 'express';
import { registrarUsuario, loginUsuario, obterUsuarios, id_Usuario, updateUsuario, apagar_Usuario } from '../Controllers/usuarioController.js';

const router = express.Router();

router.post('/', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/', obterUsuarios);
router.get('/:id', id_Usuario);
router.put('/:id', updateUsuario);
router.delete('/:id', apagar_Usuario);


export default router;
