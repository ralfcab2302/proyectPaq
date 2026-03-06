"use strict";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";

const userSeeder = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id       INT AUTO_INCREMENT PRIMARY KEY,
        nombre   VARCHAR(100) NOT NULL,
        email    VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Tabla usuarios lista");

    // crea usuario admin si no existe
    const [existente] = await pool.query("SELECT id FROM usuarios WHERE email = ?", ["admin@admin.com"]);
    if (existente.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)",
        ["Admin", "admin@admin.com", hash]
      );
      console.log("Usuario admin creado → email: admin@admin.com | password: admin123");
    } else {
      console.log("Usuario admin ya existe");
    }
  } catch (error) {
    console.log("Error en userSeeder:", error.message);
  }
};

export { userSeeder };
