FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY .env ./
COPY .env.express ./
COPY .env.mariadb ./
COPY src ./src
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "runAPI"]

