"use strict";

const mongoose = require("mongoose");
const MONGO_DB_USER = process.env.MONGO_DB_USER;
const MONGO_DB_PWD = process.env.MONGO_DB_PWD;
const databaseUrl = `mongodb://${MONGO_DB_USER}:${MONGO_DB_PWD}@mongodb/arasaac?authSource=admin`;
mongoose.connect(databaseUrl);
mongoose.connection.on("connected", () =>
  console.log("Connected to database: " + databaseUrl)
);
mongoose.connection.on("error", err =>
  console.log("Database connection error: " + err)
);
mongoose.connection.on("disconnected", () =>
  console.log("Disconnected from database")
);

process.on("SIGINT", () =>
  mongoose.connection.close(() => {
    console.log("Finished App and disconnected from database");
    process.exit(0);
  })
);

exports.accessTokens = require("./accesstokens");
exports.authorizationCodes = require("./authorizationcodes");
exports.clients = require("./clients");
exports.refreshTokens = require("./refreshtokens");
exports.users = require("./users");
