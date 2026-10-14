# Reliability and recovery checklist

The production design remains one bot replica, PostgreSQL, and the nightly backup cron. This checklist covers the small reliability pass; it does not require additional services.

## Verify the deployed release

After deploying the restore-safety change:

- Confirm the expected commit is active and startup reports database connectivity and webhook registration.
- Inspect any subsequent `Update processing failed` or `Unexpected HTTP request failure` events. Current source emits these at error level with sanitized error details. Record the timestamp, update/request ID and error cause; do not publish personal data or credentials.
- Confirm the configured log level includes errors. `USE_DEBUG` controls additional diagnostic metadata; it does not itself enable the Node inspector. Investigate the reported inspector using actual launch options separately.
- Keep sleep configuration unchanged unless slow first responses are a user problem. If disabling sleep, compare latency, cold-start counts and cost over a similar traffic period.

## Behavior after an import failure

Failures before database disconnection/restoration, such as emergency backup creation or delivery, release the temporary traffic gate because the database has not been altered.

Once database work begins, traffic resumes only after restoration, normalization, reconnection, validation and session cleanup complete. Failure in those steps keeps all bot traffic blocked, including administrator commands and further imports. The error log includes `databaseTrafficBlocked: true`, and the importing administrator receives recovery instructions if Telegram delivery succeeds. Failure to send the final success notice does not keep a validated database blocked.

The block lives in process memory. **A restart, redeploy or platform wake-up after process termination clears it.** This is a containment measure within the running process, not a persistent recovery lock. Avoid automatic/manual restarts during recovery; stop the service through Railway if needed to prevent it from accepting traffic while the database is uncertain.

Recovery procedure:

1. Preserve the emergency `pre-import` backup document, the source backup, operation ID and sanitized failure logs.
2. Keep the bot stopped or blocked. Use PostgreSQL administration tools outside the bot to inspect the database and, if necessary, restore the emergency backup.
3. Check the required tables and constraints with `validateRestoredDatabase`, then verify application-specific data and relationships. This structural validator alone does not prove data correctness.
4. Restart only after the database is confirmed usable. Test inline search/delivery, `/voices`, `/mydata`, favorites and statistics. Check the restored maintenance flag; turn maintenance off deliberately when ready.

`pg_restore` uses one transaction, but normalization and validation happen afterwards. Do not assume every failed import left the original database intact.

## First isolated restore drill

This drill has **not been performed**. It requires a recent backup document, the matching encryption key, and a disposable PostgreSQL database completely separate from production. Do not use the bot's production `/import` command for a drill.

Prerequisites:

- Download a recent `.dump.enc` document from the private backup chat. Keep the file and decrypted contents private.
- Supply `BACKUP_ENCRYPTION_KEY` through a private environment/secret mechanism. Do not paste it into reports or commands that reveal its value.
- Create an empty, disposable PostgreSQL instance, preferably matching the production major version, with permissions to install `pg_trgm`.
- Supply its URL as `TARGET_DATABASE_URL`; independently verify its host and database are the disposable target. The restoration below replaces objects in its `public` schema.
- Install compatible PostgreSQL client tools. Record the source backup date/hash and the drill start time.

From the repository root, decrypt to the manifest package:

```sh
node ./scripts/backup-crypto.ts decrypt ./backup.dump.enc ./backup.package
```

Decryption produces a package, not a raw PostgreSQL dump. Unpack and validate it before restoring to the disposable target:

```sh
node --input-type=module <<'JS'
import { unpackBackup } from './src/backup/manifest.ts';
import {
    validateDatabaseDump,
    restoreDatabaseDump,
    normalizeRestoredDatabase,
    validateRestoredDatabase,
} from './src/backup/database.ts';

const target = process.env.TARGET_DATABASE_URL;
if (!target) throw new Error('TARGET_DATABASE_URL is required');
if (target === process.env.DATABASE_URL) {
    throw new Error('The target must be separate from the application database');
}
// Equality is only a basic guard; verify the destination independently.
const started = performance.now();
const manifest = await unpackBackup('./backup.package', './backup.dump');
await validateDatabaseDump('./backup.dump');
await restoreDatabaseDump(target, './backup.dump');
await normalizeRestoredDatabase(target);
await validateRestoredDatabase(target);
console.log({ manifest, elapsedSeconds: (performance.now() - started) / 1000 });
JS
```

Verify aggregate row counts for the five application tables, favorite relationships, payment-state counts, indexes and search queries. If historical counts from the backup date are unavailable, record that limitation instead of claiming an exact match. Do not connect a test bot using the production bot token. A separate test bot cannot be assumed to reuse production Telegram media identifiers.

Record total recovery time including download/decryption and manual steps, validation results, tool versions and any errors. Securely remove the local plaintext artifacts and disposable database after inspection according to the environment's data-handling practices.

Finally, inspect Railway's PostgreSQL backup settings and record whether scheduled volume backups or PITR are enabled, their actual retention, and how to initiate recovery. Nightly Telegram delivery logs alone establish neither those settings nor tested recoverability.
