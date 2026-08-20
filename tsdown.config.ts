import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/main.ts", "src/backup-cron.ts"],
    target: "node24",
    sourcemap: true,
    minify: true,
    dts: false,
});
