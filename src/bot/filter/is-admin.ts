import type { Context } from "../context";

export function isAdmin(ctx: Context) {
    return !!ctx.from && ctx.config.adminIds.includes(ctx.from.id);
}
