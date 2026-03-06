"use strict";
import express from "express";
import cors from "cors";
import { paqueteRouter } from "./routes/paquetes.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { clienteRouter } from "./routes/clientes.routes.js";
import { verificarToken } from "./middleware/auth.middleware.js";
import { seeder } from "./seeders/paqueteSeeder.js";
import { userSeeder } from "./seeders/userSeeder.js";
import { clienteSeeder } from "./seeders/clienteSeeder.js";
import { pool } from "./config/db.js";

var server = express();

var corsOpciones = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

server.use(cors(corsOpciones));
server.options("*", cors(corsOpciones));

server.use(express.json());

server.get("/", (req, res) => {
  res.send("Servidor Node.js + Express funcionando");
});

server.use("/api/auth", authRouter);
server.use("/api/paquetes", verificarToken, paqueteRouter);
server.use("/api/clientes", verificarToken, clienteRouter);


// =============================================
// FUNCION: esperar a MySQL — reintenta cada 3s
// =============================================
async function esperarMySQL() {
  var intentos = 15;
  for (var i = 1; i <= intentos; i++) {
    try {
      var conn = await pool.getConnection();
      conn.release();
      console.log("✅ MySQL listo");
      return;
    } catch (err) {
      console.log("⏳ Esperando MySQL... intento " + i + "/" + intentos);
      await new Promise(function(r) { setTimeout(r, 3000); });
    }
  }
  console.error("❌ No se pudo conectar a MySQL");
  process.exit(1);
}


// =============================================
// ARRANCAR — primero MySQL, luego seeders,
// luego el servidor. En ese orden siempre.
// =============================================
async function arrancar() {
  await esperarMySQL();

  await clienteSeeder();
  await userSeeder();
  await seeder();

  server.listen(3000, function() {
    console.log("🚀 Servidor escuchando en http://localhost:3000");
  });
}

arrancar();
