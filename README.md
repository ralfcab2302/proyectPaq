# 📦 PaqTrack — Documentación técnica

Sistema de gestión de paquetes de mensajería con dashboard en tiempo real.

**Stack:** Node.js · Express · MySQL 8 · nginx · Docker

---

## Índice

1. [Descripción](#descripción)
2. [Arquitectura](#arquitectura)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Base de datos](#base-de-datos)
5. [API REST](#api-rest)
6. [Frontend](#frontend)
7. [Colores corporativos](#colores-corporativos)
8. [Docker](#docker)
9. [Variables de entorno](#variables-de-entorno)
10. [Problemas conocidos](#problemas-conocidos)

---

## Descripción

PaqTrack es una aplicación web para gestionar envíos de mensajería. Permite visualizar, filtrar, editar y eliminar paquetes asociados a empresas distribuidoras. Incluye un dashboard con gráficos en tiempo real y autenticación JWT.

---

## Arquitectura

Tres contenedores Docker orquestados con `docker-compose`:

| Contenedor  | Descripción                                      | Puerto         |
|-------------|--------------------------------------------------|----------------|
| `app_node`  | Backend Node.js + Express                        | `3000`         |
| `app_mysql` | Base de datos MySQL 8                            | `3306`         |
| `app_front` | Frontend estático servido con nginx              | `5173` → `80`  |

`app_node` depende de `app_mysql` con healthcheck. Los seeders se ejecutan automáticamente al arrancar Node.

---

## Estructura de carpetas

```
proyecPaq/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                  ← arranque del servidor + seeders
│       ├── clienteSeeder.js          ← inserta las 8 empresas
│       ├── paqueteSeeder.js          ← inserta 2000 paquetes
│       ├── userSeeder.js             ← crea usuario admin
│       ├── data/
│       │   └── data.js               ← pool de conexión MySQL
│       ├── middleware/
│       │   └── auth.middleware.js    ← verificación JWT
│       ├── controller/
│       │   ├── auth.controller.js
│       │   ├── paquetes.controller.js
│       │   └── clientes.controller.js
│       └── routes/
│           ├── auth.routes.js
│           ├── paquetes.routes.js
│           └── clientes.routes.js
├── frontend/
│   ├── Dockerfile
│   ├── index.html                    ← estructura del dashboard
│   ├── login.html                    ← página de login
│   ├── styles.css                    ← estilos + variables CSS claro/oscuro
│   └── app.js                        ← toda la lógica JavaScript
└── database/
    └── Dockerfile
```

---

## Base de datos

### Tabla `clientes`

| Campo    | Tipo                        |
|----------|-----------------------------|
| `id`     | INT AUTO_INCREMENT PK       |
| `nombre` | VARCHAR(100) NOT NULL       |
| `email`  | VARCHAR(100) NOT NULL UNIQUE|

### Tabla `paquetes`

| Campo          | Tipo                                       |
|----------------|--------------------------------------------|
| `id`           | INT AUTO_INCREMENT PK                      |
| `codigoBarras` | VARCHAR(100) NOT NULL UNIQUE               |
| `fechaSalida`  | DATE NOT NULL                              |
| `origen`       | VARCHAR(100) — solo `'Cordoba'` o `'Sevilla'` |
| `salida`       | INT NOT NULL — FK → `clientes.id`          |

### Tabla `usuarios`

| Campo      | Tipo                         |
|------------|------------------------------|
| `id`       | INT AUTO_INCREMENT PK        |
| `nombre`   | VARCHAR(100) NOT NULL        |
| `email`    | VARCHAR(100) NOT NULL UNIQUE |
| `password` | VARCHAR(255) — hash bcrypt   |

### Seeders (orden de ejecución)

```js
await clienteSeeder();   // 1º — las empresas tienen que existir antes que los paquetes
await userSeeder();      // 2º — usuario admin
await seeder();          // 3º — 2000 paquetes con FK a clientes
```

**Empresas insertadas:** GLS, SEUR, MRW, Correos, DHL, UPS, FedEx, Nacex

---

## API REST

Todas las rutas excepto `/api/auth/*` requieren header:

```
Authorization: Bearer <token>
```

### Autenticación

| Método | Ruta                   | Descripción                                        |
|--------|------------------------|----------------------------------------------------|
| POST   | `/api/auth/login`      | Login. Body: `{ email, password }` → `{ token, nombre }` |
| POST   | `/api/auth/register`   | Registro de nuevo usuario                          |

### Paquetes

| Método | Ruta                              | Descripción                                                    |
|--------|-----------------------------------|----------------------------------------------------------------|
| GET    | `/api/paquetes`                   | Lista paginada. Query: `pagina`, `limite`, `origen`, `salida`, `codigoBarras` |
| GET    | `/api/paquetes/estadisticas`      | Datos agrupados para gráficos (mismos filtros que la lista)    |
| GET    | `/api/paquetes/codigo/:codigo`    | Buscar por código de barras exacto                             |
| GET    | `/api/paquetes/:id`               | Obtener un paquete por ID                                      |
| POST   | `/api/paquetes`                   | Crear paquete. Body: `{ codigoBarras, fechaSalida, origen, salida }` |
| PUT    | `/api/paquetes/:id`               | Reemplazar todos los campos                                    |
| PATCH  | `/api/paquetes/:id`               | Actualizar campos parciales (`fechaSalida`, `origen`, `salida`) |
| DELETE | `/api/paquetes/:id`               | Eliminar un paquete                                            |

#### Respuesta de `/api/paquetes`

```json
{
  "datos": [...],
  "total": 2000,
  "pagina": 1,
  "limite": 50,
  "totalPaginas": 40
}
```

#### Respuesta de `/api/paquetes/estadisticas`

```json
{
  "porSalida": [{ "nombre": "GLS", "total": 254 }, ...],
  "porOrigen": [{ "nombre": "Cordoba", "total": 1012 }, ...],
  "porMes":    [{ "nombre": "2024-1", "total": 87 }, ...]
}
```

### Clientes

| Método | Ruta                          | Descripción                                              |
|--------|-------------------------------|----------------------------------------------------------|
| GET    | `/api/clientes`               | Lista todos los clientes                                 |
| GET    | `/api/clientes/:id`           | Obtener un cliente por ID                                |
| GET    | `/api/clientes/:id/paquetes`  | Paquetes de un cliente concreto                          |
| POST   | `/api/clientes`               | Crear cliente. Body: `{ nombre, email }`                 |
| PUT    | `/api/clientes/:id`           | Actualizar cliente                                       |
| DELETE | `/api/clientes/:id`           | Eliminar (falla con 400 si tiene paquetes asociados)     |

---

## Frontend

### Archivos

| Archivo      | Descripción                                      |
|--------------|--------------------------------------------------|
| `index.html` | Estructura HTML del dashboard                    |
| `login.html` | Página de login                                  |
| `styles.css` | Estilos con variables CSS para claro/oscuro      |
| `app.js`     | Toda la lógica JavaScript                        |

### Funcionalidades

- **Autenticación** con JWT almacenado en `localStorage`
- **Tabla paginada** con filtros por origen, salida (empresa) y código de barras
- **Tiempo real** — todos los filtros actualizan tabla y gráficos con debounce de 300ms
- **3 gráficos generales:** dona por salida · barras por origen · línea por mes
- **Gráficos por empresa** — al filtrar por cliente se muestran 2 gráficos con sus colores corporativos: evolución mensual + Córdoba vs Sevilla
- **Modal de edición** — permite cambiar `fechaSalida`, `origen` y `salida`
- **Modal de confirmación** antes de eliminar
- **Modo claro/oscuro** — botón ☀️/🌙, preferencia guardada en `localStorage`

### Variables CSS principales

```css
:root {
  --bg:         #0f0f13;
  --bg-card:    #17171e;
  --bg-input:   #1e1e28;
  --border:     #2a2a38;
  --text:       #e8e8f0;
  --text-muted: #6b6b80;
  --accent:     #6c63ff;   /* morado */
  --accent2:    #ff6584;   /* rosa */
  --accent3:    #43e97b;   /* verde */
}
```

---

## Colores corporativos

Usados en los gráficos al filtrar por empresa:

| Empresa   | Primario              | Secundario            |
|-----------|-----------------------|-----------------------|
| GLS       | `#FFD100` amarillo    | `#1D3C87` azul        |
| SEUR      | `#FFCC00` amarillo    | `#E30613` rojo        |
| MRW       | `#E30613` rojo        | `#FFD100` amarillo    |
| Correos   | `#FFCC00` amarillo    | `#004B8D` azul        |
| DHL       | `#FFCC00` amarillo    | `#D40511` rojo        |
| UPS       | `#351C15` marrón      | `#FFB500` dorado      |
| FedEx     | `#4D148C` morado      | `#FF6600` naranja     |
| Nacex     | `#FFDD00` amarillo    | `#0055A5` azul        |

---

## Docker

### Levantar el proyecto

```powershell
# primera vez o tras cambios
docker-compose down -v
docker-compose up --build

# si Node arranca antes que MySQL
docker restart app_node
```

### Comandos útiles

```powershell
docker logs app_node          # logs del backend
docker logs app_mysql         # logs de MySQL
docker logs app_front         # logs de nginx

# acceder a MySQL directamente
docker exec -it app_mysql mysql -uroot -proot paquetes_db
```

### Acceso

| Servicio  | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:5173            |
| Backend   | http://localhost:3000/api        |
| MySQL     | localhost:3306                   |

### Credenciales de prueba

```
Email:    admin@admin.com
Password: admin123
```

---

## Variables de entorno

| Variable              | Valor                                  |
|-----------------------|----------------------------------------|
| `MYSQL_ROOT_PASSWORD` | `root`                                 |
| `MYSQL_DATABASE`      | `paquetes_db`                          |
| `JWT_SECRET`          | `clave_secreta_cambiar_en_produccion`  |

---

## Problemas conocidos

### Node arranca antes que MySQL

**Error:** `ECONNREFUSED 172.x.x.x:3306`  
**Solución:**
```powershell
docker restart app_node
```

### Frontend no carga en puerto 5173

**Causa:** nginx escucha en el puerto 80 interno, no en el 5173.  
**Solución:** en `docker-compose.yml` el mapeo debe ser `5173:80`, no `5173:5173`.

### Funciones no definidas (`hacerLogin is not defined`)

**Causa:** usar `<script type="module">` hace que las funciones no sean globales y no se puedan llamar desde `onclick`.  
**Solución:** usar `<script>` sin `type="module"`.

### Gráficos muestran solo datos de la primera página

**Causa:** los gráficos se construían con los datos de la tabla (50 registros), no con todos.  
**Solución:** endpoint dedicado `GET /api/paquetes/estadisticas` que hace `GROUP BY` directamente en MySQL.

---

*PaqTrack — Documentación generada automáticamente*
