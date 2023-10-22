import { ObjectId } from "@/deps.ts";

export interface UsersStatsSchema {
  _id: ObjectId;
  userID: number;
  username?: string;
  fullName?: string;
  usesAmount: number;
}
