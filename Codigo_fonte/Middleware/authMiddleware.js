import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;  // Ex: "Bearer xyz..."

    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    const [, token] = authHeader.split(" ");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 👇 AQUI ESTAVA O PROBLEMA: NÃO SETAVA req.usuario
        req.usuario = {
            id: decoded.id,     // deve ser exatamente o campo do payload do teu token
            email: decoded.email
        };

        next();

    } catch (error) {
        return res.status(401).json({ error: "Token inválido" });
    }
};