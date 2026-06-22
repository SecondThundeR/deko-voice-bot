import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/main.ts"],
    target: "node22",
    sourcemap: true,
    minify: true,
    dts: false,
});
