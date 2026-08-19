import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import {
    BACKUP_FORMAT_VERSION,
    CURRENT_SCHEMA_VERSION,
    packBackup,
    unpackBackup,
} from "./manifest.ts";

const tempDirectories: string[] = [];

async function paths() {
    const directory = await mkdtemp(join(tmpdir(), "deko-manifest-test-"));
    tempDirectories.push(directory);
    return {
        dump: join(directory, "input.dump"),
        legacy: join(directory, "legacy.dump"),
        output: join(directory, "output.dump"),
        package: join(directory, "backup.package"),
    };
}

afterEach(async () => {
    await Promise.all(
        tempDirectories
            .splice(0)
            .map((directory) =>
                rm(directory, { recursive: true, force: true }),
            ),
    );
});

describe("backup manifest", () => {
    it("round-trips a dump and authenticates the current format metadata", async () => {
        const target = await paths();
        const dump = Buffer.from("custom PostgreSQL dump bytes");
        await writeFile(target.dump, dump);

        await packBackup(target.dump, target.package);
        const manifest = await unpackBackup(target.package, target.output);

        assert.equal(manifest.formatVersion, BACKUP_FORMAT_VERSION);
        assert.equal(manifest.schemaVersion, CURRENT_SCHEMA_VERSION);
        assert.deepEqual(await readFile(target.output), dump);
    });

    it("rejects legacy dumps without a versioned manifest", async () => {
        const target = await paths();
        await writeFile(target.legacy, "legacy dump");

        await assert.rejects(unpackBackup(target.legacy, target.output), {
            code: "BACKUP_SCHEMA_MISMATCH",
        });
    });

    it("keeps backups from the immediately preceding schema restorable", async () => {
        const target = await paths();
        await writeFile(target.dump, "previous schema dump");
        await packBackup(target.dump, target.package);

        const packageBytes = await readFile(target.package);
        const magicLength = Buffer.byteLength("DEKOPKG2");
        const headerLength = magicLength + 4;
        const manifestLength = packageBytes.readUInt32BE(magicLength);
        const manifest = JSON.parse(
            packageBytes
                .subarray(headerLength, headerLength + manifestLength)
                .toString("utf8"),
        );
        manifest.schemaVersion = "0016_runtime_inbox_and_invariants";

        const encodedManifest = Buffer.from(JSON.stringify(manifest), "utf8");
        const header = Buffer.alloc(headerLength);
        packageBytes.copy(header, 0, 0, magicLength);
        header.writeUInt32BE(encodedManifest.length, magicLength);
        await writeFile(
            target.package,
            Buffer.concat([
                header,
                encodedManifest,
                packageBytes.subarray(headerLength + manifestLength),
            ]),
        );

        const restoredManifest = await unpackBackup(
            target.package,
            target.output,
        );
        assert.equal(
            restoredManifest.schemaVersion,
            "0016_runtime_inbox_and_invariants",
        );
        assert.equal(
            await readFile(target.output, "utf8"),
            "previous schema dump",
        );
    });
});
