"use strict";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave_secreta_cambiar_en_produccion";

const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token)
    return res.status(401).json({ mensaje: "Acceso denegado, token requerido" });

  try {
    const usuario = jwt.verify(token, SECRET);
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: "Token inválido o expirado" });
  }
};

export { verificarToken };
