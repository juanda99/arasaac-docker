FROM node:8.11.1

LABEL maintainer="juandacorreo@gmail.com"

ENV NODE_ENV=development 
ENV PORT=80

# Set working directory
RUN mkdir /app
WORKDIR /app
ENV HOME=/app

# set locale
RUN apt-get update && apt-get install -y \
  locales \ 
  locales-all \
  && rm -rf /var/lib/apt/lists/*
ENV LC_ALL es_ES.UTF-8
ENV LANG es_ES.UTF-8
ENV LANGUAGE es_ES.UTF-8


# Install dependencies
COPY package.json package-lock.json $HOME/
RUN npm install
RUN npm install pm2 -g

EXPOSE $PORT
