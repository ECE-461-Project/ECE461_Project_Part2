FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY .env.express ./
COPY .env.database.gcp ./.env.database
COPY src ./src
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "runAPIStatic"]

