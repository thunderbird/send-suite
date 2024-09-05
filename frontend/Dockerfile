FROM node:20.10.0

WORKDIR /app
ADD package.json \
    pnpm-lock.yaml \
    tsconfig.json \
    index.extension.html \
    index.html \
    index.management.html \
    postcss.config.js \
    tailwind.config.js \
    vite.config.js \
    vite.config.extension.js \
    vite.config.management.js \
    ./
ADD public ./public
ADD scripts ./scripts
ADD src ./src

RUN npm install -g pnpm && pnpm install

CMD ["/bin/sh", "./scripts/entry.sh"]