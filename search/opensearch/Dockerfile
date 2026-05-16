FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build || true

CMD ["npx", "ts-node", "index.ts"]
