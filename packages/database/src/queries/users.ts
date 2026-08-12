import { and, eq } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertUser,
    type SelectUser,
    usersFavoritesTable,
    usersTable,
} from "../schema.ts";

type OptInStatus = "newUser" | "restored" | "alreadyOptedIn";
type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;
type UserData = Omit<SelectUser, "isIgnored">;

const userDataColumns = {
    userId: usersTable.userId,
    fullname: usersTable.fullname,
    username: usersTable.username,
    lastUsedAt: usersTable.lastUsedAt,
    usesAmount: usersTable.usesAmount,
};

export async function getUserData(userId: SelectUser["userId"]) {
    const [user] = await db
        .select(userDataColumns)
        .from(usersTable)
        .where(
            and(eq(usersTable.userId, userId), eq(usersTable.isIgnored, false)),
        );

    return user ?? null;
}

export async function getUserIsIgnoredStatus(userId: SelectUser["userId"]) {
    const [user] = await db
        .select({ isIgnored: usersTable.isIgnored })
        .from(usersTable)
        .where(eq(usersTable.userId, userId));

    return user?.isIgnored ?? null;
}

export async function optInUser({
    userId,
    fullname,
    username,
}: UserDetails): Promise<OptInStatus> {
    const [insertedUser] = await db
        .insert(usersTable)
        .values({ userId, fullname, username })
        .onConflictDoNothing()
        .returning({ userId: usersTable.userId });

    if (insertedUser) {
        return "newUser";
    }

    const [restoredUser] = await db
        .update(usersTable)
        .set({
            fullname,
            username,
            usesAmount: 0,
            lastUsedAt: null,
            isIgnored: false,
        })
        .where(
            and(eq(usersTable.userId, userId), eq(usersTable.isIgnored, true)),
        )
        .returning({ userId: usersTable.userId });

    if (restoredUser) {
        return "restored";
    }

    await db
        .update(usersTable)
        .set({ fullname, username })
        .where(
            and(eq(usersTable.userId, userId), eq(usersTable.isIgnored, false)),
        );

    return "alreadyOptedIn";
}

export async function optOutUser(
    userId: SelectUser["userId"],
): Promise<UserData | null> {
    return await db.transaction(async (tx) => {
        const [targetUser] = await tx
            .select()
            .from(usersTable)
            .where(eq(usersTable.userId, userId));

        if (!targetUser) {
            await tx
                .insert(usersTable)
                .values({
                    userId,
                    fullname: null,
                    username: null,
                    usesAmount: 0,
                    lastUsedAt: null,
                    isIgnored: true,
                })
                .onConflictDoUpdate({
                    target: usersTable.userId,
                    set: {
                        fullname: null,
                        username: null,
                        usesAmount: 0,
                        lastUsedAt: null,
                        isIgnored: true,
                    },
                });

            return null;
        }

        if (targetUser.isIgnored) {
            return null;
        }

        await tx
            .update(usersTable)
            .set({
                fullname: null,
                username: null,
                usesAmount: 0,
                lastUsedAt: null,
                isIgnored: true,
            })
            .where(eq(usersTable.userId, userId));

        await tx
            .delete(usersFavoritesTable)
            .where(eq(usersFavoritesTable.userId, userId));

        const { isIgnored, ...userData } = targetUser;

        return userData;
    });
}
