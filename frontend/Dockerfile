FROM node:20.10.0

RUN npm install -g pnpm

WORKDIR /app

ADD ./src ./src
ADD ./.env ./.env
ADD ./package.json ./package.json
ADD ./pnpm-lock.yaml ./pnpm-lock.yaml
ADD ./tsconfig.json ./tsconfig.json
ADD ./scripts/entry.sh ./scripts/entry.sh
ADD public ./public
ADD index.extension.html ./index.extension.html
ADD index.html ./index.html
ADD index.management.html ./index.management.html
ADD postcss.config.js ./postcss.config.js
ADD tailwind.config.js ./tailwind.config.js
ADD vite.config.js ./vite.config.js
ADD vite.config.extension.js ./vite.config.extension.js
ADD vite.config.management.js ./vite.config.management.js

RUN pnpm install

CMD ["/bin/sh", "./scripts/entry.sh"]