import winston from "winston";
import path from "path";

const logDir = "logs";

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
  },
};

winston.addColors(customLevels.colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info as {
      timestamp: string;
      level: string;
      message: string;
      [key: string]: any;
    };

    const ts = timestamp.slice(0, 19).replace("T", " ");

    return `${ts} [${level}]: ${message} ${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
    }`;
  }),
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format,
    ),
  }),

  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    format,
  }),

  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    format,
  }),
];

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: customLevels.levels,
  format,
  transports,
});

export default logger;
