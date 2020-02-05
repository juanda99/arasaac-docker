// load dependencies
var chokidar = require("chokidar");
var fs = require("fs-extra");
var path = require("path");
const uuidv4 = require("uuid/v4");
var recursive = require("recursive-readdir");
var tar = require("tar");
const _ = require("lodash");
var sharp = require("sharp");
const logger = require("./logger");

// load environment
require("dotenv").config();

// global variables and constants
var materialFiles = {};
var localePattern = /^[A-z]{2,3}$/g;
const INCLUDE_FILE = "include";
const EXCLUDE_FILE = "exclude";
const INCLUDE_DIR = "includedir";
const EXCLUDE_DIR = "excludedir";
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || "screenshots";
const MATERIALS = process.env.MATERIALS || "/app/materials";
const RESOLUTION = process.env.RESOLUTION || 300;
const NODE_ENV = process.env.NODE_ENV || "development";
const usePolling = parseInt(process.env.CHOKIDAR_USEPOLLING) || 1;
const TIME = process.env.TIME || 3000;

logger.info("ARASAAC WATCHER STARTED");
logger.info(
  `It will wait ${parseInt(TIME) /
  1000} seconds on every material before starting processing it`
);
logger.info(`Using folder: ${MATERIALS}`);
logger.info(`Start scanning....`);

// Initialize watcher.
var watcher = chokidar.watch(MATERIALS, {
  // ignored: [
  //   /(^|[\/\\])\../,
  //   "**/screenshots_*/*",
  //   /index-[A-z]{2,3}-(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}.tgz/
  // ],
  ignoreInitial: true,
  cwd: MATERIALS,
  // move to env variable, 0 for mac, 1 for server
  usePolling,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 300
  }
});

// Add event listeners.
watcher
  .on("add", file => {
    logger.info(`WATCHER - ADDED FILE: ${path.resolve(MATERIALS, file)}`);
    addTask(file, INCLUDE_FILE);
  })

  .on("addDir", dir => {
    // only task is to push dir into targetLanguages field if it's a language dir
    logger.info(`WATCHER - ADDED DIRECTORY: ${path.resolve(MATERIALS, dir)}`);
    addTask(dir, INCLUDE_DIR);
  })

  .on("change", file => {
    // generate new zip or resize screenshot (same as add task)
    logger.info(`WATCHER - CHANGED FILE: ${path.resolve(MATERIALS, file)}`);
    addTask(file, INCLUDE_FILE);
  })

  .on("unlinkDir", dir => {
    logger.info(`WATCHER - REMOVED DIRECTORY: ${path.resolve(MATERIALS, dir)}`);
    addTask(dir, EXCLUDE_DIR);
  })

  .on("unlink", file => {
    // generate new zip or remove screenshot
    logger.info(`WATCHER - REMOVED FILE: ${path.resolve(MATERIALS, file)}`);
    addTask(file, EXCLUDE_FILE);
  })

  .on("error", error => logger.error(`WATCHER ERROR: ${error}`))
  .on("ready", () => logger.info("Initial scan complete, waiting for changes"));



const addTask = (file, operation) => {

  switch (operation) {
    case INCLUDE_DIR:
      {
        const materialId = !isNaN(file) ? file : path.dirname(file).split(path.sep)[0];
        // check if dir is materialId
        if (materialId === file) {
          logger.info(`ADD NEW MATERIAL ${materialId}`);
        } else {
          // check if file is a language forlder
          const relativeDir = path.basename(file)
          if (file.match(/^[0-9]+\/[A-z]{2,3}$/)) {
            logger.info(`ADD LANGUAGE: ${relativeDir} for material ${materialId}`);
            // check if file is related to screenshots folders
          } else if ((file.match(/^[0-9]+\/screenshots$/)) || (file.match(/^[0-9]+\/screenshots\/[A-z]{2,3}$/))) {
            logger.info(`Screenshots directory ${file} added, but not executing any action, waiting for screenshots!`);
            // directories for lim, jclic.... should put also zip file to take it into account
          } else {
            logger.info(`Directory ${file} added, but not executing any action!`);
          }
        }
      }
      break;
    case EXCLUDE_DIR:
      {
        const materialId = !isNaN(file) ? file : path.dirname(file).split(path.sep)[0];
        // check if dir is materialId
        if (materialId === file) {
          logger.info(`REMOVE MATERIAL ${materialId}`);
        } else {
          // check if file is a language folder
          const relativeDir = path.basename(file)
          if (file.match(/^[0-9]+\/[A-z]{2,3}$/)) {
            logger.info(`REMOVE LANGUAGE: ${relativeDir} from material ${materialId}, generating new material zip files...`);
            debouncedSync({ materialId });
            // check if file is related to screenshots folders
          } else if ((file.match(/^[0-9]+\/screenshots$/)) || (file.match(/^[0-9]+\/screenshots\/[A-z]{2,3}$/))) {
            const dirToRemove = file.replace("screenshots", `screenshots_${RESOLUTION}`);
            // delete the file from screenshots)
            fs.remove(path.resolve(MATERIALS, dirToRemove), err => {
              if (err) logger.error(`ERROR REMOVE ${dirToRemove}: ${err}`);
              else logger.info(`REMOVED DIRECTORY: ${dirToRemove}`);
            });
            return
            // directories for lim, jclic.... should put also zip file to take it into account
          } else {
            logger.info(`Directory ${file} removed, but not executing any action!`);
          }
        }
      }
      break;
    case INCLUDE_FILE:
      {
        const materialId = !isNaN(file) ? file : path.dirname(file).split(path.sep)[0];
        const dir = path.dirname(file);
        // check if file is inside materialId or inside a language forlder
        if (dir.match(/^[0-9]+$/) || dir.match(/^[0-9]+\/[A-z]{2,3}$/)) {
          logger.info(`ADD FILE: ${file}, generating new material zip files...`);
          debouncedSync({ materialId });
          // check if file is related to screenshots folders
        } else if ((dir.match(/^[0-9]+\/screenshots$/)) || (dir.match(/^[0-9]+\/screenshots\/[A-z]{2,3}$/))) {
          resizeImage(file, RESOLUTION)
          // directories for lim, jclic.... should put also zip file to take it into account
        } else {
          logger.info(`File ${file} added, but not executing any action!`);
        }
      }
      break;
    case EXCLUDE_FILE:
      {
        const materialId = !isNaN(file) ? file : path.dirname(file).split(path.sep)[0];
        const dir = path.dirname(file);
        // check if file is inside materialId or inside a language forlder
        if (dir.match(/^[0-9]+$/) || dir.match(/^[0-9]+\/[A-z]{2,3}$/)) {
          logger.info(`REMOVE FILE: ${file}, generating new material zip file...`);
          debouncedSync({ materialId });
          // check if file is related to screenshots folders
        } else if ((dir.match(/^[0-9]+\/screenshots$/)) || (dir.match(/^[0-9]+\/screenshots\/[A-z]{2,3}$/))) {
          const fileToRemove = file.replace("screenshots", `screenshots_${RESOLUTION}`);
          fs.remove(path.resolve(MATERIALS, fileToRemove), err => {
            if (err) logger.error(`ERROR REMOVE ${fileToRemove}: ${err}`);
            else logger.info(`REMOVED FILE: ${fileToRemove}`);
          });
          // directories for lim, jclic.... should put also zip file to take it into account
        } else {
          logger.info(`File ${file} removed, but not executing any action!`);
        }
      }
      break;
    default:
      logger.info(`File/dir ${file} ${operation}, NOT EXECUTING ANY ACTION!!!!!!!`);
  }
};

// https://stackoverflow.com/questions/28787436/debounce-a-function-with-argument
var debouncedSync = _.wrap(
  _.memoize(() => _.debounce(generateFiles, (wait = 10000)), _.property("materialId")),
  (func, obj) => func(obj)(obj)
);

const generateFiles = async material => {
  const idMaterial = material.materialId
  logger.info(`GENERATING zip files for material ${idMaterial}...`)
  try {
    // get previous files and remove all of them:
    const zipFiles = await getZipFiles(idMaterial);
    await Promise.all(zipFiles.map((zipFile) => fs.remove(path.resolve(MATERIALS, idMaterial, zipFile))))

    // get all languages to generate new zip files:
    const languages = getLanguagesFromDir(path.resolve(MATERIALS, idMaterial))
    if (languages.length === 0) languages.push('xx')
    // case no language defined, we take a default one, called 'xx'
    languages.forEach(async language => {
      const newZip = path.resolve(
        MATERIALS,
        idMaterial,
        `index-${language}-${uuidv4()}.tgz`
      );
      let files = listFiles(path.resolve(MATERIALS, idMaterial));
      let copyFiles = language == "xx" ? [...files] : [...files, language];
      // if language doesn't exist (xx case) it throws an error
      tar.c(
        {
          gzip: true,
          sync: true,
          onwarn: prueba,
          file: newZip,
          cwd: path.resolve(MATERIALS, idMaterial)
        },
        copyFiles
      );
      logger.info(`ZIP GENERATED: ${newZip}`);
    });
  } catch (err) {
    logger.error(`Error executing debouncedSync for material ${idMaterial}: ${err}`);
  }
}

// function to get all languages from a directory
const getLanguagesFromDir = p =>
  fs
    .readdirSync(p)
    .filter(
      f => fs.statSync(path.join(p, f)).isDirectory() && f.match(/^[A-z]{2,3}$/)
    );


// list files, not directories, not tgz.
const listFiles = p =>
  fs.readdirSync(p).filter(f => {
    let filePattern = new RegExp(
      `^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$`,
      "i"
    );
    return !fs.statSync(path.join(p, f)).isDirectory() && !filePattern.test(f);
  });

const prueba = (message, data) => {
  console.log(message);
};

const resizeImage = (file, size) => {
  const extension = path.extname(file).toLowerCase();
  if (
    extension === ".png" ||
    extension === ".jpg" ||
    extension === ".jpeg" ||
    extension === ".gif"
  ) {
    const dir = path.resolve(MATERIALS, path.dirname(file));
    const newDir = dir.replace("screenshots", `screenshots_${size}`);
    fs.ensureDir(newDir)
      .then(() => {
        const fileName = path.basename(file);
        sharp(`${MATERIALS}/${file}`)
          .resize(null, parseInt(size))
          .toFile(`${newDir}/${fileName}`, function (err) {
            if (err) logger.error(`Error generating screenshotfile:${err}`);
            else logger.info(`GENERATE SCREENSHOT: ${newDir}/${fileName}`);
          });
      })
      .catch(err => {
        logger.error(`Error creating dir for screenshots: ${err}`);
      });
  }
};

const getZipFiles = materialId => {
  const filePattern = new RegExp(
    `^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$`,
    "i"
  );
  const files = fs.readdirSync(path.resolve(MATERIALS, materialId));
  return files.filter(file => filePattern.test(file));
};

const getZipFile = (language, zipFiles) => {
  try {
    const filePattern = new RegExp(
      `^index-${language}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$`,
      "i"
    );
    return zipFiles.filter(file => filePattern.test(file));
  } catch (error) {
    logger.error(`getZipFile ${error.message}`);
  }
};

