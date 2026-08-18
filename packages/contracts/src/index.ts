export const MAX_SUBMISSION_FILE_BYTES = 20 * 1024 * 1024;
export const SUBMISSION_RETENTION_DAYS = 90;
export const SUBMISSION_DAILY_LIMIT = 3;
export const SUBMISSION_PENDING_LIMIT = 3;
export const VOICE_ID_MAX_LENGTH = 64;
export const VOICE_TITLE_MAX_LENGTH = 128;
export const SUBMISSION_REJECTION_REASON_MAX_LENGTH = 512;
export const VOICE_ID_PATTERN = new RegExp(
    `^[A-Za-z0-9_-]{1,${VOICE_ID_MAX_LENGTH}}$`,
);

export type ApiError = {
    error: { code: string; message: string; requestId?: string };
};

export type Viewer = {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    isAdmin: boolean;
    hasConsent: boolean;
};

export type UserProfile =
    | {
          status: "active";
          userId: number;
          fullname: string | null;
          username: string | null;
          usesAmount: number;
          lastUsedAt: number | null;
      }
    | { status: "excluded" };

export type Stats = {
    allUsedUsers: number;
    allIgnoredUsers: number;
    allMAUUsers: number;
    allInactiveUsers: number;
    allUsedVoices: number;
};

export type LeaderboardUser =
    | {
          visibility: "masked";
          displayName: string;
          usesAmount: number;
          lastUsedAt: number | null;
      }
    | {
          visibility: "full";
          fullname: string | null;
          username: string | null;
          usesAmount: number;
          lastUsedAt: number | null;
      };

export type Leaderboards = {
    mostUsedUsers: LeaderboardUser[];
    lastUsedUsers: LeaderboardUser[];
    mostUsedVoices: Array<{ voiceTitle: string; usesAmount: number }>;
};

export type Voice = {
    voiceId: string;
    voiceTitle: string;
    usesAmount: number;
    isFavorite: boolean;
};

export type VoicesPage = { items: Voice[]; nextOffset: number | null };

export type SubmissionStatus =
    | "uploading"
    | "pending"
    | "processing"
    | "approved"
    | "rejected"
    | "failed";

export type Submission = {
    id: string;
    title: string;
    status: SubmissionStatus;
    rejectionReason: string | null;
    approvedVoiceId: string | null;
    createdAt: string;
    finalizedAt: string | null;
};

export type AdminSubmissionBucket = "queue" | "history";

export type AdminSubmission = Submission & {
    moderatorUserId: number | null;
    submitter: { id: number; fullname: string | null; username: string | null };
};

export type AdminSubmissionsPage = {
    items: AdminSubmission[];
    nextOffset: number | null;
};
