FROM node:20.10.0

WORKDIR /app
ADD .env.sample ./.env
ADD .prettierignore \
    .prettierrc \
    eslint.config.mjs \
    package.json \
    pnpm-lock.yaml \
    tsconfig.json \
    vitest.config.js \
    ./
ADD prisma ./prisma
ADD public ./public
ADD scripts ./scripts
ADD src ./src

RUN npm install -g pnpm && \
    pnpm install && \
    chown -R node:node /app

CMD ["/bin/sh", "/app/scripts/entry.sh"]