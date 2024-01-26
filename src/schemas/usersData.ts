export interface UsersDataSchema {
    userID: number;
    username?: string;
    fullName?: string;
    usesAmount: number;
    lastUsedAt?: number;
    favoritesIds?: string[];
}
