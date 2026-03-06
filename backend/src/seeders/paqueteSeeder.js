"use strict";
import { pool } from "../config/db.js";
import { faker } from "@faker-js/faker/locale/es";

async function seeder() {
  try {

    // crear la tabla paquetes con la columna salida que apunta a clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paquetes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigoBarras VARCHAR(100) NOT NULL UNIQUE,
        fechaSalida DATE NOT NULL,
        origen VARCHAR(100) NOT NULL,
        salida INT NOT NULL,
        FOREIGN KEY (salida) REFERENCES clientes(id)
      )
    `);

    console.log("Tabla paquetes lista");

    // comprobar si ya hay paquetes
    var [filas] = await pool.query("SELECT COUNT(*) as total FROM paquetes");
    var total = filas[0].total;

    if (total > 0) {
      console.log("Los paquetes ya estaban creados, no se insertan de nuevo");
      return;
    }

    // coger los ids de los clientes que existen
    var [clientes] = await pool.query("SELECT id FROM clientes");

    if (clientes.length == 0) {
      console.log("No hay clientes, no se pueden insertar paquetes");
      return;
    }

    // origenes posibles - solo cordoba y sevilla
    var origenes = ["Cordoba", "Sevilla"];

    // insertar 2000 paquetes de 100 en 100
    var totalInsertados = 0;

    for (var i = 0; i < 2000; i++) {

      // coger un origen aleatorio entre cordoba y sevilla
      var origenAleatorio = origenes[Math.floor(Math.random() * origenes.length)];

      // coger un cliente aleatorio de los que existen
      var clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];

      // generar datos falsos
      var codigoBarras = faker.string.alphanumeric(12).toUpperCase();
      var fechaSalida  = faker.date.between({ from: "2024-01-01", to: "2025-12-31" }).toISOString().split("T")[0];

      await pool.query(
        "INSERT INTO paquetes (codigoBarras, fechaSalida, origen, salida) VALUES (?, ?, ?, ?)",
        [codigoBarras, fechaSalida, origenAleatorio, clienteAleatorio.id]
      );

      totalInsertados = totalInsertados + 1;

      // mostrar progreso cada 100
      if (totalInsertados % 100 == 0) {
        console.log("Insertados " + totalInsertados + "/2000...");
      }
    }

    console.log("Seeder terminado, se insertaron " + totalInsertados + " paquetes");

  } catch (error) {
    console.log("Error en el seeder: " + error.message);
  }
}

export { seeder };
