FROM node:20.10.0

ADD package.json pnpm-lock.yaml /app/
ADD prisma /app/prisma
ADD public /app/public
ADD scripts /app/scripts
ADD src /app/src

RUN npm install -g pnpm && cd /app && pnpm install && chown -R node:node /app

WORKDIR /app
CMD ["/bin/sh", "/app/scripts/entry.sh"]