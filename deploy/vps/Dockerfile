FROM node:20-alpine
WORKDIR /app/shadow-corpus/archive/demo-v0.2

COPY shadow-corpus/archive/demo-v0.2/package.json shadow-corpus/archive/demo-v0.2/package-lock.json ./
RUN npm ci --omit=dev

COPY shadow-corpus/archive/demo-v0.2/ ./
COPY docs /app/docs

ENV PORT=3010
ENV HOST=0.0.0.0
EXPOSE 3010

CMD ["node", "server.js"]
