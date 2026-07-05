FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/fitnesspal.db

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["npm", "start"]
