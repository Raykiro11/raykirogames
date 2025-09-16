# ---- Etapa de build ----
FROM node:18-alpine AS build

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json primeiro (para cache de dependências)
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar todo o código para dentro do container
COPY . .

# Rodar build do Vite
RUN npm run build


# ---- Etapa de produção ----
FROM node:18-alpine

WORKDIR /app

# Instalar um servidor HTTP para servir os arquivos estáticos
RUN npm install -g serve

# Copiar build da etapa anterior
COPY --from=build /app/dist ./dist

# Expor porta usada pelo Railway
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["serve", "-s", "dist", "-l", "3000"]



