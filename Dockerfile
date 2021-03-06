FROM node:8-alpine

RUN apk add --no-cache git

RUN addgroup ddk -g 1100 && adduser -D -u 1100 ddk -G ddk

RUN npm install --global grunt-cli@latest

RUN npm install --global bower@latest

USER ddk

WORKDIR /home/ddk

COPY ./package.json /home/ddk

RUN mkdir -p /home/ddk/public

COPY ./public/package.json /home/ddk/public

COPY ./public/bower.json /home/ddk/public

RUN npm install && \
    cd public && \
    bower install && \
    npm install
    
COPY --chown=ddk . /home/ddk

RUN cd public && grunt release

CMD ["npm", "start"]