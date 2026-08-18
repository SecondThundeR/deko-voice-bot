import type { AdminSubmissionBucket } from "@deko-voice-bot/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const queryKeys = {
    viewer: ["viewer"] as const,
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
