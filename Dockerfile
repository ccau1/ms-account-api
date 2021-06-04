FROM node:12.17-alpine as development

WORKDIR /usr/src/app

RUN apk add --no-cache bash coreutils grep sed

COPY package.json .

COPY yarn.lock .

RUN yarn i

CMD ["yarn", "start:debug"]

FROM node:12.17-alpine as production-builder

WORKDIR /usr/src/app

COPY package.json .

COPY yarn.lock .

RUN yarn i --only=prod

COPY . .

RUN yarn build

FROM node:12.17-alpine as production

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY --from=production-builder /usr/src/app/node_modules ./node_modules
COPY --from=production-builder /usr/src/app/dist ./dist

CMD ["node", "dist/main"]