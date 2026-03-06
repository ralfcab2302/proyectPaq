# ── Stage 1: build ──────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: serve con nginx ─────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist/paqtrack-angular/browser /usr/share/nginx/html

# nginx config para que Angular Router funcione (rutas como /paquete/ABC123)
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
