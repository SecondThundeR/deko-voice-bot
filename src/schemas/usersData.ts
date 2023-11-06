import { ObjectId } from "@/deps.ts";

export interface UsersDataSchema {
    _id: ObjectId;
    userID: number;
    username?: string;
    fullName?: string;
    usesAmount: number;
    lastUsedAt?: number;
    favoritesIds?: string[];
}
