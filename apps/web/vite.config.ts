import path from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    return {
        plugins: [
            react(),
            babel({ presets: [reactCompilerPreset()] }),
            tailwindcss(),
        ],
        resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
        server: {
            allowedHosts: [".trycloudflare.com"],
            port: Number(env.PORT) || 3001,
            proxy: {
                "/api": {
                    target: env.API_URL || "http://localhost:3000",
                    changeOrigin: true,
                },
            },
        },
    };
});
