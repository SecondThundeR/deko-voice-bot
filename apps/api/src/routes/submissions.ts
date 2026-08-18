import { randomUUID } from "node:crypto";
import {
    MAX_SUBMISSION_FILE_BYTES,
    SUBMISSION_DAILY_LIMIT,
    SUBMISSION_PENDING_LIMIT,
} from "@deko-voice-bot/contracts";
import {
    createVoiceSubmission,
    getUserVoiceSubmissions,
    markVoiceSubmissionFailed,
    markVoiceSubmissionPending,
    toSubmissionDto,
} from "@deko-voice-bot/database/queries/submissions.js";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { validateMp3Upload } from "../audio.ts";
import { HttpError } from "../errors.ts";
import { sendSubmissionToModeration } from "../telegram.ts";
import type { ApiEnv } from "../types.ts";
import { database, requireConsent } from "./helpers.ts";

export const submissionRoutes = new Hono<ApiEnv>()
    .get("/submissions", async (c) => {
        await requireConsent(c.var.user.id);
        const submissions = await database(() =>
            getUserVoiceSubmissions(c.var.user.id),
        );
        return c.json(submissions.map(toSubmissionDto));
    })
    .post(
        "/submissions",
        bodyLimit({
            maxSize: MAX_SUBMISSION_FILE_BYTES + 64 * 1024,
            onError: (c) =>
                c.json(
                    {
                        error: {
                            code: "FILE_TOO_LARGE",
                            message: "Файл превышает 20 МБ",
                            requestId: c.var.requestId,
                        },
                    },
                    413,
                ),
        }),
        async (c) => {
            await requireConsent(c.var.user.id);
            const form = await c.req.formData();
            const title = String(form.get("title") || "").trim();
            const file = form.get("file");
            if (title.length < 1 || title.length > 128)
                throw new HttpError(
                    400,
                    "INVALID_TITLE",
                    "Название должно содержать от 1 до 128 символов",
                );
            if (!(file instanceof File))
                throw new HttpError(400, "INVALID_FILE", "Выберите MP3-файл");
            await validateMp3Upload(file);
            const id = randomUUID();
            const submission = await database(() =>
                createVoiceSubmission({
                    id,
                    submitterUserId: c.var.user.id,
                    title,
                }),
            );
            if (!submission) {
                throw new HttpError(
                    429,
                    "SUBMISSION_LIMIT",
                    `Можно отправить не более ${SUBMISSION_DAILY_LIMIT} заявок за сутки и иметь не более ${SUBMISSION_PENDING_LIMIT} незавершённых`,
                );
            }
            try {
                const source = await sendSubmissionToModeration({
                    id,
                    title,
                    userId: c.var.user.id,
                    file,
                });
                const pending = await database(() =>
                    markVoiceSubmissionPending(id, source),
                );
                if (!pending)
                    throw new Error("Submission state changed while uploading");
                return c.json(toSubmissionDto(pending), 201);
            } catch (error) {
                await database(() => markVoiceSubmissionFailed(id));
                throw error;
            }
        },
    );
