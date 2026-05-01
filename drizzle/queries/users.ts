import { and, eq } from "drizzle-orm";

import { db } from "../db";
import {
    type InsertUser,
    type SelectUser,
    usersFavoritesTable,
    usersTable,
} from "../schema";

export type OptInStatus = "newUser" | "restored" | "alreadyOptedIn";

type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;
type UserData = Omit<SelectUser, "isIgnored">;

export async function optInUser({
    userId,
    fullname,
    username,
}: UserDetails): Promise<OptInStatus> {
    return await db.transaction(async (tx) => {
        const [existing] = await tx
            .select({ isIgnored: usersTable.isIgnored })
            .from(usersTable)
            .where(eq(usersTable.userId, userId));

        if (!existing) {
            await tx.insert(usersTable).values({
                userId,
                fullname,
                username,
                usesAmount: 0,
                isIgnored: false,
            });
            return "newUser";
        }

        if (existing.isIgnored) {
            await tx
                .update(usersTable)
                .set({
                    fullname,
                    username,
                    usesAmount: 0,
                    lastUsedAt: null,
                    isIgnored: false,
                })
                .where(eq(usersTable.userId, userId));
            return "restored";
        }

        return "alreadyOptedIn";
    });
}

export async function optOutUser(
    userId: SelectUser["userId"],
): Promise<UserData | null> {
    return await db.transaction(async (tx) => {
        const [targetUser] = await tx
            .select({
                userId: usersTable.userId,
                fullname: usersTable.fullname,
                username: usersTable.username,
                lastUsedAt: usersTable.lastUsedAt,
                usesAmount: usersTable.usesAmount,
            })
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.userId, userId),
                    eq(usersTable.isIgnored, false),
                ),
            );

        if (!targetUser) return null;

        await tx
            .update(usersTable)
            .set({
                fullname: null,
                username: null,
                usesAmount: null,
                lastUsedAt: null,
                isIgnored: true,
            })
            .where(eq(usersTable.userId, userId));

        await tx
            .delete(usersFavoritesTable)
            .where(eq(usersFavoritesTable.userId, userId));

        return targetUser;
    });
}
