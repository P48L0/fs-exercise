FROM node:8.9-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app

COPY package.json .
RUN npm install --production
COPY ./src .
EXPOSE 8888
CMD node index.js