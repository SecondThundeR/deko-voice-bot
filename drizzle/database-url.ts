import * as v from "valibot";

const databaseUrlSchema = v.pipe(
    v.string("DATABASE_URL is not set"),
    v.nonEmpty("DATABASE_URL is not set"),
    v.url("DATABASE_URL is not a valid PostgreSQL connection URL"),
    v.check((input) => {
        try {
            const url = new URL(input);

            return (
                (url.protocol === "postgres:" ||
                    url.protocol === "postgresql:") &&
                url.hostname.length > 0 &&
                url.pathname.length > 1
            );
        } catch {
            return false;
        }
    }, "DATABASE_URL must be a PostgreSQL URL with a host and database name"),
);

export function parseDatabaseUrl(input: unknown) {
    return v.parse(databaseUrlSchema, input);
}

export function parseDatabaseUrlFromEnvironment(input: unknown) {
    try {
        return parseDatabaseUrl(input);
    } catch {
        throw new Error("Invalid DATABASE_URL configuration");
    }
}
