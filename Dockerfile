FROM node:latest

WORKDIR /app

RUN npm i -g @nestjs/cli

CMD ["/bin/sh"]