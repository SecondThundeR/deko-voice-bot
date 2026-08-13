import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const limits = {
    entry: { raw: 400_000, gzip: 125_000 },
    chunk: { raw: 150_000, gzip: 50_000 },
};

const dist = path.resolve(import.meta.dirname, "../dist");
const manifest = JSON.parse(
    await readFile(path.join(dist, ".vite/manifest.json"), "utf8"),
);
const entry = Object.values(manifest).find((item) => item.isEntry);

if (!entry) throw new Error("Vite manifest does not contain an entry chunk");

const assetDirectory = path.join(dist, "assets");
const javascriptFiles = (await readdir(assetDirectory)).filter((file) =>
    file.endsWith(".js"),
);
const failures = [];

for (const file of javascriptFiles) {
    const contents = await readFile(path.join(assetDirectory, file));
    const sizes = {
        raw: contents.byteLength,
        gzip: gzipSync(contents).byteLength,
    };
    const kind = `assets/${file}` === entry.file ? "entry" : "chunk";
    const limit = limits[kind];
    const rawKb = (sizes.raw / 1_000).toFixed(1);
    const gzipKb = (sizes.gzip / 1_000).toFixed(1);

    console.log(`${kind.padEnd(5)} ${file}: ${rawKb} kB / ${gzipKb} kB gzip`);

    if (sizes.raw > limit.raw || sizes.gzip > limit.gzip) {
        failures.push(
            `${file} exceeds the ${kind} budget (${limit.raw / 1_000} kB / ${limit.gzip / 1_000} kB gzip)`,
        );
    }
}

if (failures.length > 0) {
    throw new Error(failures.join("\n"));
}
