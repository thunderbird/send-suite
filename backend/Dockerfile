FROM node:20.10.0

# Set the working directory within the container
# owned by an unprivileged user
ARG UID=1000
ARG GID=1000
RUN \
  usermod --uid ${UID} node && groupmod --gid ${GID} node &&\
  mkdir app && chown node:node /app
WORKDIR /app

# As root, install `pnpm` globally
RUN npm install -g pnpm

# Install Bun from npm as root
RUN npm install -g bun

# Run subsequent steps as unprivileged user
USER node
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install

CMD ["/bin/sh", "./scripts/dev-entry.sh"]
