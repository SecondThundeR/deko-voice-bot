import { and, eq, sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertUser,
    type SelectUser,
    usersFavoritesTable,
    usersTable,
} from "../schema.ts";

type OptInStatus = "newUser" | "restored" | "alreadyOptedIn";
type UserDetails = Omit<
    InsertUser,
    "analyticsEnabled" | "usesAmount" | "lastUsedAt"
>;
export type UserData = Omit<SelectUser, "analyticsEnabled"> & {
    analyticsEnabled: boolean;
    favoritesCount: number;
};
export type OptOutResult =
    | { status: "alreadyDisabled" }
    | { status: "disabled"; previousData: UserData | null };

const userDataColumns = {
    userId: usersTable.userId,
    fullname: usersTable.fullname,
    username: usersTable.username,
    lastUsedAt: usersTable.lastUsedAt,
    usesAmount: usersTable.usesAmount,
    analyticsEnabled: usersTable.analyticsEnabled,
    favoritesCount: sql<number>`(
        select cast(count(*) as int)
        from ${usersFavoritesTable}
        where ${usersFavoritesTable.userId} = ${usersTable.userId}
    )`,
};

export async function getUserData(userId: SelectUser["userId"]) {
    const [user] = await db
        .select(userDataColumns)
        .from(usersTable)
        .where(eq(usersTable.userId, userId));

    return user ?? null;
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

    if (insertedUser) return "newUser";

    const [restoredUser] = await db
        .update(usersTable)
        .set({
            fullname,
            username,
            usesAmount: 0,
            lastUsedAt: null,
            analyticsEnabled: true,
        })
        .where(
            and(
                eq(usersTable.userId, userId),
                eq(usersTable.analyticsEnabled, false),
            ),
        )
        .returning({ userId: usersTable.userId });

    if (restoredUser) return "restored";

    await db
        .update(usersTable)
        .set({ fullname, username })
        .where(eq(usersTable.userId, userId));
    return "alreadyOptedIn";
}

export async function optOutUser(
    userId: SelectUser["userId"],
): Promise<OptOutResult> {
    return db.transaction(async (tx) => {
        const [targetUser] = await tx
            .select(userDataColumns)
            .from(usersTable)
            .where(eq(usersTable.userId, userId));

        if (targetUser && !targetUser.analyticsEnabled) {
            return { status: "alreadyDisabled" };
        }

        await tx
            .insert(usersTable)
            .values({
                userId,
                fullname: null,
                username: null,
                usesAmount: 0,
                lastUsedAt: null,
                analyticsEnabled: false,
            })
            .onConflictDoUpdate({
                target: usersTable.userId,
                set: {
                    fullname: null,
                    username: null,
                    usesAmount: 0,
                    lastUsedAt: null,
                    analyticsEnabled: false,
                },
            });

        return {
            status: "disabled",
            previousData: targetUser ?? null,
        };
    });
}
