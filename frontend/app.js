"use strict";

// =============================================
// VARIABLES GLOBALES
// =============================================
var paginaActual    = 1;
var graficoSalida   = null;
var graficoOrigen   = null;
var graficoFecha    = null;
var graficoClienteMes    = null;
var graficoClienteOrigen = null;
var timerBusqueda   = null;
var paqueteAEditar  = null;
var paqueteABorrar  = null;

var listaColores = [
  "#6c63ff","#43e97b","#ff6584","#fbbf24","#06b6d4",
  "#f97316","#a855f7","#ec4899","#22c55e","#3b82f6",
  "#84cc16","#14b8a6","#eab308","#6366f1","#f43f5e"
];

// colores corporativos de cada empresa
// formato: { primario, secundario, fondo }
var coloresEmpresa = {
  "GLS":     { primario: "#FFD100", secundario: "#1D3C87", fondo: "rgba(255,209,0,0.08)"    },
  "SEUR":    { primario: "#FFCC00", secundario: "#E30613", fondo: "rgba(255,204,0,0.08)"    },
  "MRW":     { primario: "#E30613", secundario: "#FFD100", fondo: "rgba(227,6,19,0.08)"     },
  "Correos": { primario: "#FFCC00", secundario: "#004B8D", fondo: "rgba(255,204,0,0.08)"    },
  "DHL":     { primario: "#FFCC00", secundario: "#D40511", fondo: "rgba(255,204,0,0.08)"    },
  "UPS":     { primario: "#351C15", secundario: "#FFB500", fondo: "rgba(53,28,21,0.08)"     },
  "FedEx":   { primario: "#4D148C", secundario: "#FF6600", fondo: "rgba(77,20,140,0.08)"    },
  "Nacex":   { primario: "#FFDD00", secundario: "#0055A5", fondo: "rgba(255,221,0,0.08)"    }
};

// colores por defecto si la empresa no esta en la lista
var coloresDefault = { primario: "#6c63ff", secundario: "#ff6584", fondo: "rgba(108,99,255,0.08)" };

// coger el token
var token = localStorage.getItem("token");
if (!token) { window.location.href = "/login.html"; }


// =============================================
// FUNCION: mostrar una notificacion toast
// tipo: "exito" | "error" | "info"
// =============================================
function toast(mensaje, tipo) {

  // tipo por defecto
  if (!tipo) { tipo = "info"; }

  // icono segun el tipo
  var iconos = { exito: "✅", error: "❌", info: "ℹ️" };
  var icono = iconos[tipo] || "ℹ️";

  // crear el elemento
  var el = document.createElement("div");
  el.className = "toast " + tipo;
  el.innerHTML = "<span class='toast-icono'>" + icono + "</span><span class='toast-texto'>" + mensaje + "</span>";

  // meterlo en el container
  document.getElementById("toast-container").appendChild(el);

  // pequeño delay para que la transicion arranque bien
  setTimeout(function() { el.classList.add("show"); }, 20);

  // quitarlo despues de 3 segundos
  setTimeout(function() {
    el.classList.add("hide");
    el.classList.remove("show");
    setTimeout(function() {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 300);
  }, 3000);
}

document.getElementById("nombreUsuario").textContent = localStorage.getItem("nombre");

// aplicar tema guardado
var temaGuardado = localStorage.getItem("tema");
if (temaGuardado == "claro") {
  document.body.classList.add("claro");
  document.getElementById("botonTema").textContent = "🌙";
}


// =============================================
// FUNCION: cambiar tema claro / oscuro
// =============================================
function cambiarTema() {
  var esClaro = document.body.classList.toggle("claro");
  if (esClaro) {
    localStorage.setItem("tema", "claro");
    document.getElementById("botonTema").textContent = "🌙";
  } else {
    localStorage.setItem("tema", "oscuro");
    document.getElementById("botonTema").textContent = "☀️";
  }
  var origen = document.getElementById("filtroOrigen").value;
  var salida = document.getElementById("filtroSalida").value;
  var codigo = document.getElementById("inputBusqueda").value;
  cargarEstadisticas(origen, salida, codigo);
}


// =============================================
// FUNCION: cargar clientes en los selects
// =============================================
function cargarClientes() {
  fetch("http://localhost:3000/api/clientes", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(clientes) {

    var selectFiltro = document.getElementById("filtroSalida");
    var selectModal  = document.getElementById("editarSalida");

    for (var i = 0; i < clientes.length; i++) {
      var op1 = document.createElement("option");
      op1.value = clientes[i].id;
      op1.textContent = clientes[i].nombre;
      selectFiltro.appendChild(op1);

      var op2 = document.createElement("option");
      op2.value = clientes[i].id;
      op2.textContent = clientes[i].nombre;
      selectModal.appendChild(op2);
    }
  })
  .catch(function(err) { console.log("Error clientes: " + err.message); });
}


// =============================================
// FUNCION: buscar con delay de 300ms
// =============================================
function buscar() {
  clearTimeout(timerBusqueda);
  timerBusqueda = setTimeout(function() {
    paginaActual = 1;
    var origen = document.getElementById("filtroOrigen").value;
    var salida = document.getElementById("filtroSalida").value;
    var codigo = document.getElementById("inputBusqueda").value;
    cargarDatos(origen, salida, 1, codigo);
    cargarEstadisticas(origen, salida, codigo);
  }, 300);
}


// =============================================
// FUNCION: cargar tabla
// =============================================
function cargarDatos(origen, salida, pagina, codigoBarras) {

  document.getElementById("tablaCuerpo").innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-muted);">Cargando...</td></tr>';
  document.getElementById("contador").textContent = "cargando...";

  var limite = document.getElementById("limitePagina").value;
  var url = "http://localhost:3000/api/paquetes?pagina=" + pagina + "&limite=" + limite;
  if (origen != "")     { url = url + "&origen=" + origen; }
  if (salida != "")     { url = url + "&salida=" + salida; }
  if (codigoBarras != "" && codigoBarras != undefined) {
    url = url + "&codigoBarras=" + codigoBarras;
  }

  fetch(url, { headers: { "Authorization": "Bearer " + token } })
  .then(function(res) {
    if (res.status == 401 || res.status == 403) { cerrarSesion(); return null; }
    return res.json();
  })
  .then(function(datos) {
    if (!datos) return;

    var desde = (pagina - 1) * limite + 1;
    var hasta = pagina * limite;
    if (hasta > datos.total) { hasta = datos.total; }

    document.getElementById("infoResultados").textContent = "Mostrando " + desde + " - " + hasta + " de " + datos.total + " paquetes";
    document.getElementById("contador").textContent = desde + "-" + hasta + " de " + datos.total;

    if (datos.datos.length == 0) {
      document.getElementById("tablaCuerpo").innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-muted);">No hay resultados</td></tr>';
      document.getElementById("paginacion").innerHTML = "";
      return;
    }

    var html = "";
    for (var i = 0; i < datos.datos.length; i++) {
      var p = datos.datos[i];
      var fecha = new Date(p.fechaSalida).toLocaleDateString("es-ES");
      html = html + "<tr>";
      html = html + "<td style='color:var(--text-muted);font-family:Space Mono,monospace;font-size:0.75rem;'>#" + p.id + "</td>";
      html = html + "<td class='columna-barcode' style='font-family:Space Mono,monospace;color:var(--accent);font-size:0.78rem;'>" + p.codigoBarras + "</td>";
      html = html + "<td class='columna-fecha' style='color:var(--text-muted);'>" + fecha + "</td>";
      html = html + "<td><span class='etiqueta-verde'>" + p.origen + "</span></td>";
      html = html + "<td><span class='etiqueta-morada'>" + p.nombreCliente + "</span></td>";
      html = html + "<td style='text-align:right;white-space:nowrap;'>";
      html = html + "<button class='boton-icono' title='Editar' onclick='abrirModalEditar(" + JSON.stringify(p).replace(/'/g, "\\'") + ")'>✏️</button>";
      html = html + "<button class='boton-icono' title='Eliminar' onclick='abrirModalEliminar(" + p.id + ",\"" + p.codigoBarras + "\")'>🗑️</button>";
      html = html + "</td></tr>";
    }

    document.getElementById("tablaCuerpo").innerHTML = html;
    hacerPaginacion(pagina, datos.totalPaginas);
  })
  .catch(function(err) { console.log("Error tabla: " + err.message); });
}


// =============================================
// FUNCION: cargar estadisticas
// =============================================
// =============================================
// FUNCION: cargar estadísticas y dibujar graficos
// =============================================
function cargarEstadisticas(origen, salida, codigoBarras) {

  var salidaSelect  = document.getElementById("filtroSalida");
  var salidaId      = salidaSelect.value;
  var nombreCliente = salidaId != "" ? salidaSelect.options[salidaSelect.selectedIndex].textContent : "";

  // url base con todos los filtros
  var urlCompleta = "http://localhost:3000/api/paquetes/estadisticas?a=1";
  if (origen != "")     { urlCompleta += "&origen=" + origen; }
  if (salida != "")     { urlCompleta += "&salida=" + salida; }
  if (codigoBarras != "" && codigoBarras != undefined) { urlCompleta += "&codigoBarras=" + codigoBarras; }

  // url solo con salida y codigoBarras — SIN origen — para que el grafico del medio
  // siempre muestre Cordoba y Sevilla aunque haya filtro de origen activo
  var urlSinOrigen = "http://localhost:3000/api/paquetes/estadisticas?a=1";
  if (salida != "")     { urlSinOrigen += "&salida=" + salida; }
  if (codigoBarras != "" && codigoBarras != undefined) { urlSinOrigen += "&codigoBarras=" + codigoBarras; }

  var pCompleta   = fetch(urlCompleta,  { headers: { "Authorization": "Bearer " + token } }).then(function(r) { return r.json(); });
  var pSinOrigen  = fetch(urlSinOrigen, { headers: { "Authorization": "Bearer " + token } }).then(function(r) { return r.json(); });

  Promise.all([pCompleta, pSinOrigen])
  .then(function(res) {
    var datosCompletos  = res[0];
    var datosSinOrigen  = res[1];
    hacerGraficos(nombreCliente, datosCompletos, datosSinOrigen);
  })
  .catch(function(err) { console.log("Error estadisticas: " + err.message); });
}


// =============================================
// FUNCION UNICA de graficos
// nombreCliente: string vacío = sin filtro de empresa
// datosCompletos: respuesta con todos los filtros (para dona y linea)
// datosSinOrigen: respuesta sin filtro origen (para barras del medio, siempre Córdoba+Sevilla)
// =============================================
function hacerGraficos(nombreCliente, datosCompletos, datosSinOrigen) {

  var hayCliente  = nombreCliente != "";

  // actualizar titulos de graficos 1 y 3 segun estado
  var tit1 = document.getElementById("tituloGrafico1");
  var tit3 = document.getElementById("tituloGrafico3");
  if (hayCliente) {
    tit1.textContent = "Cordoba vs Sevilla — " + nombreCliente;
    tit3.textContent = "Evolucion mensual — " + nombreCliente;
  } else {
    tit1.textContent = "Paquetes por empresa";
    tit3.textContent = "Evolucion por mes";
  }
  var colores     = hayCliente ? (coloresEmpresa[nombreCliente] || coloresDefault) : null;
  var colorTexto  = getComputedStyle(document.body).getPropertyValue("--text-muted").trim();
  var colorGrid   = document.body.classList.contains("claro") ? "rgba(200,200,220,0.5)" : "rgba(42,42,56,0.5)";

  // actualizar badge del cliente si hay filtro
  var badge   = document.getElementById("badgeCliente");
  var cabecera = document.getElementById("cabeceraCliente");
  if (hayCliente) {
    badge.textContent = nombreCliente;
    badge.style.background = colores.primario;
    badge.style.color = esClaroElColor(colores.primario) ? "#1a1a2e" : "#ffffff";
    cabecera.style.display = "flex";
    cabecera.style.borderLeftColor = colores.primario;
  } else {
    cabecera.style.display = "none";
  }

  // ─────────────────────────────────────────────────────────────
  // GRAFICO 1 — dona
  // Sin empresa: todas las empresas con listaColores
  // Con empresa: Córdoba vs Sevilla con colores corporativos
  // ─────────────────────────────────────────────────────────────
  if (graficoSalida != null) { graficoSalida.destroy(); }

  if (!hayCliente) {
    // todas las empresas
    var etiquetasSalida = [];
    var valoresSalida   = [];
    for (var i = 0; i < datosCompletos.porSalida.length; i++) {
      etiquetasSalida.push(datosCompletos.porSalida[i].nombre);
      valoresSalida.push(datosCompletos.porSalida[i].total);
    }
    graficoSalida = new Chart(document.getElementById("graficoSalida"), {
      type: "doughnut",
      data: {
        labels: etiquetasSalida,
        datasets: [{ data: valoresSalida, backgroundColor: listaColores, borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "60%",
        plugins: { legend: { position: "bottom", labels: { color: colorTexto, font: { size: 10 }, boxWidth: 10 } } }
      }
    });
  } else {
    // Córdoba vs Sevilla con colores de la empresa
    var cordobaDona = 0;
    var sevillaDona = 0;
    for (var i = 0; i < datosSinOrigen.porOrigen.length; i++) {
      if (datosSinOrigen.porOrigen[i].nombre == "Cordoba") { cordobaDona = datosSinOrigen.porOrigen[i].total; }
      if (datosSinOrigen.porOrigen[i].nombre == "Sevilla")  { sevillaDona = datosSinOrigen.porOrigen[i].total; }
    }
    graficoSalida = new Chart(document.getElementById("graficoSalida"), {
      type: "doughnut",
      data: {
        labels: ["Cordoba", "Sevilla"],
        datasets: [{
          data: [cordobaDona, sevillaDona],
          backgroundColor: [colores.primario, colores.secundario],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "60%",
        plugins: { legend: { position: "bottom", labels: { color: colorTexto, font: { size: 11 }, boxWidth: 12 } } }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // GRAFICO 2 — barras Córdoba vs Sevilla — SIEMPRE IGUAL
  // usa datosSinOrigen para que siempre tenga las dos barras
  // ─────────────────────────────────────────────────────────────
  var cordobaBarras = 0;
  var sevillaBarras = 0;
  for (var i = 0; i < datosSinOrigen.porOrigen.length; i++) {
    if (datosSinOrigen.porOrigen[i].nombre == "Cordoba") { cordobaBarras = datosSinOrigen.porOrigen[i].total; }
    if (datosSinOrigen.porOrigen[i].nombre == "Sevilla")  { sevillaBarras = datosSinOrigen.porOrigen[i].total; }
  }

  if (graficoOrigen != null) { graficoOrigen.destroy(); }
  graficoOrigen = new Chart(document.getElementById("graficoOrigen"), {
    type: "bar",
    data: {
      labels: ["Cordoba", "Sevilla"],
      datasets: [{
        data: [cordobaBarras, sevillaBarras],
        backgroundColor: ["rgba(108,99,255,0.8)", "rgba(67,233,123,0.8)"],
        borderColor:     ["#6c63ff", "#43e97b"],
        borderWidth: 2, borderRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: colorTexto, font: { size: 12, weight: "600" } }, grid: { display: false } },
        y: { ticks: { color: colorTexto, font: { size: 9 } }, grid: { color: colorGrid } }
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GRAFICO 3 — línea temporal
  // Sin empresa: dos líneas (Córdoba morado, Sevilla verde)
  // Con empresa: una sola línea con el color corporativo
  // ─────────────────────────────────────────────────────────────
  if (graficoFecha != null) { graficoFecha.destroy(); }

  if (!hayCliente) {
    // construir meses y separar por origen usando porMesPorOrigen
    var mesesSet = {};
    for (var i = 0; i < datosCompletos.porMesPorOrigen.length; i++) {
      mesesSet[datosCompletos.porMesPorOrigen[i].mes] = true;
    }
    var mesesOrdenados = Object.keys(mesesSet).sort();

    var valoresCordoba = [];
    var valoresSevilla = [];
    for (var i = 0; i < mesesOrdenados.length; i++) {
      var mes = mesesOrdenados[i];
      var vc = 0; var vs = 0;
      for (var j = 0; j < datosCompletos.porMesPorOrigen.length; j++) {
        var f = datosCompletos.porMesPorOrigen[j];
        if (f.mes == mes && f.origen == "Cordoba") { vc = f.total; }
        if (f.mes == mes && f.origen == "Sevilla")  { vs = f.total; }
      }
      valoresCordoba.push(vc);
      valoresSevilla.push(vs);
    }

    graficoFecha = new Chart(document.getElementById("graficoFecha"), {
      type: "line",
      data: {
        labels: mesesOrdenados,
        datasets: [
          {
            label: "Cordoba",
            data: valoresCordoba,
            borderColor: "#6c63ff", backgroundColor: "rgba(108,99,255,0.06)",
            fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: "#6c63ff", borderWidth: 2
          },
          {
            label: "Sevilla",
            data: valoresSevilla,
            borderColor: "#43e97b", backgroundColor: "rgba(67,233,123,0.06)",
            fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: "#43e97b", borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: colorTexto, font: { size: 10 }, boxWidth: 12 } } },
        scales: {
          x: { ticks: { color: colorTexto, font: { size: 9 } }, grid: { color: colorGrid } },
          y: { ticks: { color: colorTexto, font: { size: 9 } }, grid: { color: colorGrid } }
        }
      }
    });

  } else {
    // una sola línea con color corporativo de la empresa
    var etiquetasMesEmp = [];
    var valoresMesEmp   = [];

    // agrupar porMes (que viene con campo origen) sumando ambos origenes por mes
    var totalesPorMes = {};
    for (var i = 0; i < datosCompletos.porMes.length; i++) {
      var fila = datosCompletos.porMes[i];
      if (!totalesPorMes[fila.nombre]) { totalesPorMes[fila.nombre] = 0; }
      totalesPorMes[fila.nombre] += parseInt(fila.total);
    }
    var mesesEmp = Object.keys(totalesPorMes).sort();
    for (var i = 0; i < mesesEmp.length; i++) {
      etiquetasMesEmp.push(mesesEmp[i]);
      valoresMesEmp.push(totalesPorMes[mesesEmp[i]]);
    }

    graficoFecha = new Chart(document.getElementById("graficoFecha"), {
      type: "line",
      data: {
        labels: etiquetasMesEmp,
        datasets: [{
          label: nombreCliente,
          data: valoresMesEmp,
          borderColor: colores.primario,
          backgroundColor: colores.fondo,
          fill: true, tension: 0.4, pointRadius: 4,
          pointBackgroundColor: colores.primario,
          pointBorderColor: colores.secundario,
          pointBorderWidth: 2, borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: colorTexto, font: { size: 10 }, boxWidth: 12 } } },
        scales: {
          x: { ticks: { color: colorTexto, font: { size: 9 } }, grid: { color: colorGrid } },
          y: { ticks: { color: colorTexto, font: { size: 9 } }, grid: { color: colorGrid } }
        }
      }
    });
  }
}

function esClaroElColor(hex) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  var luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.5;
}


// =============================================
// PAGINACION
// =============================================
function hacerPaginacion(paginaActual, totalPaginas) {
  if (totalPaginas <= 1) { document.getElementById("paginacion").innerHTML = ""; return; }

  var html = "";

  if (paginaActual <= 1) {
    html = html + "<button class='boton-pagina' disabled>←</button>";
  } else {
    html = html + "<button class='boton-pagina' onclick='irAPagina(" + (paginaActual - 1) + ")'>←</button>";
  }

  for (var i = 1; i <= totalPaginas; i++) {
    var mostrar = false;
    if (i == 1) mostrar = true;
    if (i == totalPaginas) mostrar = true;
    if (i >= paginaActual - 2 && i <= paginaActual + 2) mostrar = true;

    if (mostrar) {
      if (i == paginaActual) {
        html = html + "<button class='boton-pagina pagina-activa'>" + i + "</button>";
      } else {
        html = html + "<button class='boton-pagina' onclick='irAPagina(" + i + ")'>" + i + "</button>";
      }
    } else if (i == paginaActual - 3 || i == paginaActual + 3) {
      html = html + "<span style='color:var(--text-muted);padding:0 4px;'>...</span>";
    }
  }

  if (paginaActual >= totalPaginas) {
    html = html + "<button class='boton-pagina' disabled>→</button>";
  } else {
    html = html + "<button class='boton-pagina' onclick='irAPagina(" + (paginaActual + 1) + ")'>→</button>";
  }

  document.getElementById("paginacion").innerHTML = html;
}

function irAPagina(pagina) {
  paginaActual = pagina;
  var origen = document.getElementById("filtroOrigen").value;
  var salida = document.getElementById("filtroSalida").value;
  var codigo = document.getElementById("inputBusqueda").value;
  cargarDatos(origen, salida, pagina, codigo);
  window.scrollTo(0, 0);
}


// =============================================
// MODAL - EDITAR
// =============================================
function abrirModalEditar(paquete) {
  paqueteAEditar = paquete;
  var fecha = new Date(paquete.fechaSalida).toISOString().split("T")[0];
  document.getElementById("editarFecha").value  = fecha;
  document.getElementById("editarOrigen").value = paquete.origen;
  document.getElementById("editarSalida").value = paquete.salida;
  document.getElementById("modalEditar").classList.add("visible");
}

function cerrarModalEditar() {
  document.getElementById("modalEditar").classList.remove("visible");
  paqueteAEditar = null;
}

function guardarEdicion() {
  if (!paqueteAEditar) return;

  var fechaNueva  = document.getElementById("editarFecha").value;
  var origenNuevo = document.getElementById("editarOrigen").value;
  var salidaNueva = document.getElementById("editarSalida").value;

  if (!fechaNueva || !origenNuevo || !salidaNueva) {
    alert("Rellena todos los campos");
    return;
  }

  fetch("http://localhost:3000/api/paquetes/" + paqueteAEditar.id, {
    method: "PATCH",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ fechaSalida: fechaNueva, origen: origenNuevo, salida: salidaNueva })
  })
  .then(function(res) { return res.json(); })
  .then(function() {
    cerrarModalEditar();
    toast("Paquete actualizado correctamente", "exito");
    var origen = document.getElementById("filtroOrigen").value;
    var salida = document.getElementById("filtroSalida").value;
    var codigo = document.getElementById("inputBusqueda").value;
    cargarDatos(origen, salida, paginaActual, codigo);
    cargarEstadisticas(origen, salida, codigo);
  })
  .catch(function(err) {
    toast("Error al actualizar el paquete", "error");
    console.log("Error editar: " + err.message);
  });
}


// =============================================
// MODAL - ELIMINAR
// =============================================
function abrirModalEliminar(id, codigoBarras) {
  paqueteABorrar = id;
  document.getElementById("codigoABorrar").textContent = codigoBarras;
  document.getElementById("modalEliminar").classList.add("visible");
}

function cerrarModalEliminar() {
  document.getElementById("modalEliminar").classList.remove("visible");
  paqueteABorrar = null;
}

function confirmarEliminar() {
  if (!paqueteABorrar) return;

  fetch("http://localhost:3000/api/paquetes/" + paqueteABorrar, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function(res) { return res.json(); })
  .then(function() {
    cerrarModalEliminar();
    toast("Paquete eliminado", "error");
    var origen = document.getElementById("filtroOrigen").value;
    var salida = document.getElementById("filtroSalida").value;
    var codigo = document.getElementById("inputBusqueda").value;
    cargarDatos(origen, salida, paginaActual, codigo);
    cargarEstadisticas(origen, salida, codigo);
  })
  .catch(function(err) {
    toast("Error al eliminar el paquete", "error");
    console.log("Error eliminar: " + err.message);
  });
}


// =============================================
// BOTONES GENERALES
// =============================================
function limpiarFiltros() {
  document.getElementById("filtroOrigen").value  = "";
  document.getElementById("filtroSalida").value  = "";
  document.getElementById("inputBusqueda").value = "";
  paginaActual = 1;
  cargarDatos("", "", 1, "");
  cargarEstadisticas("", "", "");
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("nombre");
  window.location.href = "/login.html";
}

document.getElementById("modalEditar").addEventListener("click", function(e) {
  if (e.target == this) { cerrarModalEditar(); }
});
document.getElementById("modalEliminar").addEventListener("click", function(e) {
  if (e.target == this) { cerrarModalEliminar(); }
});


// =============================================
// ARRANCAR
// =============================================
cargarClientes();
cargarDatos("", "", 1, "");
cargarEstadisticas("", "", "");