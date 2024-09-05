# FROM node:20.10.0
#
# # Set the working directory within the container
# # owned by an unprivileged user
# ARG UID=1000
# ARG GID=1000
# RUN \
#   usermod --uid ${UID} node && groupmod --gid ${GID} node &&\
#   mkdir app && chown node:node /app
# WORKDIR /app
#
# # As root, install `pnpm` globally
# RUN npm install -g pnpm
#
# # Run subsequent steps as unprivileged user
# USER node
# COPY --chown=node:node package.json pnpm-lock.yaml ./
# RUN pnpm install
#
# CMD ["/bin/sh", "./scripts/entry.sh"]

FROM node:20.10.0

WORKDIR /app
ADD .env.sample ./.env
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

# Debug
RUN apt update -y && apt install -y postgresql net-tools telnet

CMD ["/bin/sh", "/app/scripts/entry.sh"]