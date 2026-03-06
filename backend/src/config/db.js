"use strict";
import mysql from "mysql2/promise";

export var pool = mysql.createPool({
  host: "db",
  user: "root",
  password: "root",
  database: "paquetes_db",
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection()
  .then(function(conn) {
    console.log("Conexion con mysql establecida correctamente");
    conn.release();
  })
  .catch(function(err) {
    console.error(err);
  });
