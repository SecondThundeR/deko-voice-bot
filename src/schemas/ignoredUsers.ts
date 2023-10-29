import { ObjectId } from "@/deps.ts";

export interface IgnoredUsersSchema {
    _id: ObjectId;
    userID: number;
}
