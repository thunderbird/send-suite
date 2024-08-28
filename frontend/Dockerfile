FROM node:20.10.0

COPY package.json pnpm-lock.yaml /app/
COPY public /app/public
COPY scripts /app/scripts
COPY src /app/src
RUN npm install -g pnpm && cd /app && pnpm install

WORKDIR /app
CMD ["pnpm", "run", "dev"]