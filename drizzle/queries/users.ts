import { sql } from "drizzle-orm";

import { db } from "../db";
import type { InsertUser, SelectUser } from "../schema";

export type OptInStatus = "newUser" | "restored" | "alreadyOptedIn";

type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;
type UserData = Omit<SelectUser, "isIgnored">;

export async function optInUser({ userId, fullname, username }: UserDetails) {
    const [result] = await db.execute<{ status: OptInStatus }>(sql`
        with input as (
            select
                ${userId}::bigint as user_id,
                ${fullname}::varchar as fullname,
                ${username}::varchar as username
        ),
        inserted as (
            insert into users_table (user_id, fullname, username, uses_amount)
            select user_id, fullname, username, 0
            from input
            on conflict do nothing
            returning 'newUser'::text as status
        ),
        restored as (
            update users_table
            set
                fullname = input.fullname,
                username = input.username,
                uses_amount = 0,
                last_used_at = null,
                is_ignored = false
            from input
            where
                users_table.user_id = input.user_id
                and users_table.is_ignored = true
                and not exists (select 1 from inserted)
            returning 'restored'::text as status
        )
        select status from inserted
        union all
        select status from restored
        union all
        select 'alreadyOptedIn'::text as status
        where
            not exists (select 1 from inserted)
            and not exists (select 1 from restored)
        limit 1
    `);

    return result.status;
}

export async function optOutUser(userId: SelectUser["userId"]) {
    const [userData] = await db.execute<UserData>(sql`
        with target_user as (
            select
                user_id as "userId",
                fullname,
                username,
                last_used_at as "lastUsedAt",
                uses_amount as "usesAmount"
            from users_table
            where user_id = ${userId} and is_ignored = false
        ),
        updated_user as (
            update users_table
            set
                fullname = null,
                username = null,
                uses_amount = null,
                last_used_at = null,
                is_ignored = true
            from target_user
            where users_table.user_id = target_user."userId"
            returning users_table.user_id
        ),
        deleted_favorites as (
            delete from users_favorites_table
            using updated_user
            where users_favorites_table.user_id = updated_user.user_id
        )
        select * from target_user
    `);

    return userData ?? null;
}
