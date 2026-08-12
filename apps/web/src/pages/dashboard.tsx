import { useQuery } from "@tanstack/react-query";
import { ActivityIcon, AudioLinesIcon, UsersIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

function formatNumber(value: number) {
    return new Intl.NumberFormat("ru-RU").format(value);
}

export function DashboardPage() {
    const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats });
    const leaderboards = useQuery({
        queryKey: ["leaderboards"],
        queryFn: api.leaderboards,
    });

    if (stats.error || leaderboards.error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Не удалось загрузить статистику</AlertTitle>
                <AlertDescription>
                    {stats.error?.message || leaderboards.error?.message}
                </AlertDescription>
            </Alert>
        );
    }

    if (!stats.data || !leaderboards.data) {
        return (
            <div className="grid gap-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    const cards = [
        {
            title: "Пользователи",
            value: stats.data.allUsedUsers,
            icon: UsersIcon,
        },
        {
            title: "Активны за месяц",
            value: stats.data.allMAUUsers,
            icon: ActivityIcon,
        },
        {
            title: "Отправлено реплик",
            value: stats.data.allUsedVoices,
            icon: AudioLinesIcon,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map(({ title, value, icon: Icon }) => (
                    <Card key={title}>
                        <CardHeader>
                            <Icon />
                            <CardDescription>{title}</CardDescription>
                            <CardTitle>{formatNumber(value)}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </section>
            <Card>
                <CardHeader>
                    <CardTitle>Самые активные</CardTitle>
                    <CardDescription>
                        Имена скрыты для обычных пользователей
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {leaderboards.data.mostUsedUsers.map((user) => (
                        <div
                            key={
                                user.visibility === "full"
                                    ? `${user.username}-${user.fullname}`
                                    : user.displayName
                            }
                            className="flex items-center justify-between gap-3"
                        >
                            <span className="truncate">
                                {user.visibility === "full"
                                    ? user.username
                                        ? `@${user.username}`
                                        : user.fullname || "Пользователь"
                                    : user.displayName}
                            </span>
                            <span className="font-medium">
                                {formatNumber(user.usesAmount)}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Популярные реплики</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {leaderboards.data.mostUsedVoices.map((voice) => (
                        <div
                            key={voice.voiceTitle}
                            className="flex items-center justify-between gap-3"
                        >
                            <span className="truncate">{voice.voiceTitle}</span>
                            <span className="font-medium">
                                {formatNumber(voice.usesAmount)}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
