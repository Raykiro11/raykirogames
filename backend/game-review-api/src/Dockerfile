FROM python:3.9-slim-buster

WORKDIR /app

# Adicione um argumento para invalidar o cache (mude o número para forçar novo build)
ARG CACHE_BUSTER=2

# Copia o requirements.txt e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação
COPY main.py .

# Variáveis de ambiente para o Flask
ENV FLASK_APP=main.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

EXPOSE 5000

# Comando para iniciar a aplicação com Waitress
CMD ["waitress-serve", "--listen=0.0.0.0:5000", "main:app"]