FROM node:latest

WORKDIR /app

COPY package.json ./
COPY scripts/ ./scripts/

CMD ["node", "--expose-gc", "scripts/run_all.mjs"]
