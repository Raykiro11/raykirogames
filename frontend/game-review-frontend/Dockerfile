# Usar imagem oficial Node
FROM node:18-alpine AS build

WORKDIR /app

# Copiar apenas arquivos de dependências primeiro (para cache otimizado)
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build do Vite)
RUN npm ci --include=dev

# Copiar todo o código
COPY . .

# Garantir que o vite seja executável
RUN chmod +x node_modules/.bin/vite

# Rodar build do Vite
RUN npm run build

# ------------------------
# Servidor final (Nginx)
# ------------------------
FROM nginx:alpine

# Copiar build para a pasta padrão do nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
