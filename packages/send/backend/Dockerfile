FROM node:22.14.0

RUN apt update -y && apt upgrade -y

WORKDIR /app
ADD package.json \
    pnpm-lock.yaml \
    tsconfig.json \
    ./
ADD prisma ./prisma
ADD public ./public
ADD scripts ./scripts
ADD src ./src

RUN npm install -g pnpm && \
    pnpm install --no-frozen-lockfile && \
    chown -R node:node /app

CMD ["/bin/sh", "/app/scripts/entry.sh"]