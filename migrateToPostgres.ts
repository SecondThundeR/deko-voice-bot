import { MongoClient } from "mongodb";
import { sql } from "drizzle-orm/sql";

import { db } from "@/drizzle/db";
import {
    featureFlagsTable,
    usersFavoritesTable,
    usersTable,
    voicesTable,
} from "@/drizzle/schema";

const MONGO_URL = process.env["MONGO_URL"];
const DATABASE_URL = process.env["DATABASE_URL"];
if (!MONGO_URL || !DATABASE_URL) {
    console.error("Some of URLs are missing. Make sure you set everything up");
    process.exit(1);
}

const mongoClient = new MongoClient(MONGO_URL);
const mongoGeneralDB = mongoClient.db("general");
const mongoFeatureFlagsCol = mongoGeneralDB.collection<{
    id: string;
    status: boolean;
}>("featureFlags");
const mongoIgnoredUsersCol = mongoGeneralDB.collection<{
    userID: number;
}>("ignoredUsers");
const mongoUsersDataCol = mongoGeneralDB.collection<{
    userID: number;
    username?: string;
    fullName?: string;
    usesAmount: number;
    lastUsedAt?: number;
    favoritesIds?: string[];
}>("usersData");
const mongoVoicesCol = mongoGeneralDB.collection<{
    id: string;
    title: string;
    url?: string;
    fileId?: string;
    voiceUniqueId: string;
    usesAmount: number;
}>("voices");

try {
    await mongoClient.connect();

    process.stdout.write("Migrating Feature Flags...");
    const mongoFeatureFlags = (await mongoFeatureFlagsCol.find().toArray()).map(
        ({ id, status }) => ({ name: id, status }),
    );
    if (mongoFeatureFlags.length > 0) {
        await db
            .insert(featureFlagsTable)
            .values(mongoFeatureFlags)
            .onConflictDoUpdate({
                target: featureFlagsTable.name,
                set: {
                    status: sql.raw(
                        `excluded.${featureFlagsTable.status.name}`,
                    ),
                },
            });
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("Migrating Feature Flags...done\n");

    process.stdout.write("Migrating Ignored Users...");
    const mongoIgnoredUsers = (await mongoIgnoredUsersCol.find().toArray()).map(
        ({ userID }) => ({
            userId: userID,
            usesAmount: null,
            lastUsedAt: null,
            isIgnored: true,
        }),
    );
    if (mongoIgnoredUsers.length > 0) {
        await db
            .insert(usersTable)
            .values(mongoIgnoredUsers)
            .onConflictDoUpdate({
                target: usersTable.userId,
                set: {
                    fullname: null,
                    username: null,
                    usesAmount: null,
                    lastUsedAt: null,
                    isIgnored: true,
                },
            });
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("Migrating Ignored Users...done\n");

    process.stdout.write("Migrating Active Users...");
    const mongoUsersData = await mongoUsersDataCol.find().toArray();
    const regularUsersData = mongoUsersData.map(
        ({ _id, userID, fullName, favoritesIds, ...rest }) => ({
            userId: userID,
            fullname: fullName,
            isIgnored: false,
            ...rest,
        }),
    );
    if (regularUsersData.length > 0) {
        await db
            .insert(usersTable)
            .values(regularUsersData)
            .onConflictDoUpdate({
                target: usersTable.userId,
                set: {
                    fullname: sql.raw(`excluded.${usersTable.fullname.name}`),
                    username: sql.raw(`excluded.${usersTable.username.name}`),
                    usesAmount: sql.raw(
                        `excluded.${usersTable.usesAmount.name}`,
                    ),
                    lastUsedAt: sql.raw(
                        `excluded.${usersTable.lastUsedAt.name}`,
                    ),
                    isIgnored: false,
                },
            });
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("Migrating Active Users...done\n");

    process.stdout.write("Migrating Voices...");
    const mongoVoices = (await mongoVoicesCol.find().toArray()).map(
        ({ _id, id, title, voiceUniqueId, ...rest }) => ({
            voiceId: id,
            voiceTitle: title,
            fileUniqueId: voiceUniqueId,
            ...rest,
        }),
    );
    if (mongoVoices.length > 0) {
        await db
            .insert(voicesTable)
            .values(mongoVoices)
            .onConflictDoUpdate({
                target: voicesTable.voiceId,
                set: {
                    voiceTitle: sql.raw(
                        `excluded.${voicesTable.voiceTitle.name}`,
                    ),
                    url: sql.raw(`excluded.${voicesTable.url.name}`),
                    fileId: sql.raw(`excluded.${voicesTable.fileId.name}`),
                    fileUniqueId: sql.raw(
                        `excluded.${voicesTable.fileUniqueId.name}`,
                    ),
                    usesAmount: sql.raw(
                        `excluded.${voicesTable.usesAmount.name}`,
                    ),
                },
            });
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("Migrating Voices...done\n");

    process.stdout.write("Migrating Users Favorites...");
    const userFavorites = mongoUsersData.flatMap((user) => {
        if (!user.favoritesIds || user.favoritesIds.length === 0) return [];

        return user.favoritesIds.map((voiceId) => ({
            userId: user.userID,
            voiceId,
        }));
    });
    if (userFavorites.length > 0) {
        await db
            .insert(usersFavoritesTable)
            .values(userFavorites)
            .onConflictDoNothing({
                target: [
                    usersFavoritesTable.userId,
                    usersFavoritesTable.voiceId,
                ],
            });
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("Migrating Users Favorites...done\n");
} catch (error) {
    console.error(error);
} finally {
    await mongoClient.close();
    process.exit(0);
}
