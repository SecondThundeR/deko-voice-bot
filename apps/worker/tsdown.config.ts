import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts"],
    target: "node24",
    deps: {
        alwaysBundle: [/^@deko-voice-bot\//],
        onlyBundle: false,
    },
    sourcemap: true,
    minify: true,
    dts: false,
});
