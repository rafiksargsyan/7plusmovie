FROM node:21

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build:prod

EXPOSE 3000

CMD ["npm", "start"]