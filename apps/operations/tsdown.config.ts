import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/main.ts"],
    target: "node24",
    sourcemap: true,
    minify: true,
    dts: false,
    deps: {
        alwaysBundle: [
            "@deko-voice-bot/backup",
            "@deko-voice-bot/operations-contract",
            "@deko-voice-bot/shared",
        ],
    },
    outputOptions: {
        dir: "dist",
    },
});
