FROM node:lts-alpine

# Set the working directory within the container
RUN mkdir app
WORKDIR /app

EXPOSE 5173

CMD ["/bin/sh", "./scripts/dev-entry.sh"]