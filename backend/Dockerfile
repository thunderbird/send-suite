FROM node:lts-alpine

# Set the working directory within the container
RUN mkdir app
WORKDIR /app

EXPOSE 8080

CMD ["/bin/sh", "./scripts/dev-entry.sh"]