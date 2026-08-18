import type { Viewer } from "@deko-voice-bot/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/queries";

const voiceCards = [0, 1] as const;

function LoadingFrame({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4" role="status" aria-label={label}>
            {children}
        </div>
    );
}

function SubmissionCardSkeleton() {
    return (
        <Card aria-hidden="true">
            <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
                <CardAction>
                    <Skeleton className="h-5 w-20" />
                </CardAction>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-7 w-full" />
            </CardContent>
        </Card>
    );
}

export function AdminSubmissionsSkeleton() {
    return (
        <LoadingFrame label="Загрузка заявок">
            <Alert aria-hidden="true">
                <AlertTriangleIcon />
                <AlertTitle>
                    <Skeleton className="h-3 w-20" />
                </AlertTitle>
                <AlertDescription>
                    <Skeleton className="h-3 w-64 max-w-full" />
                </AlertDescription>
            </Alert>
            <Skeleton className="h-8 w-full rounded-lg" aria-hidden="true" />
            <div className="flex flex-col gap-3">
                {voiceCards.map((card) => (
                    <SubmissionCardSkeleton key={card} />
                ))}
            </div>
        </LoadingFrame>
    );
}

function UserSubmissionsSkeleton() {
    return (
        <LoadingFrame label="Загрузка заявок">
            <Card aria-hidden="true">
                <CardHeader>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-7 w-full" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-7 w-full" />
                        <Skeleton className="h-3 w-56 max-w-full" />
                    </div>
                    <Skeleton className="h-7 w-full" />
                </CardContent>
            </Card>
            <Card aria-hidden="true">
                <CardHeader>
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {voiceCards.map((row) => (
                        <div
                            key={row}
                            className="flex items-center justify-between gap-3"
                        >
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </LoadingFrame>
    );
}

function ConsentPromptSkeleton() {
    return (
        <div
            className="flex flex-1"
            role="status"
            aria-label="Загрузка согласия"
        >
            <Empty aria-hidden="true">
                <EmptyHeader>
                    <EmptyMedia>
                        <Skeleton className="size-9" />
                    </EmptyMedia>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                    <Skeleton className="h-3 w-56 max-w-full" />
                </EmptyHeader>
                <EmptyContent>
                    <Skeleton className="h-7 w-full" />
                </EmptyContent>
            </Empty>
        </div>
    );
}

export function SubmitPageSkeleton() {
    const queryClient = useQueryClient();
    const viewer = queryClient.getQueryData<Viewer>(queryKeys.viewer);

    if (viewer?.isAdmin) return <AdminSubmissionsSkeleton />;
    return viewer?.hasConsent ? (
        <UserSubmissionsSkeleton />
    ) : (
        <ConsentPromptSkeleton />
    );
}
