FROM node:20-slim

WORKDIR /app

# Copia os arquivos de dependências primeiro (aproveita cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copia o resto
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]