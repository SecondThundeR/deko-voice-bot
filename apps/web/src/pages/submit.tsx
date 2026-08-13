import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileAudioIcon, ShieldCheckIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
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
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { WebApp } from "@/lib/telegram";

const statusLabels = {
    uploading: "Загрузка",
    pending: "На проверке",
    processing: "Обработка",
    approved: "Одобрено",
    rejected: "Отклонено",
    failed: "Ошибка",
} as const;

export function SubmitPage() {
    const viewer = useQuery({ queryKey: ["viewer"], queryFn: api.viewer });
    const submissions = useQuery({
        queryKey: ["submissions"],
        queryFn: api.submissions,
        enabled: viewer.data?.hasConsent,
    });
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File>();

    const consent = useMutation({
        mutationFn: api.consent,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["viewer"] }),
        onError: (error) => toast.error(error.message),
    });
    const submit = useMutation({
        mutationFn: api.submit,
        onSuccess: () => {
            setTitle("");
            setFile(undefined);
            toast.success("Заявка отправлена");
            queryClient.invalidateQueries({ queryKey: ["submissions"] });
        },
        onError: (error) => toast.error(error.message),
    });

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) return toast.error("Выберите MP3-файл");
        const send = () => {
            const form = new FormData();
            form.set("title", title);
            form.set("file", file);
            submit.mutate(form);
        };
        if (WebApp?.requestWriteAccess) WebApp.requestWriteAccess(() => send());
        else send();
    }

    if (!viewer.data?.hasConsent) {
        return (
            <Empty className="flex-1">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <ShieldCheckIcon />
                    </EmptyMedia>
                    <EmptyTitle>Нужно согласие</EmptyTitle>
                    <EmptyDescription>
                        Для заявок и избранного мы сохраняем ваш Telegram ID,
                        профиль и историю действий. Просматривать каталог и
                        статистику можно без этого.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button
                        className="w-full"
                        onClick={() => consent.mutate()}
                        disabled={consent.isPending}
                    >
                        {consent.isPending ? (
                            <Spinner data-icon="inline-start" />
                        ) : null}
                        Подтвердить согласие
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Предложить реплику</CardTitle>
                    <CardDescription>
                        MP3 до 20 МБ. Не больше трёх заявок в сутки и
                        одновременно.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="submission-title">
                                    Название
                                </FieldLabel>
                                <Input
                                    id="submission-title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    minLength={1}
                                    maxLength={128}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="submission-file">
                                    MP3-файл
                                </FieldLabel>
                                <Input
                                    id="submission-file"
                                    type="file"
                                    accept="audio/mpeg,.mp3"
                                    onChange={(event) =>
                                        setFile(event.target.files?.[0])
                                    }
                                    required
                                />
                                <FieldDescription>
                                    Файл будет удалён из очереди после решения
                                    модератора.
                                </FieldDescription>
                            </Field>
                            <Button type="submit" disabled={submit.isPending}>
                                {submit.isPending ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <FileAudioIcon data-icon="inline-start" />
                                )}
                                Отправить
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Мои заявки</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {submissions.data?.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start justify-between gap-3"
                        >
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="truncate font-medium">
                                    {item.title}
                                </span>
                                {item.rejectionReason ? (
                                    <span className="text-muted-foreground">
                                        {item.rejectionReason}
                                    </span>
                                ) : null}
                            </div>
                            <Badge
                                variant={
                                    item.status === "rejected" ||
                                    item.status === "failed"
                                        ? "destructive"
                                        : item.status === "approved"
                                          ? "default"
                                          : "secondary"
                                }
                            >
                                {statusLabels[item.status]}
                            </Badge>
                        </div>
                    ))}
                    {submissions.data?.length === 0 ? (
                        <p className="text-muted-foreground">
                            Вы ещё ничего не предлагали.
                        </p>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
