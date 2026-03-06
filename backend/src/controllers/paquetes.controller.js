"use strict";
import { pool } from "../config/db.js";

// GET /paquetes - con filtros y paginacion
const obtenerTodosLosPaquetes = async (req, res) => {

  // coger los filtros de la url
  var origen       = req.query.origen       || "";
  var salida       = req.query.salida       || "";
  var codigoBarras = req.query.codigoBarras || "";
  var pagina       = req.query.pagina       || 1;
  var limite       = req.query.limite       || 50;

  // convertir a numero
  pagina = parseInt(pagina);
  limite = parseInt(limite);

  // calcular desde donde empezar
  var offset = (pagina - 1) * limite;

  // construir la query con JOIN para traer el nombre del cliente
  var queryDatos = "SELECT p.*, c.nombre as nombreCliente FROM paquetes p JOIN clientes c ON p.salida = c.id WHERE 1=1";
  var queryTotal = "SELECT COUNT(*) as total FROM paquetes p JOIN clientes c ON p.salida = c.id WHERE 1=1";
  var valores = [];

  if (origen != "") {
    queryDatos = queryDatos + " AND p.origen = ?";
    queryTotal = queryTotal + " AND p.origen = ?";
    valores.push(origen);
  }

  if (salida != "") {
    queryDatos = queryDatos + " AND p.salida = ?";
    queryTotal = queryTotal + " AND p.salida = ?";
    valores.push(salida);
  }

  if (codigoBarras != "") {
    queryDatos = queryDatos + " AND p.codigoBarras LIKE ?";
    queryTotal = queryTotal + " AND p.codigoBarras LIKE ?";
    valores.push("%" + codigoBarras + "%");
  }

  // añadir paginacion al final
  queryDatos = queryDatos + " LIMIT ? OFFSET ?";

  try {
    var valoresPaginados = valores.concat([limite, offset]);
    var [paquetes] = await pool.query(queryDatos, valoresPaginados);
    var [conteo]   = await pool.query(queryTotal, valores);

    var total        = conteo[0].total;
    var totalPaginas = Math.ceil(total / limite);

    res.json({
      datos: paquetes,
      total: total,
      pagina: pagina,
      limite: limite,
      totalPaginas: totalPaginas
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los paquetes", error: error.message });
  }
};

// GET /paquetes/:id
const obtenerPaquetePorId = async (req, res) => {
  try {
    var id = req.params.id;

    // traer el paquete con el nombre del cliente
    var [paquete] = await pool.query(
      "SELECT p.*, c.nombre as nombreCliente FROM paquetes p JOIN clientes c ON p.salida = c.id WHERE p.id = ?",
      [id]
    );

    if (paquete.length == 0) {
      return res.status(404).json({ mensaje: "Paquete no encontrado" });
    }

    res.json(paquete[0]);

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el paquete", error: error.message });
  }
};

// GET /paquetes/codigo/:codigoBarras
const obtenerPaquetePorCodigo = async (req, res) => {
  try {
    var codigo = req.params.codigoBarras;

    var [paquete] = await pool.query(
      "SELECT p.*, c.nombre as nombreCliente FROM paquetes p JOIN clientes c ON p.salida = c.id WHERE p.codigoBarras = ?",
      [codigo]
    );

    if (paquete.length == 0) {
      return res.status(404).json({ mensaje: "Paquete no encontrado" });
    }

    res.json(paquete[0]);

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el paquete", error: error.message });
  }
};

// POST /paquetes - crear uno nuevo
const crearPaquete = async (req, res) => {
  var codigoBarras = req.body.codigoBarras;
  var fechaSalida  = req.body.fechaSalida;
  var origen       = req.body.origen;
  var salida       = req.body.salida; // id del cliente

  // comprobar que vienen todos los campos
  if (!codigoBarras || !fechaSalida || !origen || !salida) {
    return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
  }

  // comprobar que el origen es valido
  if (origen != "Cordoba" && origen != "Sevilla") {
    return res.status(400).json({ mensaje: "El origen solo puede ser Cordoba o Sevilla" });
  }

  try {
    var [resultado] = await pool.query(
      "INSERT INTO paquetes (codigoBarras, fechaSalida, origen, salida) VALUES (?, ?, ?, ?)",
      [codigoBarras, fechaSalida, origen, salida]
    );

    res.status(201).json({ mensaje: "Paquete creado", id: resultado.insertId });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear el paquete", error: error.message });
  }
};

// PUT /paquetes/:id - reemplazar todos los campos
const reemplazarPaquete = async (req, res) => {
  var id           = req.params.id;
  var codigoBarras = req.body.codigoBarras;
  var fechaSalida  = req.body.fechaSalida;
  var origen       = req.body.origen;
  var salida       = req.body.salida;

  if (!codigoBarras || !fechaSalida || !origen || !salida) {
    return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
  }

  if (origen != "Cordoba" && origen != "Sevilla") {
    return res.status(400).json({ mensaje: "El origen solo puede ser Cordoba o Sevilla" });
  }

  try {
    var [resultado] = await pool.query(
      "UPDATE paquetes SET codigoBarras = ?, fechaSalida = ?, origen = ?, salida = ? WHERE id = ?",
      [codigoBarras, fechaSalida, origen, salida, id]
    );

    if (resultado.affectedRows == 0) {
      return res.status(404).json({ mensaje: "Paquete no encontrado" });
    }

    res.json({ mensaje: "Paquete reemplazado" });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al reemplazar el paquete", error: error.message });
  }
};

// PATCH /paquetes/:id - actualizar solo los campos que lleguen
const actualizarPaquete = async (req, res) => {
  var id = req.params.id;

  var campos = [];
  var valores = [];

  if (req.body.codigoBarras) {
    campos.push("codigoBarras = ?");
    valores.push(req.body.codigoBarras);
  }
  if (req.body.fechaSalida) {
    campos.push("fechaSalida = ?");
    valores.push(req.body.fechaSalida);
  }
  if (req.body.origen) {
    // comprobar origen valido
    if (req.body.origen != "Cordoba" && req.body.origen != "Sevilla") {
      return res.status(400).json({ mensaje: "El origen solo puede ser Cordoba o Sevilla" });
    }
    campos.push("origen = ?");
    valores.push(req.body.origen);
  }
  if (req.body.salida) {
    campos.push("salida = ?");
    valores.push(req.body.salida);
  }

  if (campos.length == 0) {
    return res.status(400).json({ mensaje: "Manda al menos un campo para actualizar" });
  }

  valores.push(id);

  try {
    var query = "UPDATE paquetes SET " + campos.join(", ") + " WHERE id = ?";
    var [resultado] = await pool.query(query, valores);

    if (resultado.affectedRows == 0) {
      return res.status(404).json({ mensaje: "Paquete no encontrado" });
    }

    res.json({ mensaje: "Paquete actualizado" });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar el paquete", error: error.message });
  }
};

// DELETE /paquetes/:id
const eliminarPaquete = async (req, res) => {
  try {
    var id = req.params.id;
    var [resultado] = await pool.query("DELETE FROM paquetes WHERE id = ?", [id]);

    if (resultado.affectedRows == 0) {
      return res.status(404).json({ mensaje: "Paquete no encontrado" });
    }

    res.json({ mensaje: "Paquete eliminado" });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar el paquete", error: error.message });
  }
};


// GET /paquetes/estadisticas - datos globales para los graficos del inicio
// acepta los mismos filtros que la lista principal
const obtenerEstadisticas = async (req, res) => {

  // coger los filtros
  var origen       = req.query.origen       || "";
  var salida       = req.query.salida       || "";
  var codigoBarras = req.query.codigoBarras || "";

  // construir el WHERE igual que en la lista
  var where  = "WHERE 1=1";
  var valores = [];

  if (origen != "") {
    where = where + " AND p.origen = ?";
    valores.push(origen);
  }
  if (salida != "") {
    where = where + " AND p.salida = ?";
    valores.push(salida);
  }
  if (codigoBarras != "") {
    where = where + " AND p.codigoBarras LIKE ?";
    valores.push("%" + codigoBarras + "%");
  }

  try {

    // contar paquetes por cliente/salida
    var [porSalida] = await pool.query(
      "SELECT c.nombre as nombre, COUNT(*) as total FROM paquetes p JOIN clientes c ON p.salida = c.id " + where + " GROUP BY c.id, c.nombre ORDER BY total DESC",
      valores
    );

    // contar paquetes por origen
    var [porOrigen] = await pool.query(
      "SELECT p.origen as nombre, COUNT(*) as total FROM paquetes p JOIN clientes c ON p.salida = c.id " + where + " GROUP BY p.origen ORDER BY total DESC",
      valores
    );

    // contar paquetes por mes
    var [porMes] = await pool.query(
      "SELECT DATE_FORMAT(p.fechaSalida, '%Y-%m') as nombre, COUNT(*) as total FROM paquetes p JOIN clientes c ON p.salida = c.id " + where + " GROUP BY DATE_FORMAT(p.fechaSalida, '%Y-%m') ORDER BY nombre ASC",
      valores
    );

    // contar paquetes por mes separado por origen (Cordoba y Sevilla) — sin filtro de origen para ver siempre las dos
    var wheresinOrigen = "WHERE 1=1";
    var valoresSinOrigen = [];
    if (salida != "") {
      wheresinOrigen = wheresinOrigen + " AND p.salida = ?";
      valoresSinOrigen.push(salida);
    }
    if (codigoBarras != "") {
      wheresinOrigen = wheresinOrigen + " AND p.codigoBarras LIKE ?";
      valoresSinOrigen.push("%" + codigoBarras + "%");
    }

    // porMesPorOrigen: incluye campo origen para que el frontend pueda separar las dos lineas
    var [porMesPorOrigen] = await pool.query(
      "SELECT DATE_FORMAT(p.fechaSalida, '%Y-%m') as mes, p.origen as origen, COUNT(*) as total FROM paquetes p JOIN clientes c ON p.salida = c.id " + wheresinOrigen + " GROUP BY DATE_FORMAT(p.fechaSalida, '%Y-%m'), p.origen ORDER BY mes ASC",
      valoresSinOrigen
    );

    // porMes con origen: version de porMes que incluye el campo origen (para graficos de cliente)
    var [porMesConOrigen] = await pool.query(
      "SELECT DATE_FORMAT(p.fechaSalida, '%Y-%m') as nombre, p.origen as origen, COUNT(*) as total FROM paquetes p JOIN clientes c ON p.salida = c.id " + where + " GROUP BY DATE_FORMAT(p.fechaSalida, '%Y-%m'), p.origen ORDER BY nombre ASC",
      valores
    );

    res.json({
      porSalida:        porSalida,
      porOrigen:        porOrigen,
      porMes:           porMesConOrigen,
      porMesPorOrigen:  porMesPorOrigen
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener estadisticas", error: error.message });
  }
};

export {
  obtenerTodosLosPaquetes,
  obtenerPaquetePorId,
  obtenerPaquetePorCodigo,
  obtenerEstadisticas,
  crearPaquete,
  reemplazarPaquete,
  actualizarPaquete,
  eliminarPaquete
};