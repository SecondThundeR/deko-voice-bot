import { client } from "@/bot";

import { favoriteVoicesIdsCache } from "@/src/cache/favoriteVoices";

import { collectionNames, databaseNames } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = databaseNames.general;
const usersColName = collectionNames[dbName].usersData;

export async function updateFavoritesData(
    userID: number,
    favoritesIds: string[],
) {
    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);

    const modifiedStatsData = await usersData.findOneAndUpdate(
        { userID },
        {
            $set: {
                favoritesIds,
            },
        },
    );

    if (!modifiedStatsData) return;

    favoriteVoicesIdsCache.set(userID, favoritesIds);
}
