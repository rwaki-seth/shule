FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY public ./public
COPY README.md DEPLOYMENT.md ./

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV SHULE_DB_PATH=/data/shule-db.json

RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]
