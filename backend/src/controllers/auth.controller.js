"use strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const SECRET = process.env.JWT_SECRET || "clave_secreta_cambiar_en_produccion";

// POST /api/auth/register
const register = async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ mensaje: "Faltan campos obligatorios" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [resultado] = await pool.query(
      "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)",
      [nombre, email, hash]
    );
    res.status(201).json({ mensaje: "Usuario creado", id: resultado.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ mensaje: "El email ya está en uso" });
    res.status(500).json({ mensaje: "Error al crear el usuario", error });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ mensaje: "Faltan campos obligatorios" });

  try {
    const [usuarios] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (usuarios.length === 0)
      return res.status(401).json({ mensaje: "Email o contraseña incorrectos" });

    const usuario = usuarios[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida)
      return res.status(401).json({ mensaje: "Email o contraseña incorrectos" });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ mensaje: "Login correcto", token, nombre: usuario.nombre });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el login", error });
  }
};

export { register, login };
