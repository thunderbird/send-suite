FROM node:20.10.0

ADD package.json pnpm-lock.yaml /app/
ADD public /app/public
ADD scripts /app/scripts
ADD src /app/src
RUN npm install -g pnpm && cd /app && pnpm install

WORKDIR /app
CMD ["pnpm", "run", "dev"]