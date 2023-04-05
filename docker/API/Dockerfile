FROM alpine:latest
RUN apk update
RUN apk add git
FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY .env ./
COPY .env.express ./
COPY .env.mariadb ./
COPY src ./src
COPY tests/integration_tests/test_packages ./tests/integration_tests/test_packages
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "runAPI"]

