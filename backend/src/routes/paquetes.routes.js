"use strict";
import { Router } from "express";
import {
  obtenerTodosLosPaquetes,
  obtenerPaquetePorId,
  obtenerPaquetePorCodigo,
  obtenerEstadisticas,
  crearPaquete,
  reemplazarPaquete,
  actualizarPaquete,
  eliminarPaquete
} from "../controller/paquetes.controller.js";

var paqueteRouter = Router();

// GET /api/paquetes
paqueteRouter.get("/", obtenerTodosLosPaquetes);

// GET /api/paquetes/estadisticas - datos para los graficos
paqueteRouter.get("/estadisticas", obtenerEstadisticas);

// GET /api/paquetes/codigo/:codigoBarras
paqueteRouter.get("/codigo/:codigoBarras", obtenerPaquetePorCodigo);

// GET /api/paquetes/:id
paqueteRouter.get("/:id", obtenerPaquetePorId);

// POST /api/paquetes
paqueteRouter.post("/", crearPaquete);

// PUT /api/paquetes/:id
paqueteRouter.put("/:id", reemplazarPaquete);

// PATCH /api/paquetes/:id
paqueteRouter.patch("/:id", actualizarPaquete);

// DELETE /api/paquetes/:id
paqueteRouter.delete("/:id", eliminarPaquete);

export { paqueteRouter };