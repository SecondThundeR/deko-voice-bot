export class HttpError extends Error {
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 503;
    readonly code: string;

    constructor(
        status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 503,
        code: string,
        message: string,
    ) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.code = code;
    }
}
