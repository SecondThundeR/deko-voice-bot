import { createHmac, timingSafeEqual } from "node:crypto";
import { createMiddleware } from "hono/factory";
import * as v from "valibot";
import { config } from "./config/index.ts";
import { HttpError } from "./http/errors.ts";
import type { ApiEnv, TelegramUser } from "./types.ts";

const MAX_AGE_SECONDS = 24 * 60 * 60;
const userSchema = v.object({
    id: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
    first_name: v.string(),
    last_name: v.optional(v.string()),
    username: v.optional(v.string()),
});

export function validateInitData(initData: string, now = Date.now()) {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");
    const check = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
    const secret = createHmac("sha256", "WebAppData")
        .update(config.botToken)
        .digest();
    const expected = createHmac("sha256", secret).update(check).digest();
    const actual = Buffer.from(hash, "hex");
    if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
    ) {
        return null;
    }
    const authDate = Number(params.get("auth_date"));
    if (
        !Number.isSafeInteger(authDate) ||
        authDate > Math.floor(now / 1_000) + 30 ||
        Math.floor(now / 1_000) - authDate > MAX_AGE_SECONDS
    ) {
        return null;
    }
    const rawUser = params.get("user");
    if (!rawUser) return null;
    try {
        const result = v.safeParse(userSchema, JSON.parse(rawUser));
        return result.success ? (result.output as TelegramUser) : null;
    } catch {
        return null;
    }
}

export const telegramAuth = createMiddleware<ApiEnv>(async (c, next) => {
    const match = c.req.header("authorization")?.match(/^tma\s+(.+)$/i);
    const user = match ? validateInitData(match[1]) : null;
    if (!user)
        throw new HttpError(
            401,
            "UNAUTHORIZED",
            "Недействительная сессия Telegram",
        );
    c.set("user", user);
    c.set("isAdmin", config.adminIds.includes(user.id));
    await next();
});
