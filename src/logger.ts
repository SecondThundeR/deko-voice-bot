import { pino } from "pino";

import { config } from "./config.ts";

export const logger =
    config.logFormat === "pretty"
        ? pino({
              level: config.logLevel,
              transport: {
                  target: "pino-pretty",
                  options: {
                      ignore: "pid,hostname,requestId,updateId,updateType",
                      colorize: config.logColorize ?? process.stdout.isTTY,
                      errorLikeObjectKeys: ["error"],
                      levelFirst: true,
                      messageFormat:
                          "{if requestId}[http #{requestId}] {end}{if updateType}[{updateType} #{updateId}] {end}{msg}",
                      singleLine: true,
                      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                  },
              },
          })
        : pino({ level: config.logLevel });

export type Logger = typeof logger;
