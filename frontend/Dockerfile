FROM node:lts-alpine

# Set the working directory within the container
RUN mkdir app
WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["/bin/sh", "./scripts/dev-entry.sh"]