import type { AdminSubmissionBucket } from "@deko-voice-bot/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type VoiceSort = "title" | "popularity" | "favorites";

export interface VoicesFilter {
    query: string;
    sort: VoiceSort;
}

export const queryKeys = {
    viewer: ["viewer"] as const,
    profile: ["profile"] as const,
    stats: ["stats"] as const,
    leaderboards: ["leaderboards"] as const,
    voices: {
        all: ["voices"] as const,
        list: ({ query, sort }: VoicesFilter) =>
            ["voices", { query, sort }] as const,
    },
    submissions: ["submissions"] as const,
    adminSubmissions: {
        all: ["admin-submissions"] as const,
        list: (bucket: AdminSubmissionBucket) =>
            ["admin-submissions", { bucket }] as const,
    },
    submissionAudio: (id: string) => ["submission-audio", id] as const,
};

export const viewerQueryOptions = queryOptions({
    queryKey: queryKeys.viewer,
    queryFn: api.viewer,
});

export const profileQueryOptions = queryOptions({
    queryKey: queryKeys.profile,
    queryFn: api.profile,
});

export const statsQueryOptions = queryOptions({
    queryKey: queryKeys.stats,
    queryFn: api.stats,
});

export const leaderboardsQueryOptions = queryOptions({
    queryKey: queryKeys.leaderboards,
    queryFn: api.leaderboards,
});

export function voicesQueryOptions({ query, sort }: VoicesFilter) {
    return infiniteQueryOptions({
        queryKey: queryKeys.voices.list({ query, sort }),
        queryFn: ({ pageParam }) => api.voices(query, sort, pageParam),
        initialPageParam: 0,
        getNextPageParam: (page) => page.nextOffset ?? undefined,
    });
}

export const submissionsQueryOptions = queryOptions({
    queryKey: queryKeys.submissions,
    queryFn: api.submissions,
});

export function adminSubmissionsQueryOptions(bucket: AdminSubmissionBucket) {
    return infiniteQueryOptions({
        queryKey: queryKeys.adminSubmissions.list(bucket),
        queryFn: ({ pageParam }) => api.adminSubmissions(bucket, pageParam),
        initialPageParam: 0,
        getNextPageParam: (page) => page.nextOffset ?? undefined,
    });
}

export function submissionAudioQueryOptions(id: string) {
    return queryOptions({
        queryKey: queryKeys.submissionAudio(id),
        queryFn: () => api.submissionAudio(id),
        gcTime: 0,
        staleTime: Number.POSITIVE_INFINITY,
    });
}
