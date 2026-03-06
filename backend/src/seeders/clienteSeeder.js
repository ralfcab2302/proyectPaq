"use strict";
import { pool } from "../config/db.js";

async function clienteSeeder() {
  try {

    // crear la tabla clientes si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    console.log("Tabla clientes lista");

    // comprobar si ya hay clientes para no duplicar
    var [filas] = await pool.query("SELECT COUNT(*) as total FROM clientes");
    var total = filas[0].total;

    if (total > 0) {
      console.log("Los clientes ya estaban creados, no se insertan de nuevo");
      return;
    }

    // lista de empresas distribuidoras
    var clientes = [
      { nombre: "GLS",      email: "gls@gls-spain.es" },
      { nombre: "SEUR",     email: "clientes@seur.com" },
      { nombre: "MRW",      email: "atencion@mrw.es" },
      { nombre: "Correos",  email: "correos@correos.es" },
      { nombre: "DHL",      email: "dhl@dhl.es" },
      { nombre: "UPS",      email: "ups@ups.es" },
      { nombre: "FedEx",    email: "fedex@fedex.es" },
      { nombre: "Nacex",    email: "nacex@nacex.es" }
    ];

    // insertar cada cliente
    for (var i = 0; i < clientes.length; i++) {
      var cliente = clientes[i];
      await pool.query(
        "INSERT INTO clientes (nombre, email) VALUES (?, ?)",
        [cliente.nombre, cliente.email]
      );
      console.log("Cliente insertado: " + cliente.nombre);
    }

    console.log("Seeder de clientes terminado");

  } catch (error) {
    console.log("Error en clienteSeeder: " + error.message);
  }
}

export { clienteSeeder };
