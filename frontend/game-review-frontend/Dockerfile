# ---- Etapa de build ----
FROM node:18-alpine AS build

WORKDIR /app

# Copiar arquivos de dependências para cache
COPY package*.json ./

# Instalar todas as dependências, incluindo devDependencies (Vite precisa)
RUN npm ci --include=dev

# Copiar todo o código
COPY . .

# Garantir que o vite seja executável
RUN chmod +x node_modules/.bin/vite

# Rodar build do Vite
RUN npm run build

# ---- Etapa de produção com Nginx ----
FROM nginx:alpine

# Copiar build do frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Rodar Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]