FROM node:8.2.1

LABEL maintainer="juandacorreo@gmail.com"

ENV PORT=80

# Set working directory
RUN mkdir /app
WORKDIR /app
ENV HOME=/app

# Install dependencies
COPY package.json package-lock.json $HOME/
RUN npm install
# RUN npm run build

EXPOSE $PORT
