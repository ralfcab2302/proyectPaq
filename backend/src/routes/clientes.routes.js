"use strict";
import { Router } from "express";
import {
  obtenerTodosLosClientes,
  obtenerClientePorId,
  obtenerPaquetesDeCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from "../controller/clientes.controller.js";

var clienteRouter = Router();

// GET /api/clientes
clienteRouter.get("/", obtenerTodosLosClientes);

// GET /api/clientes/:id
clienteRouter.get("/:id", obtenerClientePorId);

// GET /api/clientes/:id/paquetes
clienteRouter.get("/:id/paquetes", obtenerPaquetesDeCliente);

// POST /api/clientes
clienteRouter.post("/", crearCliente);

// PUT /api/clientes/:id
clienteRouter.put("/:id", actualizarCliente);

// DELETE /api/clientes/:id
clienteRouter.delete("/:id", eliminarCliente);

export { clienteRouter };
