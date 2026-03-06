"use strict";
import express from "express";
import cors from "cors";
import { paqueteRouter } from "./routes/paquetes.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { clienteRouter } from "./routes/clientes.routes.js";
import { verificarToken } from "./middleware/auth.middleware.js";
import { seeder } from "./paqueteSeeder.js";
import { userSeeder } from "./userSeeder.js";
import { clienteSeeder } from "./clienteSeeder.js";

var server = express();

server.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization"]
}));

server.use(express.json());

// ruta publica para comprobar que el servidor funciona
server.get("/", (req, res) => {
  res.send("Servidor Node.js + Express funcionando");
});

// rutas publicas - no necesitan token
server.use("/api/auth", authRouter);

// rutas protegidas - necesitan token
server.use("/api/paquetes", verificarToken, paqueteRouter);
server.use("/api/clientes", verificarToken, clienteRouter);

// arrancar el servidor
server.listen(3000, async function() {
  console.log("Servidor escuchando en http://localhost:3000");

  // ejecutar los seeders en orden
  // primero clientes, luego paquetes (porque paquetes depende de clientes)
  await clienteSeeder();
  await userSeeder();
  await seeder();
});
