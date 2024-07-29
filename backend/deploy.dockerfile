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

# Run subsequent steps as unprivileged user
USER node

# Copy needed files
COPY --chown=node:node package.json pnpm-lock.yaml ./
# TODO: be specific
COPY --chown=node:node . .

RUN pnpm install


EXPOSE 8080
# TODO: remove once we have a staging db
EXPOSE 5555
# TODO: write prod-entry.sh
CMD ["/bin/sh", "./scripts/dev-entry.sh"]
#CMD ["tail", "-f", "/dev/null"]
