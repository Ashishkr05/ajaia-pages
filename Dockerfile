FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs ./
COPY src ./src
COPY public ./public
RUN mkdir -p /app/data && chown -R node:node /app
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
