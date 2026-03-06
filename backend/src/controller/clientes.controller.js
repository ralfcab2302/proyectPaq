"use strict";
import { pool } from "../data/data.js";

// GET /clientes - obtener todos los clientes
const obtenerTodosLosClientes = async (req, res) => {
  try {
    var [clientes] = await pool.query("SELECT * FROM clientes");
    res.json(clientes);

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los clientes", error: error.message });
  }
};

// GET /clientes/:id - obtener un cliente por id
const obtenerClientePorId = async (req, res) => {
  try {
    var id = req.params.id;
    var [cliente] = await pool.query("SELECT * FROM clientes WHERE id = ?", [id]);

    if (cliente.length == 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.json(cliente[0]);

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el cliente", error: error.message });
  }
};

// GET /clientes/:id/paquetes - obtener los paquetes de un cliente
const obtenerPaquetesDeCliente = async (req, res) => {
  try {
    var id = req.params.id;

    // comprobar que el cliente existe
    var [cliente] = await pool.query("SELECT * FROM clientes WHERE id = ?", [id]);
    if (cliente.length == 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    // coger los paquetes de ese cliente
    var [paquetes] = await pool.query(
      "SELECT * FROM paquetes WHERE salida = ?",
      [id]
    );

    res.json({
      cliente: cliente[0],
      totalPaquetes: paquetes.length,
      paquetes: paquetes
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los paquetes del cliente", error: error.message });
  }
};

// POST /clientes - crear un cliente nuevo
const crearCliente = async (req, res) => {
  var nombre = req.body.nombre;
  var email  = req.body.email;

  // comprobar que vienen los campos obligatorios
  if (!nombre || !email) {
    return res.status(400).json({ mensaje: "Faltan campos obligatorios: nombre y email" });
  }

  try {
    var [resultado] = await pool.query(
      "INSERT INTO clientes (nombre, email) VALUES (?, ?)",
      [nombre, email]
    );

    res.status(201).json({ mensaje: "Cliente creado", id: resultado.insertId });

  } catch (error) {
    // si el email ya existe da error de duplicado
    if (error.code == "ER_DUP_ENTRY") {
      return res.status(400).json({ mensaje: "Ya existe un cliente con ese email" });
    }
    res.status(500).json({ mensaje: "Error al crear el cliente", error: error.message });
  }
};

// PUT /clientes/:id - actualizar un cliente
const actualizarCliente = async (req, res) => {
  var id     = req.params.id;
  var nombre = req.body.nombre;
  var email  = req.body.email;

  if (!nombre || !email) {
    return res.status(400).json({ mensaje: "Faltan campos obligatorios: nombre y email" });
  }

  try {
    var [resultado] = await pool.query(
      "UPDATE clientes SET nombre = ?, email = ? WHERE id = ?",
      [nombre, email, id]
    );

    if (resultado.affectedRows == 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.json({ mensaje: "Cliente actualizado" });

  } catch (error) {
    if (error.code == "ER_DUP_ENTRY") {
      return res.status(400).json({ mensaje: "Ya existe un cliente con ese email" });
    }
    res.status(500).json({ mensaje: "Error al actualizar el cliente", error: error.message });
  }
};

// DELETE /clientes/:id - eliminar un cliente
const eliminarCliente = async (req, res) => {
  try {
    var id = req.params.id;
    var [resultado] = await pool.query("DELETE FROM clientes WHERE id = ?", [id]);

    if (resultado.affectedRows == 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.json({ mensaje: "Cliente eliminado" });

  } catch (error) {
    // si tiene paquetes asociados no se puede borrar por la FK
    if (error.code == "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({ mensaje: "No se puede eliminar, el cliente tiene paquetes asociados" });
    }
    res.status(500).json({ mensaje: "Error al eliminar el cliente", error: error.message });
  }
};

export {
  obtenerTodosLosClientes,
  obtenerClientePorId,
  obtenerPaquetesDeCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};
