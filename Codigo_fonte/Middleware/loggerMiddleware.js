import morgan from "morgan";
import { logger } from "../Logs/logger.js";

const stream = {
  write: (message) => logger.info(message.trim())
};

export const httpLogger = morgan(
  ":method :url :status :response-time ms",
  { stream }
);