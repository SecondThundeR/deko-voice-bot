import { useSuspenseQuery } from "@tanstack/react-query";
import { ActivityIcon, AudioLinesIcon, UsersIcon } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { leaderboardsQueryOptions, statsQueryOptions } from "@/lib/queries";

function formatNumber(value: number) {
    return new Intl.NumberFormat("ru-RU").format(value);
}

export function DashboardPage() {
    const stats = useSuspenseQuery(statsQueryOptions);
    const leaderboards = useSuspenseQuery(leaderboardsQueryOptions);

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
        <div className="flex animate-in flex-col gap-4 fade-in-0 duration-150 motion-reduce:animate-none">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map(({ title, value, icon: Icon }) => (
                    <Card
                        key={title}
                        className="last:col-span-2 sm:last:col-span-1"
                    >
                        <CardHeader>
                            <Icon className="size-5" />
                            <CardDescription>{title}</CardDescription>
                            <CardTitle>{formatNumber(value)}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </section>
            <Card>
                <CardHeader>
                    <CardTitle>Самые активные</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {leaderboards.data.mostUsedUsers.length === 0 ? (
                        <Empty className="min-h-28 p-4">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <UsersIcon />
                                </EmptyMedia>
                                <EmptyTitle>Пока нет активности</EmptyTitle>
                                <EmptyDescription>
                                    Здесь появятся самые активные пользователи
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        leaderboards.data.mostUsedUsers.map((user) => (
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
                        ))
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Популярные реплики</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {leaderboards.data.mostUsedVoices.length === 0 ? (
                        <Empty className="min-h-28 p-4">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <AudioLinesIcon />
                                </EmptyMedia>
                                <EmptyTitle>Реплик пока нет</EmptyTitle>
                                <EmptyDescription>
                                    Здесь появятся реплики, которые отправляют
                                    чаще всего
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        leaderboards.data.mostUsedVoices.map((voice) => (
                            <div
                                key={voice.voiceTitle}
                                className="flex items-center justify-between gap-3"
                            >
                                <span className="truncate">
                                    {voice.voiceTitle}
                                </span>
                                <span className="font-medium">
                                    {formatNumber(voice.usesAmount)}
                                </span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
