FROM node:12-alpine

WORKDIR /app

RUN apk add --update --no-cache python3 build-base bluez bluez-dev libc6-compat

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . ./

COPY src ./src/

RUN npm run-script build

ENTRYPOINT [ "node", "./build/index.js" ]
