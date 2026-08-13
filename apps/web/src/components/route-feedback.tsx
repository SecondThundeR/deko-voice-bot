import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoading() {
    return (
        <div
            className="flex flex-col gap-3"
            role="status"
            aria-label="Загрузка страницы"
        >
            <Skeleton className="h-28" />
            <Skeleton className="h-64" />
        </div>
    );
}

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
    const router = useRouter();
    const queryErrorResetBoundary = useQueryErrorResetBoundary();
    const message =
        error instanceof Error
            ? error.message
            : "Не удалось загрузить страницу";

    return (
        <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Ошибка загрузки</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
                <p>{message}</p>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        queryErrorResetBoundary.reset();
                        reset();
                        void router.invalidate();
                    }}
                >
                    <RotateCcwIcon data-icon="inline-start" />
                    Попробовать снова
                </Button>
            </AlertDescription>
        </Alert>
    );
}

export function RouteNotFound() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <AlertCircleIcon />
                </EmptyMedia>
                <EmptyTitle>Страница не найдена</EmptyTitle>
                <EmptyDescription>
                    Проверьте адрес или вернитесь на главную страницу
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
