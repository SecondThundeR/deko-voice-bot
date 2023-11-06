import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { UsersDataSchema } from "@/src/schemas/usersData.ts";
import { favoriteVoicesIdsCache } from "@/src/cache/favoriteVoices.ts";

const dbName = databaseNames.deko;
const usersColName = collectionNames[dbName].usersData;

export async function updateFavoritesData(
    userID: number,
    favoritesIds: string[],
) {
    const db = client.database(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);

    const modifiedStatsData = await usersData.findAndModify(
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
