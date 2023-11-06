import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";
import { favoriteVoicesIdsCache } from "@/src/cache/favoriteVoices.ts";

const dbName = databaseNames.deko;
const usersColName = collectionNames[dbName].usersStats;

export async function updateFavoritesData(
    userID: number,
    favoritesIds: string[],
) {
    const db = client.database(dbName);
    const usersStats = db.collection<UsersStatsSchema>(usersColName);

    const modifiedStatsData = await usersStats.findAndModify(
        { userID },
        {
            update: {
                $set: {
                    favoritesIds,
                },
            },
        },
    );

    if (!modifiedStatsData) return;
    favoriteVoicesIdsCache.set(userID, favoritesIds);
}
