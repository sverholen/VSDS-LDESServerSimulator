# build environment
FROM node:18 AS builder
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run build

# run environment
FROM node:18.2.0-alpine3.15
WORKDIR /usr/vsds/simulator
## setup to run as less-privileged user
COPY --chown=node:node --from=builder /build/package*.json .
COPY --chown=node:node --from=builder /build/dist .
COPY --chown=node:node --from=builder /build/data ./data
## install dependancies
ENV NODE_ENV production
RUN npm ci --omit=dev
## install signal-handler wrapper
RUN apk add dumb-init
## allow passing variables
ARG SEED=
ENV SEED=${SEED}
ARG BASEURL=http://localhost
ENV BASEURL=${BASEURL}
## set start command
EXPOSE 80
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
USER node
CMD ["sh", "-c", "node server.js --seed=${SEED} --baseUrl=${BASEURL} --host=0.0.0.0 --port=80"]
