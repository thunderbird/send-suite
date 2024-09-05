FROM node:20.10.0

RUN npm install -g pnpm

WORKDIR /app

ADD ./src ./src
ADD ./prisma ./prisma
ADD ./.env ./.env
ADD ./package.json ./package.json
ADD ./pnpm-lock.yaml ./pnpm-lock.yaml
ADD ./tsconfig.json ./tsconfig.json
ADD ./scripts/entry.sh ./scripts/entry.sh

RUN pnpm install

CMD ["/bin/sh", "./scripts/entry.sh"]