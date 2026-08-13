import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    type AudioSelection,
    LazyAudioTrimmer,
} from "@/components/lazy-audio-trimmer";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function AdminVoiceForm() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isDiscardOpen, setIsDiscardOpen] = useState(false);
    const [voiceId, setVoiceId] = useState("");
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File>();
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [selection, setSelection] = useState<AudioSelection>({
        startMs: 0,
        endMs: null,
    });
    const hasData =
        voiceId.length > 0 || title.length > 0 || file !== undefined;

    function resetForm() {
        setVoiceId("");
        setTitle("");
        setFile(undefined);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
        setAudioUrl(null);
        setSelection({ startMs: 0, endMs: null });
        setFileInputKey((key) => key + 1);
    }

    function closeDialog() {
        setIsOpen(false);
    }

    function requestClose() {
        if (add.isPending) return;
        if (hasData) setIsDiscardOpen(true);
        else closeDialog();
    }

    const add = useMutation({
        mutationFn: api.addVoice,
        onSuccess: () => {
            toast.success("Реплика добавлена");
            closeDialog();
            queryClient.invalidateQueries({
                queryKey: queryKeys.voices.all,
            });
        },
        onError: (error) => toast.error(error.message),
    });

    useEffect(
        () => () => {
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        },
        [],
    );

    function handleFile(nextFile?: File) {
        setFile(nextFile);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const nextUrl = nextFile ? URL.createObjectURL(nextFile) : null;
        audioUrlRef.current = nextUrl;
        setAudioUrl(nextUrl);
        setSelection({ startMs: 0, endMs: null });
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) return toast.error("Выберите MP3-файл");
        const form = new FormData();
        form.set("voiceId", voiceId);
        form.set("title", title);
        form.set("file", file);
        form.set("startMs", String(selection.startMs));
        form.set(
            "endMs",
            selection.endMs === null ? "" : String(selection.endMs),
        );
        add.mutate(form);
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open, details) => {
                if (open) setIsOpen(true);
                else {
                    details.cancel();
                    if (isDiscardOpen) setIsDiscardOpen(false);
                    else requestClose();
                }
            }}
            onOpenChangeComplete={(open) => {
                if (!open) {
                    setIsDiscardOpen(false);
                    resetForm();
                }
            }}
        >
            <DialogTrigger render={<Button variant="outline" />}>
                <PlusIcon data-icon="inline-start" /> Добавить
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "max-h-[calc(100dvh-2rem)] overflow-y-auto",
                    isDiscardOpen ? "sm:max-w-sm" : "sm:max-w-lg",
                )}
                showCloseButton={!add.isPending && !isDiscardOpen}
            >
                <div className="contents" hidden={isDiscardOpen}>
                    <DialogHeader>
                        <DialogTitle>Добавить реплику</DialogTitle>
                        <DialogDescription>
                            Реплика будет опубликована напрямую в каталоге без
                            пользовательской заявки
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSubmit}
                    >
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="admin-voice-id">
                                    ID реплики
                                </FieldLabel>
                                <Input
                                    id="admin-voice-id"
                                    value={voiceId}
                                    minLength={1}
                                    maxLength={64}
                                    pattern="[A-Za-z0-9_-]+"
                                    required
                                    disabled={add.isPending}
                                    onChange={(event) =>
                                        setVoiceId(event.target.value)
                                    }
                                />
                                <FieldDescription>
                                    Латинские буквы, цифры, дефис и
                                    подчёркивание
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="admin-voice-title">
                                    Название
                                </FieldLabel>
                                <Input
                                    id="admin-voice-title"
                                    value={title}
                                    minLength={1}
                                    maxLength={128}
                                    required
                                    disabled={add.isPending}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="admin-voice-file">
                                    MP3-файл
                                </FieldLabel>
                                <Input
                                    key={fileInputKey}
                                    id="admin-voice-file"
                                    type="file"
                                    accept="audio/mpeg,.mp3"
                                    required
                                    disabled={add.isPending}
                                    onChange={(event) =>
                                        handleFile(event.target.files?.[0])
                                    }
                                />
                            </Field>
                            {audioUrl ? (
                                <LazyAudioTrimmer
                                    src={audioUrl}
                                    onChange={setSelection}
                                />
                            ) : null}
                        </FieldGroup>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={add.isPending}
                                onClick={requestClose}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                disabled={add.isPending || !file}
                            >
                                {add.isPending ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <PlusIcon data-icon="inline-start" />
                                )}
                                Добавить в каталог
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
                {isDiscardOpen ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Закрыть форму добавления?</DialogTitle>
                            <DialogDescription>
                                Введённые данные и выбранный файл будут удалены.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                autoFocus
                                onClick={() => setIsDiscardOpen(false)}
                            >
                                Продолжить редактирование
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={closeDialog}
                            >
                                Закрыть и удалить данные
                            </Button>
                        </DialogFooter>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
