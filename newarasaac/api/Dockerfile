FROM node:8.11.1

LABEL maintainer="juandacorreo@gmail.com"

ENV NODE_ENV=development 
ENV PORT=80

# Set working directory
RUN mkdir /app
RUN mkdir /app/dist
WORKDIR /app
ENV HOME=/app

# Install dependencies
COPY dist $HOME/dist
COPY package.json package-lock.json $HOME/
RUN npm install

EXPOSE $PORT
