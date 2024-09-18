FROM node:20.10.0

RUN apt update -y && apt upgrade -y

WORKDIR /app
ADD .env.sendbackend ./.env
ADD package.json \
    pnpm-lock.yaml \
    tsconfig.json \
    ./
ADD prisma ./prisma
ADD public ./public
ADD scripts ./scripts
ADD src ./src

RUN npm install -g pnpm && \
    pnpm install && \
    chown -R node:node /app

CMD ["/bin/sh", "/app/scripts/entry.sh"]