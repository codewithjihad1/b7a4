import pino from "pino";
import { env } from "../config/env.js";

const options: pino.LoggerOptions = {
    level: env.NODE_ENV === "production" ? "info" : "debug",
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};

if (env.NODE_ENV !== "production") {
    options.transport = {
        target: "pino/file",
        options: { destination: 1 },
    };
}

const logger = pino(options);

export { logger };
