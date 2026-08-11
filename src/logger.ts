import { pino } from "pino";

import { config } from "./config.ts";

export const logger = pino({
    level: config.logLevel,
    transport: {
        targets: [
            ...(config.logFormat === "pretty"
                ? [
                      {
                          target: "pino-pretty",
                          level: config.logLevel,
                          options: {
                              ignore: "pid,hostname,requestId,updateId,updateType",
                              colorize:
                                  config.logColorize ?? process.stdout.isTTY,
                              errorLikeObjectKeys: ["error"],
                              levelFirst: true,
                              messageFormat:
                                  "{if requestId}[http #{requestId}] {end}{if updateType}[{updateType} #{updateId}] {end}{msg}",
                              singleLine: true,
                              translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                          },
                      },
                  ]
                : [
                      {
                          target: "pino/file",
                          level: config.logLevel,
                          options: {},
                      },
                  ]),
        ],
    },
});

export type Logger = typeof logger;
