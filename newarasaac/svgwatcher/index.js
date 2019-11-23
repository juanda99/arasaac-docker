// load dependencies

const chokidar = require("chokidar");
const path = require("path");
const logger = require("./logger");
const createPNGFiles = require("./createPNGFiles");
const { preCompiledOptions } = require("./utils/svg");

// global
require("dotenv").config();

const INCLUDE_FILE = "include";
const EXCLUDE_FILE = "exclude";
const SVG_DIR = process.env.SVG_DIR || "/app/svg";
const usePolling = parseInt(process.env.CHOKIDAR_USEPOLLING) || 1;
const RESOLUTIONS = [300, 500, 2500];

// startup logs
logger.info("ARASAAC SVG-WATCHER STARTED");
logger.info(`Using folder: ${SVG_DIR}`);
logger.info(`Using resolutions: ${RESOLUTIONS}`);
RESOLUTIONS.forEach(resolution => {
  logger.info(
    `Image options for ${resolution}px: ${JSON.stringify(
      preCompiledOptions[resolution]
    )}`
  );
});

logger.info(`Start scanning....`);

// Init watcher
const watcher = chokidar.watch(`${SVG_DIR}/*.svg`, {
  ignoreInitial: true,
  // move to env variable, 0 for mac, 1 for server
  usePolling,
  cwd: SVG_DIR,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 50
  }
});

// Add event listeners.
watcher
  .on("add", file => {
    logger.info(`WATCHER - ADD FILE: ${path.resolve(SVG_DIR, file)}`);
    addTask(file, INCLUDE_FILE);
  })
  .on("change", file => {
    logger.info(`MODIFY FILE: ${path.resolve(SVG_DIR, file)}`);
    addTask(file, INCLUDE_FILE);
  })

  .on("unlink", file => {
    // generate new zip or remove screenshot
    logger.info(`WATCHER - REMOVED FILE: ${path.resolve(SVG_DIR, file)}`);
    addTask(file, EXCLUDE_FILE);
  })
  .on("error", error => logger.error(`WATCHER ERROR: ${error.message}`))
  .on("ready", () => logger.info("Initial scan complete, waiting for changes"));

const addTask = (file, operation) => {
  if (operation === INCLUDE_FILE) {
    // resize just when size is bigger than 1500
    RESOLUTIONS.forEach(resolution => createPNGFiles(file, resolution));
  }
};
