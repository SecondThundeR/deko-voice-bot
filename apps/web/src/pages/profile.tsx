import type { UserProfile, Viewer } from "@deko-voice-bot/contracts";
import {
    type QueryClient,
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { ShieldXIcon, Trash2Icon, UserRoundCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { profileQueryOptions, queryKeys } from "@/lib/queries";
import { WebApp } from "@/lib/telegram";

const numberFormatter = new Intl.NumberFormat("ru-RU");
const idFormatter = new Intl.NumberFormat("ru-RU", { useGrouping: false });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
});
type ActiveUserProfile = Extract<UserProfile, { status: "active" }>;

function getInitial(value?: string) {
    return Array.from(value?.trim() ?? "")[0] ?? "";
}

function TelegramGreeting() {
    const user = WebApp?.initDataUnsafe.user;
    if (!user) return null;

    const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");
    const initials = `${getInitial(user.first_name)}${getInitial(
        user.last_name,
    )}`.toLocaleUpperCase("ru-RU");

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3">
                <Avatar size="lg">
                    {user.photo_url ? (
                        <AvatarImage
                            src={user.photo_url}
                            alt={`Аватар ${fullName}`}
                        />
                    ) : null}
                    <AvatarFallback>{initials || "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <CardTitle className="truncate">
                        Привет, {fullName}!
                    </CardTitle>
                    {user.username && (
                        <CardDescription>@{user.username}</CardDescription>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}

function updateViewerConsent(queryClient: QueryClient, hasConsent: boolean) {
    queryClient.setQueryData<Viewer>(queryKeys.viewer, (viewer) =>
        viewer ? { ...viewer, hasConsent } : viewer,
    );
}

function ActiveProfile({ profile }: { profile: ActiveUserProfile }) {
    const queryClient = useQueryClient();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const revokeConsent = useMutation({
        mutationFn: api.revokeConsent,
        onSuccess: async () => {
            setConfirmOpen(false);
            updateViewerConsent(queryClient, false);
            queryClient.setQueryData<UserProfile>(queryKeys.profile, {
                status: "excluded",
            });
            queryClient.removeQueries({ queryKey: queryKeys.submissions });
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.profile,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.viewer,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.voices.all,
                }),
            ]);
            toast.success("Вы исключены из статистики");
        },
        onError: (error) => toast.error(error.message),
    });

    const rows = [
        ["Telegram ID", idFormatter.format(profile.userId)],
        ["Полное имя", profile.fullname || "Не указано"],
        [
            "Имя пользователя",
            profile.username ? `@${profile.username}` : "Не указано",
        ],
        ["Отправлено реплик", numberFormatter.format(profile.usesAmount)],
        [
            "Последняя отправка",
            profile.lastUsedAt !== null
                ? dateFormatter.format(profile.lastUsedAt)
                : "Ещё не было",
        ],
    ] as const;

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Ваши данные</CardTitle>
                    <CardDescription>
                        Вся информация активного профиля, которую хранит бот
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <dl className="flex flex-col">
                        {rows.map(([label, value], index) => (
                            <div key={label}>
                                {index > 0 ? <Separator /> : null}
                                <div className="flex items-start justify-between gap-4 py-3">
                                    <dt className="text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="max-w-[60%] wrap-break-word text-right font-medium">
                                        {value}
                                    </dd>
                                </div>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Участие в статистике</CardTitle>
                    <CardDescription>
                        Эти данные помогают оценивать активность и составлять
                        список самых активных пользователей
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        При исключении полное имя, имя пользователя, счётчик
                        отправленных реплик, время последней отправки и
                        избранные реплики будут удалены без возможности
                        восстановления
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="destructive"
                        disabled={revokeConsent.isPending}
                        onClick={() => setConfirmOpen(true)}
                    >
                        <Trash2Icon data-icon="inline-start" />
                        Исключить из статистики
                    </Button>
                </CardFooter>
            </Card>
            <AlertDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    if (!revokeConsent.isPending) setConfirmOpen(open);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Исключить вас из статистики?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Профиль, статистика использования и избранное будут
                            очищены. При повторном включении сбор начнётся с
                            нуля
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={revokeConsent.isPending}>
                            Отмена
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={revokeConsent.isPending}
                            onClick={() => revokeConsent.mutate()}
                        >
                            {revokeConsent.isPending ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <Trash2Icon data-icon="inline-start" />
                            )}
                            Удалить данные
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function ExcludedProfile() {
    const queryClient = useQueryClient();
    const consent = useMutation({
        mutationFn: api.consent,
        onSuccess: async () => {
            updateViewerConsent(queryClient, true);
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.profile,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.viewer,
                }),
            ]);
            toast.success("Участие в статистике включено");
        },
        onError: (error) => toast.error(error.message),
    });

    return (
        <Empty className="flex-1">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ShieldXIcon />
                </EmptyMedia>
                <EmptyTitle>Активного профиля нет</EmptyTitle>
                <EmptyDescription>
                    Вы исключили себя из статистики или ещё не отправляли
                    реплики. Можно начать участие заново — прежние данные и
                    избранное не восстановятся.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <Button
                    className="w-full"
                    disabled={consent.isPending}
                    onClick={() => consent.mutate()}
                >
                    {consent.isPending ? (
                        <Spinner data-icon="inline-start" />
                    ) : (
                        <UserRoundCheckIcon data-icon="inline-start" />
                    )}
                    Участвовать в статистике
                </Button>
            </EmptyContent>
        </Empty>
    );
}

export function ProfilePage() {
    const profile = useSuspenseQuery(profileQueryOptions);
    const content =
        profile.data.status === "active" ? (
            <ActiveProfile profile={profile.data} />
        ) : (
            <ExcludedProfile />
        );

    return (
        <div className="flex flex-1 animate-in flex-col gap-4 fade-in-0 duration-150 motion-reduce:animate-none">
            <TelegramGreeting />
            {content}
        </div>
    );
}
